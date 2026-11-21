import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!signature || !secret || !serviceKey) {
    return NextResponse.json({ error: "Configuration manquante." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  try {
    const sessionId = (event.data.object as Stripe.Checkout.Session).id;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    // Évite d'enregistrer deux fois la même commande.
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ received: true });
    }

    const lines = session.line_items?.data ?? [];
    const productIds = lines
      .map((l) => ((l.price?.product as Stripe.Product | undefined)?.metadata?.product_id) || "")
      .filter((id) => id !== "");

    const { data: products } = await supabase
      .from("boutique_products")
      .select("id,seller_id")
      .in("id", productIds);
    const sellerOf = new Map<string, string | null>(
      (products || []).map((p: any) => [p.id as string, (p.seller_id as string | null) ?? null])
    );

    const shipping = (session as any).shipping_details;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_email: session.customer_details?.email ?? null,
        shipping_name: shipping?.name ?? null,
        shipping_address: shipping?.address ?? null,
        status: "paid",
        amount_total_cents: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("order insert error", orderError);
      return NextResponse.json({ error: "Commande non enregistrée." }, { status: 500 });
    }

    for (const line of lines) {
      const productId =
        (line.price?.product as Stripe.Product | undefined)?.metadata?.product_id ||
        }
