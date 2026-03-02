"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CheckoutGateModal from "./CheckoutGateModal";
import { saveCheckoutContext } from "../lib/checkout/client-checkout-context";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";

const SUGGESTED_AMOUNTS = [50, 100, 150, 200];

export default function DonateOptions() {
  const router = useRouter();
  const [amount, setAmount] = useState("50");
  const [gateOpen, setGateOpen] = useState(false);

  const proceed = (entryMode, user = null) => {
    const paymentAmount = Number(amount || 0);
    saveCheckoutContext({
      flow_type: "donate",
      entry_mode: entryMode,
      payment_amount: paymentAmount,
      donation_amount: paymentAmount,
      checkout_context: {},
      guest: entryMode === "guest" ? { full_name: "", email: "" } : null,
      google_user: user
        ? {
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
            email: user.email || ""
          }
        : null
    });
    router.push("/payment");
  };

  const handleConfirmClick = async () => {
    const paymentAmount = Number(amount || 0);
    if (paymentAmount <= 0) return;
    const supabase = getBrowserSupabaseClient();
    const session = supabase ? (await supabase.auth.getSession()).data?.session : null;
    if (session?.user) {
      proceed("google", session.user);
      return;
    }
    setGateOpen(true);
  };

  const isAmountInvalid = Number(amount || 0) <= 0;

  return (
    <>
      <section id="donation-options" className="section card">
        <h2 className="subheading">Donation Options</h2>
        <p className="paragraph">Choose a recommended amount or enter your own.</p>
        <div className="payment-amount-buttons">
          {SUGGESTED_AMOUNTS.map((suggested) => (
            <button key={suggested} type="button" className="menu-button" onClick={() => setAmount(String(suggested))}>
              ${suggested}
            </button>
          ))}
        </div>
        <div className="payment-amount-input-wrap">
          <label className="paragraph">
            Donation amount
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
        </div>
        <div className="button-row" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="button" onClick={handleConfirmClick} disabled={isAmountInvalid}>
            Confirm
          </button>
          <button type="button" className="button secondary" onClick={() => router.push("/sponsorships")}>
            Donating on behalf of a company?
          </button>
        </div>
      </section>

      <CheckoutGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onContinueGuest={() => {
          setGateOpen(false);
          proceed("guest");
        }}
        onGoogleSuccess={(user) => {
          setGateOpen(false);
          proceed("google", user);
        }}
      />
    </>
  );
}
