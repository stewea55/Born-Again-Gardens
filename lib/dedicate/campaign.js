import { getServerSupabaseClient } from "../supabase/server";

export async function getCurrentTreeCampaign() {
  const supabase = getServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tree_campaign")
    .select("id, total_quantity, quantity_remaining, active, price_per_tree, image_url")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
