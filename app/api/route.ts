import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

type CartLine = { product?: { id?: unknown }; variant_id?: unknown; quantity?: unknown };
type Wanted = { productId: string; variantId: string | null; quantity: number };

const UUID = /^[0-9a-fA-F-]{36}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: CartLine[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
    }
    if (items.length > 30) {
      return NextResponse.json({ error: "Votre panier contient trop d’articles." }, { status: 400 });
    }

    // Du navigateur, on ne garde que l'article, la taille choisie et la quantité.
    // Le prix, le titre et le stock sont relus dans la base.
    const wanted = new Map<string, Wanted>();
    for (const item of items) {
      const productId = typeof item?.product?.id === "string" ? item.product.id : "";
      const variantId =
        typeof item?.variant_id === "string" && item.variant_id !== "" ? item.variant_id : null;
      const quantity = Number(item?.quantity);
      if (
        !UUID.test(productId) ||
        (variantId !== null && !UUID.test(variantId)) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
      }
      const key = productId + "|" + (variantId || "");
      const existing = wanted.get(key);
      wanted.set(key, {
        productId,
        variantId,
        quantity: (existing ? existing.quantity : 0) + quantity,
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const productIds = Array.from(new Set(Array.from(wanted.values()).map((w) => w.productId)));
    const { data: products, error: productError } = await supabase
      .from("boutique_products")
      .select("id,title,price_cents,image_url,stock")
      .in("id", productIds);
    const { data: variants, error: variantError } = await supabase
      .from("product_variants")
      .select("id,product_id,label,stock")
      .in("product_id", productIds);

    if (productError || variantError || !products || !variants || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Un article de votre panier n’est plus disponible." },
        { status: 400 }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const w of Array.from(wanted.values())) {
      const product = products.find((p: any) => p.id === w.productId);
      if (!product) {
        return NextResponse.json({ error: "Un article de votre panier n’est plus disponible." }, { status: 400 });
      }
      const productVariants = variants.filter((v: any) => v.product_id === w.productId);

      let name: string = product.title;
      let available: number = product.stock;
      const metadata: Record<string, string> = { product_id: product.id };

      if (productVariants.length > 0) {
        const variant = productVariants.find((v: any) => v.id === w.variantId);
        if (!variant) {
          return NextResponse.json(
            { error: `Choisissez une taille pour « ${product.title} ».` },
            { status: 400 }
          );
        }
        name = `${product.title} (${variant.label})`;
        available = variant.stock;
        metadata.variant_id = variant.id;
        metadata.variant_label = variant.label;
      } else if (w.variantId) {
        return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
      }

      if (available < w.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour « ${name} » (${available} disponible).` },
          { status: 409 }
        );
      }
      if (!Number.isInteger(product.price_cents) || product.price_cents < 50) {
        return NextResponse.json({ error: "Prix invalide pour un article." }, { status: 400 });
      }

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name,
            images: product.image_url ? [product.image_url] : [],
            metadata,
          },
          unit_amount: product.price_cents,
        },
        quantity: w.quantity,
      });
    }

    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "bancontact"],
      line_items: lineItems,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["BE", "FR", "LU", "NL"],
      },
      success_url: `${origin}/boutique?paiement=succes`,
      cancel_url: `${origin}/boutique?paiement=annule`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error", err);
    return NextResponse.json(
      { error: "Impossible d’ouvrir le paiement pour le moment." },
      { status: 500 }
    );
  }
}
