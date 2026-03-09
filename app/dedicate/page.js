import HeroSection from "../../components/HeroSection";
import DedicateTreeClient from "../../components/DedicateTreeClient";
import { getCurrentTreeCampaign } from "../../lib/dedicate/campaign";
import { getResourceImageUrl } from "../../lib/resources";

export default async function DedicatePage() {
  const [campaign, imageFromResources] = await Promise.all([
    getCurrentTreeCampaign(),
    getResourceImageUrl("dedicate_tree")
  ]);

  const initialCampaign = campaign
    ? { ...campaign, image_url: campaign.image_url || imageFromResources || null }
    : null;

  return (
    <>
      <HeroSection page="donate" title="Dedicate a Tree" />
      <DedicateTreeClient initialCampaign={initialCampaign} />
    </>
  );
}
