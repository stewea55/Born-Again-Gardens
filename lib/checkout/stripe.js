import Stripe from "stripe";

let stripeClient = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" });
  }
  return stripeClient;
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
