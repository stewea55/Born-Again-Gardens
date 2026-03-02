import { NextResponse } from "next/server";
import { getAuthedServerSupabaseClient } from "../../../lib/supabase/authed-server";

function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

async function getUserId(supabase) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

/**
 * GET: Return cart or basket items from profiles (jsonb).
 * cart_type=shop -> profiles.cart, cart_type=harvest -> profiles.basket.
 * We only read cart/basket columns (never role).
 */
export async function GET(request) {
  const token = getBearerToken(request);
  const cartType = new URL(request.url).searchParams.get("cart_type") || "shop";
  const supabase = getAuthedServerSupabaseClient(token);
  if (!supabase) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Missing auth token." } }, { status: 401 });
  }

  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Invalid auth token." } }, { status: 401 });
  }

  const column = cartType === "harvest" ? "basket" : "cart";
  const { data: row, error } = await supabase
    .from("profiles")
    .select(column)
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: { code: "cart_read_failed", message: error.message } }, { status: 500 });
  }

  const items = Array.isArray(row?.[column]) ? row[column] : [];
  return NextResponse.json({ data: { items }, meta: {} });
}

/**
 * PUT: Update profiles.cart or profiles.basket only (never role).
 * cart_type=shop -> cart, cart_type=harvest -> basket.
 */
export async function PUT(request) {
  const token = getBearerToken(request);
  const supabase = getAuthedServerSupabaseClient(token);
  if (!supabase) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Missing auth token." } }, { status: 401 });
  }

  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Invalid auth token." } }, { status: 401 });
  }

  const body = await request.json();
  const cartType = String(body?.cart_type || "").trim() || "shop";
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const column = cartType === "harvest" ? "basket" : "cart";

  const items = rawItems.map((item) => ({
    item_type: item?.item_type || (cartType === "harvest" ? "plant" : "shop"),
    item_id: Number(item?.item_id || 0),
    quantity: Number(item?.quantity || 0),
    size: item?.size ? String(item.size) : null,
    unit_price: item?.unit_price != null ? Number(item.unit_price) : null,
    metadata: typeof item?.metadata === "object" && item.metadata ? item.metadata : {}
  })).filter((item) => Number.isFinite(item.item_id) && item.item_id > 0 && item.quantity > 0);

  const { error } = await supabase
    .from("profiles")
    .update({ [column]: items })
    .eq("id", userId);

  if (error) {
    return NextResponse.json(
      { error: { code: "cart_write_failed", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { ok: true }, meta: {} });
}
