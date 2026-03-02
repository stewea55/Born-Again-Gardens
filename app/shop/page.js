import HeroSection from "../../components/HeroSection";
import ShopClient from "../../components/ShopClient";
import { getResourceImageUrl } from "../../lib/resources";
import { getServerSupabaseClient } from "../../lib/supabase/server";

export default async function ShopPage() {
  const supabase = getServerSupabaseClient();
  let products = [];

  if (supabase) {
    const { data } = await supabase.from("shop_catalog").select("*").order("id", { ascending: true });
    products = data || [];
  }

  const shopHeroImageUrl = await getResourceImageUrl("bag_logo");

  return (
    <>
      <HeroSection page="shop" title="Shop" imageUrl={shopHeroImageUrl} />
      <ShopClient products={products} />
    </>
  );
}
