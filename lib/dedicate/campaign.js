import { getServerSupabaseClient } from "../supabase/server";

export async function getCurrentTreeCampaign() {
  const supabase = getServerSupabaseClient();
  if (!supabase) return null;

  const selectColumns = "id, total_quantity, quantity_remaining, active, price_per_tree, image_url";
  const { data: activeCampaign, error: activeError } = await supabase
    .from("tree_campaign")
    .select(selectColumns)
    .eq("active", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!activeError && activeCampaign) return activeCampaign;

  const { data: fallbackCampaign, error: fallbackError } = await supabase
    .from("tree_campaign")
    .select(selectColumns)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (fallbackError || !fallbackCampaign) return null;
  return fallbackCampaign;
}
