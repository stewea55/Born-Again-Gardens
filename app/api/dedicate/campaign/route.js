import { NextResponse } from "next/server";
import { getCurrentTreeCampaign } from "../../../../lib/dedicate/campaign";
import { getResourceImageUrl } from "../../../../lib/resources";

export async function GET() {
  const campaign = await getCurrentTreeCampaign();
  const resourceImage = await getResourceImageUrl("dedicate_tree");

  if (!campaign) {
    return NextResponse.json({ data: null, meta: {} });
  }

  return NextResponse.json({
    data: {
      ...campaign,
      image_url: campaign.image_url || resourceImage || null
    },
    meta: {}
  });
}
