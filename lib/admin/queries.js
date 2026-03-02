import { getResourceConfig, sanitizePayload } from "./validators";

function buildListQuery(supabase, resource) {
  const config = getResourceConfig(resource);
  if (!config) {
    throw new Error("Unsupported admin resource.");
  }

  if (resource === "upcoming_events") {
    return supabase
      .from("resources")
      .select("id, resource_name, image_url, page, resource_type, created_at")
      .eq("page", "volunteer")
      .eq("resource_type", "upcoming_event")
      .order("created_at", { ascending: false });
  }

  let query = supabase.from(config.table).select("*");
  if (config.orderBy?.column) {
    query = query.order(config.orderBy.column, { ascending: !!config.orderBy.ascending });
  }
  return query;
}

function mapUpcomingEventRow(row) {
  return {
    id: row.id,
    title: row.resource_name || "",
    details: row.image_url || "",
    created_at: row.created_at || null
  };
}

export async function listResourceRows(supabase, resource) {
  const { data, error } = await buildListQuery(supabase, resource);
  if (error) {
    throw new Error(error.message || "Could not load data.");
  }

  if (resource === "upcoming_events") {
    return (data || []).map(mapUpcomingEventRow);
  }

  return data || [];
}

export async function upsertResourceRow(supabase, resource, payload) {
  const config = getResourceConfig(resource);
  if (!config) {
    throw new Error("Unsupported admin resource.");
  }

  if (resource === "upcoming_events") {
    const title = String(payload?.title || "").trim();
    if (!title) throw new Error("Event title is required.");
    const details = String(payload?.details || "").trim();
    const existingId = payload?.id ? String(payload.id) : "";

    if (existingId) {
      const { data, error } = await supabase
        .from("resources")
        .update({
          resource_name: title,
          image_url: details,
          page: "volunteer",
          resource_type: "upcoming_event"
        })
        .eq("id", existingId)
        .select("id, resource_name, image_url, created_at")
        .single();
      if (error) throw new Error(error.message || "Could not save event.");
      return mapUpcomingEventRow(data);
    }

    const { data, error } = await supabase
      .from("resources")
      .insert({
        resource_name: title,
        image_url: details,
        page: "volunteer",
        resource_type: "upcoming_event"
      })
      .select("id, resource_name, image_url, created_at")
      .single();
    if (error) throw new Error(error.message || "Could not create event.");
    return mapUpcomingEventRow(data);
  }

  const clean = sanitizePayload(resource, payload || {});
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

  if (resource === "upcoming_events") {
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", id)
      .eq("resource_type", "upcoming_event")
      .eq("page", "volunteer");
    if (error) throw new Error(error.message || "Could not delete event.");
    return;
  }

  const { error } = await supabase.from(config.table).delete().eq(config.idColumn, id);
  if (error) throw new Error(error.message || "Could not delete row.");
}
