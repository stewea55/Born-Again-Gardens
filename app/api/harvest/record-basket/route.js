import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "../../../../lib/supabase/server";

/**
 * POST: Record basket quantities for zero-payment harvest flow.
 * Body: { basket_items: Array<{ item_id, quantity, ... }> }
 * Calls add_harvest_quantity RPC for each valid item. No auth required (anonymous $0 users).
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const basketItems = Array.isArray(body?.basket_items) ? body.basket_items : [];
  if (basketItems.length === 0) {
    return NextResponse.json({ data: { recorded: 0 } }, { status: 200 });
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: { code: "server_error", message: "Server not configured." } },
      { status: 500 }
    );
  }

  for (const item of basketItems) {
    const plantId = Number(item?.item_id);
    const qty = Number(item?.quantity) || 0;
    if (!Number.isFinite(plantId) || plantId <= 0 || qty <= 0) continue;

    const { error } = await supabase.rpc("add_harvest_quantity", {
      p_plant_id: plantId,
      p_quantity: qty
    });
    if (error) {
      return NextResponse.json(
        { error: { code: "record_failed", message: error.message } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ data: { recorded: basketItems.length } }, { status: 200 });
}
