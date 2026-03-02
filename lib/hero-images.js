import { getServerSupabaseClient } from "./supabase/server";

const PAGE_MAP = {
  "about-us": "about_us",
  "happy-to-serve-you": "happy_to_serve_you",
  sponsorships: "sponsor"
};

function normalizePageKey(page) {
  if (!page) {
    return null;
  }
  return PAGE_MAP[page] || page;
}

function parseHeroValue(value) {
  if (!value) {
    return { imageUrl: null, color: null };
  }

  const trimmed = value.trim();
  const hexMatch = trimmed.match(/^hex\s+(#?[0-9a-fA-F]{3,6})$/i);
  if (hexMatch) {
    const color = hexMatch[1].startsWith("#") ? hexMatch[1] : `#${hexMatch[1]}`;
    return { imageUrl: null, color };
  }

  if (trimmed.startsWith("#")) {
    return { imageUrl: null, color: trimmed };
  }

  if (trimmed.startsWith("http")) {
    return { imageUrl: trimmed, color: null };
  }

  return { imageUrl: null, color: null };
}

export async function getHeroImageForPage(page) {
  const normalized = normalizePageKey(page);
  if (!normalized) {
    return { page: normalized, imageUrl: null, color: null };
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { page: normalized, imageUrl: null, color: null };
  }

  const { data, error } = await supabase
    .from("hero_images")
    .select("page, image_url")
    .eq("page", normalized)
    .maybeSingle();

  if (error || !data) {
    return { page: normalized, imageUrl: null, color: null };
  }

  const { imageUrl, color } = parseHeroValue(data.image_url);
  return { page: normalized, imageUrl, color };
}
