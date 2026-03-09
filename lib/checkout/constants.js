export const FLOW_TYPES = ["cart", "basket", "donate", "dedicate_tree"];
export const ENTRY_MODES = ["guest", "google"];

export function toCurrencyAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}
