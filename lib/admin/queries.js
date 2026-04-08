import { getResourceConfig, sanitizePayload } from "./validators";

function buildListQuery(supabase, resource) {
  const config = getResourceConfig(resource);
  if (!config) {
    throw new Error("Unsupported admin resource.");
  }

  let query = supabase.from(config.table).select("*");
  if (config.orderBy?.column) {
    query = query.order(config.orderBy.column, { ascending: !!config.orderBy.ascending });
  }
  return query;
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

async function enrichTransactionsWithNames(supabase, rows) {
  const transactions = Array.isArray(rows) ? rows : [];
  const missingUserIds = [...new Set(
    transactions
      .filter((row) => !hasText(row?.user_name) && hasText(row?.user_id))
      .map((row) => String(row.user_id).trim())
  )];
  const missingGuestIds = [...new Set(
    transactions
      .filter((row) => !hasText(row?.guest_name) && hasText(row?.guest_id))
      .map((row) => String(row.guest_id).trim())
  )];

  const profileNameById = {};
  const guestNameById = {};

  if (missingUserIds.length > 0) {
    const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", missingUserIds);
    if (error) throw new Error(error.message || "Could not load profile names.");
    (data || []).forEach((row) => {
      const id = String(row?.id || "").trim();
      if (id) profileNameById[id] = row?.full_name || "";
    });
  }

  if (missingGuestIds.length > 0) {
    const { data, error } = await supabase.from("guests").select("id, full_name").in("id", missingGuestIds);
    if (error) throw new Error(error.message || "Could not load guest names.");
    (data || []).forEach((row) => {
      const id = String(row?.id || "").trim();
      if (id) guestNameById[id] = row?.full_name || "";
    });
  }

  return transactions.map((row) => {
    const userId = String(row?.user_id || "").trim();
    const guestId = String(row?.guest_id || "").trim();
    return {
      ...row,
      user_name: hasText(row?.user_name) ? row.user_name : profileNameById[userId] || "",
      guest_name: hasText(row?.guest_name) ? row.guest_name : guestNameById[guestId] || ""
    };
  });
}

async function getTransactionSummary(supabase) {
  const { data, error } = await supabase
    .from("transaction")
    .select("payment")
    .eq("status", "paid")
    .in("flow_type", ["dedicate_tree", "donate"]);
  if (error) throw new Error(error.message || "Could not load transaction summary.");

  const totalDonationAmount = (data || []).reduce((sum, row) => {
    const value = Number(row?.payment || 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return { totalDonationAmount };
}

export async function listResourceRows(supabase, resource) {
  const { data, error } = await buildListQuery(supabase, resource);
  if (error) {
    throw new Error(error.message || "Could not load data.");
  }
  const rows = data || [];
  if (resource !== "transaction") {
    return { rows, summary: null };
  }

  const [enrichedRows, summary] = await Promise.all([
    enrichTransactionsWithNames(supabase, rows),
    getTransactionSummary(supabase)
  ]);

  return {
    rows: enrichedRows,
    summary
  };
}

export async function upsertResourceRow(supabase, resource, payload) {
  const config = getResourceConfig(resource);
  if (!config) {
    throw new Error("Unsupported admin resource.");
  }

  const clean = sanitizePayload(resource, payload || {});
  if (resource === "upcoming_events") {
    const name = clean.event_name == null ? "" : String(clean.event_name).trim();
    if (!name) throw new Error("Event name is required.");
  }
  const id = payload?.[config.idColumn];

  if (id !== null && id !== undefined && id !== "") {
    const { data, error } = await supabase
      .from(config.table)
      .update(clean)
      .eq(config.idColumn, id)
      .select("*")
      .single();
    if (error) throw new Error(error.message || "Could not update row.");
    return data;
  }

  // ID is always generated: omit from insert so DB uses default/identity, except sponsors_public (no default)
  if (resource === "sponsors_public" && (clean.id === null || clean.id === undefined || clean.id === "")) {
    clean.id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : null;
  } else if (clean[config.idColumn] === null || clean[config.idColumn] === undefined || clean[config.idColumn] === "") {
    delete clean[config.idColumn];
  }

  const { data, error } = await supabase.from(config.table).insert(clean).select("*").single();
  if (error) throw new Error(error.message || "Could not create row.");
  return data;
}

export async function deleteResourceRow(supabase, resource, id) {
  const config = getResourceConfig(resource);
  if (!config) {
    throw new Error("Unsupported admin resource.");
  }
  if (id === null || id === undefined || id === "") {
    throw new Error("Missing id for delete.");
  }

  const { error } = await supabase.from(config.table).delete().eq(config.idColumn, id);
  if (error) throw new Error(error.message || "Could not delete row.");
}
