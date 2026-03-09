import { getServerSupabaseClient } from "./supabase/server";

export async function getUpcomingEvents() {
  const supabase = getServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("upcoming_events")
    .select("id, event_name, event_start_date, event_end_date, event_start_time, event_end_time, image_url, additional_textbox")
    .eq("visibility", true)
    .order("event_start_date", { ascending: true });

  if (error) return [];

  return (data || []).map((row) => ({
    id: row.id,
    event_name: row.event_name ?? "",
    event_start_date: row.event_start_date ?? null,
    event_end_date: row.event_end_date ?? null,
    event_start_time: row.event_start_time ?? null,
    event_end_time: row.event_end_time ?? null,
    image_url: row.image_url ?? null,
    additional_textbox: row.additional_textbox ?? null
  }));
}
