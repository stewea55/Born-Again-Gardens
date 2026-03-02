import { getServerSupabaseClient } from "./supabase/server";

export async function getUpcomingEvents() {
  const supabase = getServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("resources")
    .select("id, resource_name, image_url, page, resource_type, created_at")
    .eq("page", "volunteer")
    .eq("resource_type", "upcoming_event")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data || []).map((row) => ({
    id: row.id,
    title: row.resource_name || "",
    details: row.image_url || ""
  }));
}
