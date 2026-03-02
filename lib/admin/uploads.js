export const DEFAULT_ADMIN_UPLOAD_BUCKET = "admin-assets";

export function sanitizeFilename(fileName) {
  return String(fileName || "upload-file")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export function buildStoragePath({ folder, fileName }) {
  const safeFolder = String(folder || "general")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/\-_]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
  const safeName = sanitizeFilename(fileName);
  const stamp = Date.now();
  return `${safeFolder}/${stamp}-${safeName}`;
}
