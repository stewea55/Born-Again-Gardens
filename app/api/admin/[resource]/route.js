import { NextResponse } from "next/server";
import { getAuthedServerSupabaseClient } from "../../../../lib/supabase/authed-server";
import {
  deleteResourceRow,
  listResourceRows,
  upsertResourceRow
} from "../../../../lib/admin/queries";

function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

async function getAuthedClient(request) {
  const token = getBearerToken(request);
  const supabase = getAuthedServerSupabaseClient(token);
  if (!supabase) {
    return { error: NextResponse.json({ error: "Missing or invalid auth token." }, { status: 401 }) };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  return { supabase };
}

export async function GET(request, { params }) {
  const { supabase, error } = await getAuthedClient(request);
  if (error) return error;

  const { resource } = await params;
  try {
    const { rows, summary } = await listResourceRows(supabase, resource);
    return NextResponse.json({ data: rows, summary: summary || null });
  } catch (nextError) {
    return NextResponse.json({ error: nextError.message || "Could not load admin data." }, { status: 400 });
  }
}

export async function POST(request, { params }) {
  const { supabase, error } = await getAuthedClient(request);
  if (error) return error;

  const { resource } = await params;
  try {
    const body = await request.json();
    const row = await upsertResourceRow(supabase, resource, body || {});
    return NextResponse.json({ data: row });
  } catch (nextError) {
    return NextResponse.json({ error: nextError.message || "Could not save row." }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { supabase, error } = await getAuthedClient(request);
  if (error) return error;

  const { resource } = await params;
  try {
    const body = await request.json();
    await deleteResourceRow(supabase, resource, body?.id);
    return NextResponse.json({ ok: true });
  } catch (nextError) {
    return NextResponse.json({ error: nextError.message || "Could not delete row." }, { status: 400 });
  }
}
