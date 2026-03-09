import { ENTRY_MODES, FLOW_TYPES, toCurrencyAmount } from "./constants";

function error(message, details = {}) {
  return { ok: false, message, details };
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
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
  if (input?.privacy_accepted !== true) {
    return error("You must accept the Privacy Policy to complete payment.");
  }

  const normalized = {
    flow_type: flowType,
    entry_mode: entryMode,
    payment_amount: paymentAmount,
    donation_amount: Math.round(donationAmount * 100) / 100,
    guest: input?.guest || null,
    checkout_context: input?.checkout_context || {},
    privacy_accepted: true
  };

  if (entryMode === "guest") {
    const fullName = String(normalized.guest?.full_name || "").trim();
    const email = String(normalized.guest?.email || "").trim();
    if (!fullName || !email) {
      return error("Guest checkout requires full_name and email.");
    }
    normalized.guest = { full_name: fullName, email };
  }

  if (flowType === "dedicate_tree") {
    if (entryMode !== "google") {
      return error("Dedicate a tree requires Google sign-in.", { entry_mode: entryMode });
    }

    if (paymentAmount !== 350) {
      return error("Dedicate a tree payment_amount must be exactly 350.", {
        payment_amount: paymentAmount
      });
    }

    const fullName = String(normalized.checkout_context?.full_name || "").trim();
    const email = String(normalized.checkout_context?.email || "").trim();
    const dedicationText = String(normalized.checkout_context?.dedication_text || "").trim();
    const dedicationImageRaw = normalized.checkout_context?.dedication_image;
    const dedicationImage = dedicationImageRaw == null ? "" : String(dedicationImageRaw).trim();

    if (!fullName) {
      return error("Dedicate a tree requires full_name.", { full_name: fullName });
    }
    if (!email || !isLikelyEmail(email)) {
      return error("Dedicate a tree requires a valid email.", { email });
    }
    if (!dedicationText) {
      return error("Dedicate a tree requires dedication_text.", { dedication_text: dedicationText });
    }
    if (dedicationText.length > 200) {
      return error("dedication_text must be 200 characters or fewer.", {
        dedication_text_length: dedicationText.length
      });
    }

    normalized.checkout_context = {
      ...normalized.checkout_context,
      full_name: fullName,
      email,
      dedication_text: dedicationText,
      ...(dedicationImage ? { dedication_image: dedicationImage } : {})
    };
  }

  return { ok: true, data: normalized };
}
