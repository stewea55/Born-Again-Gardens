import { NextResponse } from "next/server";
import { validateCheckoutInput } from "../../../../lib/checkout/validate";
import {
  createPendingCheckout,
  insertTransactionForCheckoutSession
} from "../../../../lib/checkout/pending";
import { getStripeClient, getAppBaseUrl } from "../../../../lib/checkout/stripe";
import { getAuthedServerSupabaseClient } from "../../../../lib/supabase/authed-server";

function errorResponse(code, message, status = 400, details = {}) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = validateCheckoutInput(body);
    if (!validation.ok) {
      return errorResponse("validation_failed", validation.message, 422, validation.details);
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return errorResponse(
        "stripe_not_configured",
        "Stripe is not configured. Add STRIPE_SECRET_KEY in test mode.",
        500
      );
    }

    const input = validation.data;
    let userId = null;
    if (input.entry_mode === "google") {
      const token = getBearerToken(request);
      const supabase = getAuthedServerSupabaseClient(token);
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        userId = data?.user?.id ?? null;
      }
      if (!userId) {
        return errorResponse("unauthorized", "Google checkout requires a valid session.", 401);
      }
    }

    const { guestId } = await createPendingCheckout(input);
    const amountCents = Math.round(input.payment_amount * 100);
    const baseUrl = getAppBaseUrl();
    const label = input.flow_type === "donate" ? "Donation" : "Garden payment";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      return_url: `${baseUrl}/payment/return?session_id={CHECKOUT_SESSION_ID}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: label
            }
          }
        }
      ],
      ...(input.guest?.email && { customer_email: input.guest.email }),
      ...(input.flow_type === "donate" && { submit_type: "donate" })
    });

    await insertTransactionForCheckoutSession({
      sessionId: session.id,
      guestId,
      userId,
      paymentAmount: input.payment_amount,
      donationAmount: input.donation_amount ?? 0
    });

    return NextResponse.json({
      data: {
        client_secret: session.client_secret,
        return_url: `${baseUrl}/payment/return?session_id={CHECKOUT_SESSION_ID}`,
        status: "pending"
      },
      meta: {}
    });
  } catch (error) {
    return errorResponse("stripe_failed", error.message || "Unable to create checkout session.", 500);
  }
}
