import HeroSection from "../../components/HeroSection";
import HarvestClient from "../../components/HarvestClient";
import { getServerSupabaseClient } from "../../lib/supabase/server";

export default async function HarvestPage() {
  const supabase = getServerSupabaseClient();
  let plants = [];

  if (supabase) {
    const { data } = await supabase
      .from("plant_catalog")
      .select(
        "id, name, scientific_name, category, description, harvest_start, harvest_end, medicinal_benefits, harvest_instructions, companion_plants, market_price, unit, status, statys, image_url, in_stock, created_at"
      )
      .order("name", { ascending: true });
    plants = data || [];
  }

  return (
    <>
      <HeroSection page="harvest" title="Harvest" />
      <HarvestClient plants={plants} />
    </>
  );
}
