# Admin Assets Storage Bucket (Supabase)

## Overview

The admin dashboard uses a **Supabase Storage bucket** named `admin-assets` for file uploads (e.g. plant images, sponsor logos). The app expects this bucket to exist and to have policies that allow admins to upload and the site to read image URLs.

---

## Bucket name

- **Name:** `admin-assets`
- **Defined in code:** `lib/admin/uploads.js` → `DEFAULT_ADMIN_UPLOAD_BUCKET = "admin-assets"`
- The upload API (`POST /api/admin/upload`) uses this bucket unless the client sends a different `bucket` in the form body. The admin UI does not send `bucket`, so the default is always used.

---

## What it’s used for

- **Plant catalog:** Admin can upload an image when editing a plant; the resulting URL is stored in `plant_catalog.image_url`.
- **Sponsors:** Admin can upload a logo when editing a sponsor; the URL is stored in `sponsors_public.logo`.
- **Other admin tables:** Any admin field that “looks like” an image (e.g. column name contains `image` or `logo`) gets an optional file input that uploads to this bucket and then saves the returned URL into that column.

Paths inside the bucket are built as: `{folder}/{timestamp}-{sanitized-filename}` (e.g. `plant_catalog/image_url/1734567890123-logo.png`). The `folder` is derived from the resource and column (e.g. `plant_catalog/image_url`, `sponsors_public/logo`).

---

## How the app uses it

1. **Upload:** Admin selects a file in the UI → frontend calls `POST /api/admin/upload` with `multipart/form-data` (file + optional `folder`). The route uses the **authenticated user’s Supabase client** (Bearer token from session).
2. **Storage:** The API uploads to the bucket `admin-assets` at the path from `buildStoragePath()` in `lib/admin/uploads.js`.
3. **URL:** The API returns `publicUrl` from `supabase.storage.from(bucket).getPublicUrl(storagePath)`. The frontend then puts that URL into the row (e.g. `image_url`, `logo`) and saves the row via `POST /api/admin/:resource`. So the app assumes **public URLs** work for display (harvest page, home sponsors, etc.).

Relevant files:

- `lib/admin/uploads.js` — bucket constant, path building, filename sanitization
- `app/api/admin/upload/route.js` — upload handler, uses `admin-assets` by default
- `components/admin/AdminTableEditor.js` — file input and `uploadImage()` call for image-like columns

---

## What you need to create in Supabase

### 1. Create the bucket

- In Supabase: **Storage** → **New bucket**.
- **Name:** `admin-assets` (must match the code).
- **Public bucket:**  
  - **Yes** — Anyone can read objects; URLs from `getPublicUrl()` work for `<img>` on the site. Easiest for “show images on harvest/sponsors.”  
  - **No** — Objects are private; you’d need signed URLs or different policies for public read, and the current code does not generate signed URLs.

Recommendation: **Public** unless you have a reason to keep uploads private.

### 2. Storage policies (RLS)

Supabase Storage uses RLS on `storage.objects` (and optionally `storage.buckets`). You need:

- **INSERT (upload):** Only authenticated users who are admins (e.g. `is_admin()` or your `profiles.role = 'admin'` check) should be allowed to insert into `storage.objects` where `bucket_id = 'admin-assets'`.
- **SELECT (read):** If the bucket is **public**, Supabase usually allows public read for that bucket. If the bucket is **private**, add a policy so that at least the roles that need to display images (e.g. `anon` and `authenticated`) can SELECT from `storage.objects` where `bucket_id = 'admin-assets'`.

Policy names and exact SQL depend on how you define “admin” (e.g. `is_admin()` in your DB). Match the same pattern you use for other admin-only resources (e.g. “admins full access” style policies).

### 3. No app code changes if you only create the bucket

- The app does not create the bucket. If `admin-assets` does not exist, uploads will fail with a storage error (e.g. “Bucket not found”).
- Creating the bucket (and policies) in Supabase is enough for the existing admin upload flow to work.

---

## Optional: different bucket name

If you want a different bucket name (e.g. `admin-uploads`):

1. Create that bucket in Supabase and set its policies as above.
2. In the code, change `DEFAULT_ADMIN_UPLOAD_BUCKET` in `lib/admin/uploads.js` to the new name (and redeploy). The upload API uses that constant when the client doesn’t send `bucket`.

---

## Summary checklist

- [ ] Create Storage bucket named `admin-assets` in Supabase.
- [ ] Set bucket to **Public** (or configure private + read policies and optionally signed URLs later).
- [ ] Add RLS so only admins can **INSERT** into `admin-assets`.
- [ ] Ensure **SELECT** is allowed for whoever needs to load images (public bucket or policies for anon/authenticated).
- [ ] Test: in admin, edit a plant or sponsor, upload an image, save; confirm the image appears on the harvest or home page.
