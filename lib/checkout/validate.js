import { ENTRY_MODES, FLOW_TYPES, toCurrencyAmount } from "./constants";

function error(message, details = {}) {
  return { ok: false, message, details };
}

export function validateCheckoutInput(input) {
  const flowType = String(input?.flow_type || "").trim();
  const entryMode = String(input?.entry_mode || "").trim();
  const paymentAmount = toCurrencyAmount(input?.payment_amount);
  const donationAmount = input?.donation_amount == null ? 0 : Number(input.donation_amount);

  if (!FLOW_TYPES.includes(flowType)) {
    return error("Invalid flow_type.", { flow_type: flowType });
  }
  if (!ENTRY_MODES.includes(entryMode)) {
    return error("Invalid entry_mode.", { entry_mode: entryMode });
  }
  if (!paymentAmount) {
    return error("payment_amount must be greater than 0.");
  }
  if (!Number.isFinite(donationAmount) || donationAmount < 0) {
    return error("donation_amount cannot be negative.");
  }

  const normalized = {
    flow_type: flowType,
    entry_mode: entryMode,
    payment_amount: paymentAmount,
    donation_amount: Math.round(donationAmount * 100) / 100,
    guest: input?.guest || null,
    checkout_context: input?.checkout_context || {}
  };

  if (entryMode === "guest") {
    const fullName = String(normalized.guest?.full_name || "").trim();
    const email = String(normalized.guest?.email || "").trim();
    if (!fullName || !email) {
      return error("Guest checkout requires full_name and email.");
    }
    normalized.guest = { full_name: fullName, email };
  }

  return { ok: true, data: normalized };
}
