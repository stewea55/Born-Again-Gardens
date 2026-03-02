import { NextResponse } from "next/server";
import { getAuthedServerSupabaseClient } from "../../../../lib/supabase/authed-server";

function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

export async function GET(request) {
  const token = getBearerToken(request);
  const supabase = getAuthedServerSupabaseClient(token);
  if (!supabase) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  const isAdmin = profile.role === "admin";
  return NextResponse.json({ isAdmin });
}
