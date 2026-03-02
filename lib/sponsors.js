import { getServerSupabaseClient } from "./supabase/server";

const DEFAULT_CANVAS = { width: 1000, height: 500 };
const CONFIG_ID = "default";

function normalizeLayout(layout, canvas) {
  if (!layout || typeof layout !== "object") return null;
  function normalizePart(part, kind) {
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
      next.fontSize = Number.isFinite(fontSize) ? fontSize : 24;
    }
    return next;
  }

  // Backward compatibility for older combined layout rows.
  if (Object.prototype.hasOwnProperty.call(layout, "centerX")) {
    const legacy = normalizePart(layout, "logo");
    if (!legacy) return null;
    return {
      logo: legacy,
      name: {
        ...legacy,
        fontSize: Number.isFinite(Number(layout.nameFontSize)) ? Number(layout.nameFontSize) : 24
      }
    };
  }

  const logo = layout.logo === null ? null : normalizePart(layout.logo, "logo");
  const name = layout.name === null ? null : normalizePart(layout.name, "name");
  if (!logo && !name) return null;
  return { logo, name };
}

export async function getPublicSponsorSectionLayout() {
  const supabase = getServerSupabaseClient();
  if (!supabase) return { canvas: DEFAULT_CANVAS, sponsors: [] };

  const [sponsorsResult, canvasResult] = await Promise.all([
    supabase
      .from("sponsors_public")
      .select("id, company_name, logo, display_order, layout, created_at")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("sponsors_section_config")
      .select("canvas_width, canvas_height")
      .eq("id", CONFIG_ID)
      .maybeSingle()
  ]);

  const canvas = {
    width: Number(canvasResult?.data?.canvas_width) || DEFAULT_CANVAS.width,
    height: Number(canvasResult?.data?.canvas_height) || DEFAULT_CANVAS.height
  };

  if (sponsorsResult.error) return { canvas, sponsors: [] };
  const sponsors = (sponsorsResult.data || [])
    .map((row) => {
      const layout = normalizeLayout(row.layout, canvas);
      if (!layout) return null;
      return {
        id: row.id,
        company_name: row.company_name,
        logo: row.logo,
        display_order: row.display_order,
        layout
      };
    })
    .filter(Boolean);

  return { canvas, sponsors };
}
