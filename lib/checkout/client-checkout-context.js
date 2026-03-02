"use client";

const KEY = "bag_pending_checkout_v1";

export function saveCheckoutContext(context) {
  window.localStorage.setItem(KEY, JSON.stringify(context || {}));
}

export function readCheckoutContext() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCheckoutContext() {
  window.localStorage.removeItem(KEY);
}
