"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";
import { readCart, writeCart } from "../lib/cart/client-cart";
import { saveCheckoutContext } from "../lib/checkout/client-checkout-context";
import CheckoutGateModal from "./CheckoutGateModal";

export default function BasketClient() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [finalAmount, setFinalAmount] = useState("0");
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = getBrowserSupabaseClient();
      const value = await readCart("harvest", supabase);
      setItems(value);
    };
    load();
  }, []);

  const recommendedAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  useEffect(() => {
    setFinalAmount(recommendedAmount.toFixed(2));
  }, [recommendedAmount]);

  const persist = async (nextItems) => {
    setItems(nextItems);
    const supabase = getBrowserSupabaseClient();
    await writeCart("harvest", nextItems, supabase);
  };

  const updateQuantity = async (index, quantity) => {
    const next = [...items];
    next[index] = { ...next[index], quantity: Math.max(1, Number(quantity || 1)) };
    await persist(next);
  };

  const removeItem = async (index) => {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    await persist(next);
  };

  const proceedToPayment = (entryMode, user = null) => {
    const parsedFinalAmount = Math.max(0, Number(finalAmount || 0));
    const donationAmount = Math.max(0, parsedFinalAmount - recommendedAmount);

    saveCheckoutContext({
      flow_type: "basket",
      entry_mode: entryMode,
      payment_amount: parsedFinalAmount,
      donation_amount: donationAmount,
      checkout_context: {
        basket_items: items,
        recommended_amount: recommendedAmount
      },
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

  const handleConfirmCheckout = async () => {
    if (items.length === 0) return;
    const supabase = getBrowserSupabaseClient();
    const session = supabase ? (await supabase.auth.getSession()).data?.session : null;
    if (session?.user) {
      proceedToPayment("google", session.user);
      return;
    }
    setGateOpen(true);
  };

  const isBasketEmpty = items.length === 0;

  return (
    <>
      <section className="section card">
        <h1 className="title">My Basket</h1>
        {items.length === 0 ? (
          <p className="paragraph">Your basket is empty.</p>
        ) : (
          <>
            {items.map((item, index) => (
              <div key={`${item.item_id}-${index}`} className="card" style={{ marginBottom: "12px" }}>
                <p className="paragraph" style={{ marginBottom: "6px" }}>
                  <strong>{item.metadata?.plant_name || `Plant ${item.item_id}`}</strong>
                </p>
                <div className="basket-item-meta-row">
                  <p className="paragraph" style={{ marginBottom: 0 }}>
                    <strong>Market price:</strong> ${Number(item.unit_price || 0).toFixed(2)}
                  </p>
                  <label className="paragraph basket-qty-inline" style={{ marginBottom: 0 }}>
                    Qty
                    <input
                      className="basket-qty-input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateQuantity(index, event.target.value)}
                    />
                  </label>
                </div>
                <div className="payment-amount-row" style={{ marginTop: "8px", justifyContent: "center" }}>
                  <button type="button" className="menu-button" onClick={() => removeItem(index)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        <p className="paragraph">
          <strong>Recommended amount:</strong> ${recommendedAmount.toFixed(2)}
        </p>
        <div className="payment-amount-input-wrap" style={{ marginTop: "16px" }}>
          <label className="paragraph">
            Final amount (editable)
            <input
              type="number"
              min="0"
              step="0.01"
              value={finalAmount}
              onChange={(event) => setFinalAmount(event.target.value)}
            />
          </label>
        </div>
        <div className="button-row" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="button secondary" onClick={() => router.push("/harvest")}>
            Back to harvest
          </button>
          <button type="button" className="button" onClick={handleConfirmCheckout} disabled={isBasketEmpty}>
            Confirm and checkout
          </button>
        </div>
      </section>

      <CheckoutGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onContinueGuest={() => {
          setGateOpen(false);
          proceedToPayment("guest");
        }}
        onGoogleSuccess={(user) => {
          setGateOpen(false);
          proceedToPayment("google", user);
        }}
      />
    </>
  );
}
