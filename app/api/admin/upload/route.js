import { NextResponse } from "next/server";
import { getAuthedServerSupabaseClient } from "../../../../lib/supabase/authed-server";
import {
  buildStoragePath,
  DEFAULT_ADMIN_UPLOAD_BUCKET
} from "../../../../lib/admin/uploads";

function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

export async function POST(request) {
  const token = getBearerToken(request);
  const supabase = getAuthedServerSupabaseClient(token);
  if (!supabase) {
    return NextResponse.json({ error: "Missing or invalid auth token." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = String(formData.get("bucket") || DEFAULT_ADMIN_UPLOAD_BUCKET);
    const folder = String(formData.get("folder") || "admin");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    const storagePath = buildStoragePath({ folder, fileName: file.name });

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || "Upload failed." }, { status: 400 });
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return NextResponse.json({
      data: {
        path: storagePath,
        bucket,
        publicUrl: publicData?.publicUrl || null
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 });
  }
}
