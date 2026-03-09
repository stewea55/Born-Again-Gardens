const RESOURCE_CONFIG = {
  plant_catalog: {
    table: "plant_catalog",
    idColumn: "id",
    orderBy: { column: "name", ascending: true },
    writableFields: [
      { key: "id", type: "number" },
      { key: "name", type: "text" },
      { key: "scientific_name", type: "text" },
      { key: "category", type: "text" },
      { key: "description", type: "text" },
      { key: "medicinal_benefits", type: "text" },
      { key: "harvest_instructions", type: "text" },
      { key: "companion_plants", type: "text" },
      { key: "market_price", type: "number" },
      { key: "unit", type: "text" },
      { key: "status", type: "text" },
      { key: "image_url", type: "text" },
      { key: "in_stock", type: "boolean" },
      { key: "harvest_start", type: "number" },
      { key: "harvest_end", type: "number" }
    ]
  },
  guests: {
    table: "guests",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "full_name", type: "text" },
      { key: "email", type: "text" },
      { key: "payment_amount", type: "number" },
      { key: "donation_amount", type: "number" },
      { key: "payment_confirmation", type: "text" },
      { key: "cart", type: "json" },
      { key: "basket", type: "json" }
    ]
  },
  profiles: {
    table: "profiles",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "email", type: "text" },
      { key: "full_name", type: "text" },
      { key: "role", type: "text" },
      { key: "avatar_url", type: "text" },
      { key: "cart", type: "json" },
      { key: "basket", type: "json" }
    ]
  },
  user_preference: {
    table: "user_preference",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "user_id", type: "text" },
      { key: "email", type: "text" },
      { key: "full_name", type: "text" },
      { key: "email_newsletter", type: "json" },
      { key: "volunteer_updates", type: "text" }
    ]
  },
  transaction: {
    table: "transaction",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "user_id", type: "text" },
      { key: "guest_id", type: "text" },
      { key: "user_name", type: "text" },
      { key: "guest_name", type: "text" },
      { key: "payment", type: "number" },
      { key: "donation_amount", type: "number" },
      { key: "stripe_id", type: "text" },
      { key: "status", type: "text" }
    ]
  },
  resources: {
    table: "resources",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "resource_name", type: "text" },
      { key: "image_url", type: "text" },
      { key: "page", type: "text" },
      { key: "resource_type", type: "text" }
    ]
  },
  shop_catalog: {
    table: "shop_catalog",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "image_url", type: "text" },
      { key: "price", type: "number" },
      { key: "quantity total", type: "number" },
      { key: "quantity_purchased", type: "json" },
      { key: "quantity_remaining", type: "json" }
    ]
  },
  sponsors_public: {
    table: "sponsors_public",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "id", type: "text" },
      { key: "company_name", type: "text" },
      { key: "tier", type: "text" },
      { key: "logo", type: "text" },
      { key: "display_order", type: "number" },
      { key: "layout", type: "json" }
    ]
  },
  volunteers: {
    table: "volunteers",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "email", type: "text" },
      { key: "email_signup", type: "boolean" }
    ]
  },
  upcoming_events: {
    table: "upcoming_events",
    idColumn: "id",
    orderBy: { column: "created_at", ascending: false },
    writableFields: [
      { key: "event_name", type: "text" },
      { key: "event_start_date", type: "date" },
      { key: "event_end_date", type: "date" },
      { key: "event_start_time", type: "time" },
      { key: "event_end_time", type: "time" },
      { key: "image_url", type: "text" },
      { key: "additional_textbox", type: "text" },
      { key: "visibility", type: "boolean" }
    ]
  }
};

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function parseJson(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function parseByType(type, value) {
  if (type === "boolean") return parseBoolean(value);
  if (type === "number") return parseNumber(value);
  if (type === "json") return parseJson(value);
  if (type === "date" || type === "time") {
    if (value === null || value === undefined || value === "") return null;
    const s = String(value).trim();
    return s || null;
  }
  if (value === null || value === undefined) return null;
  return String(value);
}

export function getResourceConfig(resource) {
  return RESOURCE_CONFIG[resource] || null;
}

export function sanitizePayload(resource, payload) {
  const config = getResourceConfig(resource);
  if (!config) return {};

  const next = {};
  config.writableFields.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(payload, field.key)) return;
    next[field.key] = parseByType(field.type, payload[field.key]);
  });
  return next;
}
