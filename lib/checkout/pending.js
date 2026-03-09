import { getServerSupabaseClient } from "../supabase/server";

/**
 * Cart/basket stored as jsonb: arrays of line items.
 * guests.cart = shop cart items, guests.basket = harvest basket items.
 */
function getCartBasketJsonb(input) {
  const cartItems = Array.isArray(input.checkout_context?.cart_items) ? input.checkout_context.cart_items : [];
  const basketItems = Array.isArray(input.checkout_context?.basket_items) ? input.checkout_context.basket_items : [];
  return { cartItems, basketItems };
}

/**
 * Creates only the guest row for checkout when entry_mode is "guest".
 * When entry_mode is "google", no guest row; caller passes userId for transaction.
 * guests.cart and guests.basket are jsonb (arrays of items).
 */
export async function createPendingCheckout(input) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase server client is not configured.");
  }

  let guestId = null;

  if (input.entry_mode === "guest") {
    const { cartItems, basketItems } = getCartBasketJsonb(input);
    const { data, error } = await supabase
      .from("guests")
      .insert({
        full_name: input.guest.full_name,
        email: input.guest.email,
        payment_amount: input.payment_amount,
        donation_amount: input.donation_amount || 0,
        cart: cartItems,
        basket: basketItems
      })
      .select("id")
      .single();
    if (error) throw error;
    guestId = data.id;
  }

  return { guestId };
}

/**
 * Inserts a transaction row after the Stripe Checkout Session is created.
 * For guest checkout: guestId set, user_id null. For logged-in: userId set, guest_id null.
 */
export async function insertTransactionForCheckoutSession({
  sessionId,
  guestId,
  userId,
  paymentAmount,
  donationAmount,
  flowType,
  checkoutContext
}) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase server client is not configured.");
  }
  const { error } = await supabase.from("transaction").insert({
    user_id: userId ?? null,
    guest_id: guestId ?? null,
    payment: paymentAmount,
    donation_amount: donationAmount ?? 0,
    flow_type: flowType ?? null,
    checkout_context: checkoutContext ?? null,
    status: "pending",
    stripe_id: sessionId
  });
  if (error) throw error;
}

async function finalizeTreeDedication(supabase, txn) {
  const { data: claimResult, error: claimError } = await supabase.rpc("claim_tree_campaign_unit");
  if (claimError) throw claimError;

  const claimRow = Array.isArray(claimResult) ? claimResult[0] : claimResult;
  if (!claimRow) {
    return { status: "sold_out" };
  }

  const checkoutContext = txn?.checkout_context || {};
  const fullName = String(checkoutContext.full_name || "").trim();
  const email = String(checkoutContext.email || "").trim();
  const dedicationText = String(checkoutContext.dedication_text || "").trim();
  const dedicationImage = checkoutContext.dedication_image == null
    ? null
    : String(checkoutContext.dedication_image).trim() || null;

  if (!fullName || !email || !dedicationText) {
    return { status: "failed" };
  }

  const { error: dedicationError } = await supabase.from("tree_dedications").insert({
    transaction_id: txn.id,
    full_name: fullName,
    email,
    dedication_text: dedicationText,
    dedication_image: dedicationImage,
    payment_confirmation: "paid"
  });

  if (dedicationError) throw dedicationError;
  return { status: "paid" };
}

/**
 * On successful payment: write basket items to harvest_quantity (upsert by plant_id), then clear basket.
 * Updates transaction status by Stripe session id (used by webhook).
 */
export async function finalizeCheckoutByStripeId({ stripeId, status }) {
  const supabase = getServerSupabaseClient();
  if (!supabase) return;

  const isPaid = status === "paid";

  let nextStatus = status;

  if (isPaid) {
    const { data: txn } = await supabase
      .from("transaction")
      .select("id, guest_id, user_id, flow_type, checkout_context")
      .eq("stripe_id", stripeId)
      .single();

    if (txn?.flow_type === "dedicate_tree") {
      const dedicationResult = await finalizeTreeDedication(supabase, txn);
      nextStatus = dedicationResult.status;
    } else {
      let basketItems = [];
      if (txn?.guest_id) {
        const { data: guest } = await supabase.from("guests").select("basket").eq("id", txn.guest_id).single();
        basketItems = Array.isArray(guest?.basket) ? guest.basket : [];
        await supabase.from("guests").update({ basket: [] }).eq("id", txn.guest_id);
      } else if (txn?.user_id) {
        const { data: profile } = await supabase.from("profiles").select("basket").eq("id", txn.user_id).single();
        basketItems = Array.isArray(profile?.basket) ? profile.basket : [];
        await supabase.from("profiles").update({ basket: [] }).eq("id", txn.user_id);
      }

      for (const item of basketItems) {
        const plantId = Number(item?.item_id);
        const qty = Number(item?.quantity) || 0;
        if (!Number.isFinite(plantId) || plantId <= 0 || qty <= 0) continue;

        await supabase.rpc("add_harvest_quantity", {
          p_plant_id: plantId,
          p_quantity: qty
        });
      }
    }
  }

  await supabase.from("transaction").update({ status: nextStatus }).eq("stripe_id", stripeId);
}
