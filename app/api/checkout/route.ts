import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

type CartLine = { product?: { id?: unknown }; quantity?: unknown };

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

    // On ne garde du navigateur que l'identifiant et la quantité : le prix est relu dans la base.
    const wanted = new Map<string, number>();
    for (const item of items) {
      const id = typeof item?.product?.id === "string" ? item.product.id : "";
      const quantity = Number(item?.quantity);
      if (!/^[0-9a-fA-F-]{36}$/.test(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
      }
      wanted.set(id, (wanted.get(id) || 0) + quantity);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: products, error } = await supabase
      .from("boutique_products")
      .select("id,title,price_cents,image_url,stock")
      .in("id", Array.from(wanted.keys()));

    if (error || !products || products.length !== wanted.size) {
      return NextResponse.json(
        { error: "Un article de votre panier n’est plus disponible." },
        { status: 400 }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const p of products) {
      const quantity = wanted.get(p.id) || 0;
      if (p.stock < quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour « ${p.title} » (${p.stock} disponible).` },
          { status: 409 }
        );
      }
      if (!Number.isInteger(p.price_cents) || p.price_cents < 50) {
        return NextResponse.json({ error: "Prix invalide pour un article." }, { status: 400 });
      }
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: p.title,
            images: p.image_url ? [p.image_url] : [],
            metadata: { product_id: p.id },
          },
          unit_amount: p.price_cents,
        },
        quantity,
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
