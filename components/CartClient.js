"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";
import { readCart, writeCart } from "../lib/cart/client-cart";
import { saveCheckoutContext } from "../lib/checkout/client-checkout-context";
import CheckoutGateModal from "./CheckoutGateModal";

export default function CartClient() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = getBrowserSupabaseClient();
      const value = await readCart("shop", supabase);
      setItems(value);
    };
    load();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  const persist = async (nextItems) => {
    setItems(nextItems);
    const supabase = getBrowserSupabaseClient();
    await writeCart("shop", nextItems, supabase);
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
    saveCheckoutContext({
      flow_type: "cart",
      entry_mode: entryMode,
      payment_amount: subtotal,
      donation_amount: 0,
      checkout_context: {
        cart_items: items
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

  return (
    <>
      <section className="section card">
        <h1 className="title">Cart</h1>
        {items.length === 0 ? (
          <p className="paragraph">Your cart is empty.</p>
        ) : (
          <>
            {items.map((item, index) => (
              <div key={`${item.item_id}-${index}`} className="card" style={{ marginBottom: "12px" }}>
                <p className="paragraph">
                  <strong>{item.metadata?.product_name || `Product ${item.item_id}`}</strong>
                  <br />
                  Size: {item.size || "N/A"}
                  <br />
                  Unit price: ${Number(item.unit_price || 0).toFixed(2)}
                </p>
                <div className="form-row">
                  <label className="paragraph">
                    Qty
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateQuantity(index, event.target.value)}
                    />
                  </label>
                  <button type="button" className="menu-button" onClick={() => removeItem(index)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <p className="paragraph">
              <strong>Total: ${subtotal.toFixed(2)}</strong>
            </p>
          </>
        )}
        <div className="button-row" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="button secondary" onClick={() => router.push("/shop")}>
            Back to shopping
          </button>
          <button type="button" className="button" onClick={() => setGateOpen(true)} disabled={items.length === 0}>
            Checkout
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
