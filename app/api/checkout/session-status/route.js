import { NextResponse } from "next/server";
import { getStripeClient } from "../../../../lib/checkout/stripe";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { error: { code: "invalid_session", message: "Missing or invalid session_id." } },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: { code: "stripe_not_configured", message: "Stripe is not configured." } },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const status = session.status;
    const customerEmail = session.customer_details?.email ?? null;

    return NextResponse.json({
      data: { status, customer_email: customerEmail },
      meta: {}
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "session_retrieve_failed", message: error.message || "Could not retrieve session." } },
      { status: 400 }
    );
  }
}
