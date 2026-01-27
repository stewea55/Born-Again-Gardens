import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY is not set. Stripe payments will not work.");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";

/**
 * Create a payment intent for a given amount with validation
 */
export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }

  // Validate amount
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  // Maximum payment amount: $100,000
  if (amount > 100000) {
    throw new Error("Payment amount exceeds maximum allowed");
  }

  // Minimum payment amount: $0.50
  if (amount < 0.5) {
    throw new Error("Payment amount must be at least $0.50");
  }

  // Convert amount to cents (Stripe uses smallest currency unit)
  const amountInCents = Math.round(amount * 100);

  // Validate amount in cents is reasonable
  if (amountInCents < 50 || amountInCents > 10000000) {
    throw new Error("Invalid payment amount");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

/**
 * Confirm a payment intent with a payment method
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }

  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
    return_url: process.env.BASE_URL || "http://localhost:5000",
  });

  return paymentIntent;
}

/**
 * Retrieve a payment intent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}
