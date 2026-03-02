import { NextResponse } from "next/server";
import { getAuthedServerSupabaseClient } from "../../../../lib/supabase/authed-server";

const DEFAULT_CANVAS_WIDTH = 1000;
const DEFAULT_CANVAS_HEIGHT = 500;
const CONFIG_ID = "default";

function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

function sanitizeCanvas(value) {
  const width = Number(value?.width);
  const height = Number(value?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;
  return { width: Math.round(width), height: Math.round(height) };
}

function sanitizeLayout(value) {
  if (!value || typeof value !== "object") return null;

  function sanitizeObject(part, kind) {
    if (!part || typeof part !== "object") return null;
    const centerX = Number(part.centerX);
    const centerY = Number(part.centerY);
    const width = Number(part.width);
    const height = Number(part.height);
    if (![centerX, centerY, width, height].every(Number.isFinite)) return null;
    if (width <= 0 || height <= 0) return null;
    const next = { centerX, centerY, width, height };
    if (kind === "name") {
      const fontSize = Number(part.fontSize ?? part.nameFontSize);
      next.fontSize = Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 24;
    }
    return next;
  }

  // Backward compatibility: prior layout format was a single combined object.
  if (Object.prototype.hasOwnProperty.call(value, "centerX")) {
    const legacy = sanitizeObject(value, "logo");
    if (!legacy) return null;
    return {
      logo: legacy,
      name: {
        ...legacy,
        fontSize: Number.isFinite(Number(value.nameFontSize)) ? Number(value.nameFontSize) : 24
      }
    };
  }

  const logo = value.logo === null ? null : sanitizeObject(value.logo, "logo");
  const name = value.name === null ? null : sanitizeObject(value.name, "name");
  if (!logo && !name) return null;
  return { logo, name };
}

function sanitizeOrder(value) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Math.round(numberValue);
}

async function getAuthedAdminClient(request) {
  const token = getBearerToken(request);
  const supabase = getAuthedServerSupabaseClient(token);
  if (!supabase) {
    return { error: NextResponse.json({ error: "Missing or invalid auth token." }, { status: 401 }) };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (userError || !userId) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { supabase };
}

export async function GET(request) {
  const { supabase, error } = await getAuthedAdminClient(request);
  if (error) return error;

  const [sponsorsResult, canvasResult] = await Promise.all([
    supabase
      .from("sponsors_public")
      .select("id, company_name, tier, company_url, logo, layout, display_order, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("sponsors_section_config")
      .select("canvas_width, canvas_height")
      .eq("id", CONFIG_ID)
      .maybeSingle()
  ]);

  if (sponsorsResult.error) {
    return NextResponse.json(
      { error: sponsorsResult.error.message || "Could not load sponsors." },
      { status: 400 }
    );
  }

  const canvas = {
    width: canvasResult?.data?.canvas_width || DEFAULT_CANVAS_WIDTH,
    height: canvasResult?.data?.canvas_height || DEFAULT_CANVAS_HEIGHT
  };

  return NextResponse.json({
    data: {
      canvas,
      sponsors: sponsorsResult.data || []
    }
  });
}

export async function POST(request) {
  const { supabase, error } = await getAuthedAdminClient(request);
  if (error) return error;

  try {
    const body = await request.json();
    const canvas = sanitizeCanvas(body?.canvas);
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!canvas) {
      throw new Error("Invalid canvas size.");
    }

    const { error: canvasError } = await supabase.from("sponsors_section_config").upsert(
      {
        id: CONFIG_ID,
        canvas_width: canvas.width,
        canvas_height: canvas.height
      },
      { onConflict: "id" }
    );
    if (canvasError) throw new Error(canvasError.message || "Could not save canvas.");

    for (const item of items) {
      const id = item?.id ? String(item.id) : "";
      if (!id) continue;

      const layout = item.layout === null ? null : sanitizeLayout(item.layout);
      const displayOrder = sanitizeOrder(item.display_order);
      const { error: updateError } = await supabase
        .from("sponsors_public")
        .update({
          layout,
          display_order: layout ? displayOrder : null
        })
        .eq("id", id);
      if (updateError) {
        throw new Error(updateError.message || "Could not save sponsor layout.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (nextError) {
    return NextResponse.json(
      { error: nextError.message || "Could not save sponsors layout." },
      { status: 400 }
    );
  }
}
