import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://vercel.app";

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.product.title,
          images: item.product.image_url ? [item.product.image_url] : [],
        },
        unit_amount: item.product.price_cents,
      },
      quantity: item.quantity,
    }));

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
