"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";
import {
  readCheckoutContext,
  saveCheckoutContext
} from "../lib/checkout/client-checkout-context";

const stripePromise = typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function PaymentClient() {
  const [context, setContext] = useState(null);
  const [status, setStatus] = useState("");
  const [guest, setGuest] = useState({ full_name: "", email: "" });
  const [readyForCheckout, setReadyForCheckout] = useState(false);
  const [checkoutPayload, setCheckoutPayload] = useState(null);

  useEffect(() => {
    const saved = readCheckoutContext();
    if (!saved) return;
    setContext(saved);
    if (saved.guest) setGuest(saved.guest);
  }, []);

  const summary = useMemo(() => {
    if (!context) return null;
    return {
      flowType: context.flow_type,
      entryMode: context.entry_mode,
      paymentAmount: Number(context.payment_amount || 0),
      donationAmount: Number(context.donation_amount || 0)
    };
  }, [context]);

  const prefillGoogleIfNeeded = async () => {
    if (!context || context.entry_mode !== "google") return;
    if (context.google_user?.email) return;

    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (!user) return;

    const updated = {
      ...context,
      google_user: {
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email || ""
      }
    };
    setContext(updated);
    saveCheckoutContext(updated);
  };

  useEffect(() => {
    prefillGoogleIfNeeded();
  }, [context]);

  const buildPayload = useCallback(() => {
    if (!context) return null;
    const payload = {
      flow_type: context.flow_type,
      entry_mode: context.entry_mode,
      payment_amount: Number(context.payment_amount || 0),
      donation_amount: Number(context.donation_amount || 0),
      checkout_context: context.checkout_context || {}
    };
    if (context.entry_mode === "guest") {
      if (!guest.full_name.trim() || !guest.email.trim()) return null;
      payload.guest = {
        full_name: guest.full_name.trim(),
        email: guest.email.trim()
      };
    }
    if (context.entry_mode === "google") {
      if (!context.google_user?.email) return null;
    }
    return payload;
  }, [context, guest]);

  const proceedToCheckout = () => {
    const payload = buildPayload();
    if (!payload) {
      if (context?.entry_mode === "guest") {
        setStatus("Guest checkout requires full name and email.");
      } else if (context?.entry_mode === "google" && !context?.google_user?.email) {
        setStatus("Please sign in again with Google and retry payment.");
      } else {
        setStatus("Missing checkout context. Please return to your flow and confirm again.");
      }
      return;
    }
    setStatus("");
    setCheckoutPayload(payload);
    setReadyForCheckout(true);
  };

  const fetchClientSecret = useCallback(async () => {
    if (!checkoutPayload) throw new Error("No checkout payload.");
    const headers = { "Content-Type": "application/json" };
    if (checkoutPayload.entry_mode === "google") {
      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
    }
    const response = await fetch("/api/checkout/sessions", {
      method: "POST",
      headers,
      body: JSON.stringify(checkoutPayload)
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error?.message || "Unable to create checkout session.");
    }
    return json.data.client_secret;
  }, [checkoutPayload]);

  if (!summary) {
    return (
      <section className="section card">
        <h1 className="title">Payment</h1>
        <p className="paragraph">
          No payment context found yet. Please start from `/shop`, `/basket`, or `/donate`.
        </p>
      </section>
    );
  }

  if (!stripePromise) {
    return (
      <section className="section card">
        <h1 className="title">Payment</h1>
        <p className="paragraph">
          Payment is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout.
        </p>
      </section>
    );
  }

  if (readyForCheckout && checkoutPayload) {
    return (
      <section className="section card">
        <h1 className="title">Payment</h1>
        <p className="paragraph">
          Payment total: ${summary.paymentAmount.toFixed(2)}
          {summary.donationAmount > 0 && (
            <> (donation: ${summary.donationAmount.toFixed(2)})</>
          )}
        </p>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </section>
    );
  }

  return (
    <section className="section card">
      <h1 className="title">Payment</h1>
      <p className="paragraph">
        Flow: {summary.flowType}
        <br />
        Payment total: ${summary.paymentAmount.toFixed(2)}
        <br />
        Donation portion: ${summary.donationAmount.toFixed(2)}
      </p>

      {summary.entryMode === "guest" && (
        <div className="section">
          <h2 className="subheading">Guest details</h2>
          <label className="paragraph">
            Full name
            <input
              type="text"
              value={guest.full_name}
              onChange={(event) => setGuest((prev) => ({ ...prev, full_name: event.target.value }))}
            />
          </label>
          <label className="paragraph">
            Email
            <input
              type="email"
              value={guest.email}
              onChange={(event) => setGuest((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
        </div>
      )}

      {summary.entryMode === "google" && (
        <div className="section">
          <h2 className="subheading">Google checkout</h2>
          <p className="paragraph">
            Signed in as: {context?.google_user?.email || "Not detected yet"}
          </p>
        </div>
      )}

      <div className="button-row" style={{ justifyContent: "flex-start" }}>
        <button type="button" className="button" onClick={proceedToCheckout}>
          Continue to payment
        </button>
      </div>
      {status && <p className="paragraph">{status}</p>}
    </section>
  );
}
