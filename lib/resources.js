import { getServerSupabaseClient } from "./supabase/server";

/**
 * Get the image_url for a resource by its resource_name (e.g. "bag_logo").
 * Returns null if not found or on error.
 */
export async function getResourceImageUrl(resourceName) {
  const supabase = getServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("resources")
    .select("image_url")
    .eq("resource_name", resourceName)
    .maybeSingle();

  if (error || !data?.image_url) return null;
  return data.image_url;
}
