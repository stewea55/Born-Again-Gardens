import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeClient } from "../../../../lib/checkout/stripe";
import { finalizeCheckoutByStripeId } from "../../../../lib/checkout/pending";

export async function POST(request) {
  try {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: { code: "webhook_not_configured", message: "Stripe webhook is not configured." } },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signature = (await headers()).get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: { code: "signature_missing", message: "Missing Stripe signature." } },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await finalizeCheckoutByStripeId({
        stripeId: session.id,
        status: "paid"
      });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await finalizeCheckoutByStripeId({
        stripeId: session.id,
        status: "failed"
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "webhook_failed", message: error.message || "Webhook failed." } },
      { status: 400 }
    );
  }
}
