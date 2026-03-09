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

export async function listResourceRows(supabase, resource) {
  const { data, error } = await buildListQuery(supabase, resource);
  if (error) {
    throw new Error(error.message || "Could not load data.");
  }
  return data || [];
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
