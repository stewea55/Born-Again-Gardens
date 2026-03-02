"use client";

const LOCAL_KEYS = {
  shop: "bag_guest_shop_cart_v1",
  harvest: "bag_guest_harvest_cart_v1"
};

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function getSessionAccessToken(supabase) {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

/**
 * When a guest signs in: overwrite the authenticated user's profile cart and basket
 * with the guest's localStorage data, then clear localStorage.
 * Call this after auth state changes to signed-in (e.g. from Header).
 */
export async function overwriteProfileWithGuestCart(supabase) {
  if (!supabase) return;
  const token = await getSessionAccessToken(supabase);
  if (!token) return;
  const shopRaw = typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_KEYS.shop) : null;
  const harvestRaw = typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_KEYS.harvest) : null;
  const shopItems = Array.isArray(safeParse(shopRaw)) ? safeParse(shopRaw) : [];
  const harvestItems = Array.isArray(safeParse(harvestRaw)) ? safeParse(harvestRaw) : [];
  if (shopItems.length === 0 && harvestItems.length === 0) return;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
  if (shopItems.length > 0) {
    await fetch("/api/cart", { method: "PUT", headers, body: JSON.stringify({ cart_type: "shop", items: shopItems }) });
  }
  if (harvestItems.length > 0) {
    await fetch("/api/cart", { method: "PUT", headers, body: JSON.stringify({ cart_type: "harvest", items: harvestItems }) });
  }
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LOCAL_KEYS.shop);
    window.localStorage.removeItem(LOCAL_KEYS.harvest);
  }
}

export async function readCart(cartType, supabase) {
  const token = await getSessionAccessToken(supabase);
  if (token) {
    const response = await fetch(`/api/cart?cart_type=${encodeURIComponent(cartType)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const payload = await response.json();
      return Array.isArray(payload?.data?.items) ? payload.data.items : [];
    }
  }

  const key = LOCAL_KEYS[cartType] || LOCAL_KEYS.shop;
  const data = safeParse(window.localStorage.getItem(key) || "[]");
  return Array.isArray(data) ? data : [];
}

export async function writeCart(cartType, items, supabase) {
  const token = await getSessionAccessToken(supabase);
  if (token) {
    await fetch("/api/cart", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        cart_type: cartType,
        items
      })
    });
    return;
  }

  const key = LOCAL_KEYS[cartType] || LOCAL_KEYS.shop;
  window.localStorage.setItem(key, JSON.stringify(items));
}
