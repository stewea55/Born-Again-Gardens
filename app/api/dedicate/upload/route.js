import { NextResponse } from "next/server";
import { getAuthedServerSupabaseClient } from "../../../../lib/supabase/authed-server";
import { getServerSupabaseClient } from "../../../../lib/supabase/server";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET = "admin-assets";

function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

function sanitizeFilename(fileName) {
  return String(fileName || "dedication-image")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request) {
  const token = getBearerToken(request);
  const authedSupabase = getAuthedServerSupabaseClient(token);
  if (!authedSupabase) {
    return NextResponse.json({ error: "Missing or invalid auth token." }, { status: 401 });
  }

  const { data: userData, error: userError } = await authedSupabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase server client is not configured." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name);
    const storagePath = `dedicate-tree/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || "Upload failed." }, { status: 400 });
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return NextResponse.json({
      data: {
        bucket: BUCKET,
        path: storagePath,
        publicUrl: publicData?.publicUrl || null
      },
      meta: {}
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 });
  }
}
