# API and Backend Plan

**Date:** 2025-02-05

**Summary:** Document the locked-in API and backend decisions in a plan, move unconfirmed/later items to Potential-Features.md, and list production steps to track in Push-to-Production.md.

---

## 1. What is in the plan right now (rock solid)

These are confirmed and part of the current scope.

### Base and versioning

- **Base URL:** `https://bornagaingardens.org/api/v1`
- **Versioning:** Use `/api/v1` from day one; API shape stays consistent (day 1 = day 100).

### Content and data flow

- **Copy:** All page copy is hardcoded in the frontend; no API for copy.
- **Dynamic content:** Anything you want to change or swap (hero images, other images, future swappable content) lives in the DB and is served via your API. Frontend calls your API; your API reads from Supabase (single source of truth).
- **Hero images:** URLs stored in DB (e.g. table `hero_images` with `image_url`, optional `slug`/usage). API returns them for the frontend.

### Plant catalog

- Data from your CSV imported into a `plants` table. **Columns (locked in):** id, name, scientific_name, category, description, harvest_start, harvest_end, medicinal_benefits, harvest_instructions, companion_plants, suggested_donation, unit, status, image_url, in_stock, created_at.
- **Filtering:** By type (e.g. fruit, vegetable, herb, flower) via `category` (or equivalent column values).
- **Visibility:** Each plant has a harvest range (`harvest_start`, `harvest_end`). Only plants whose range includes the **current month** are visible in the public view and available to add to the cart.
- **Access:** Read-only for everyone.

### Auth — four actor types (in scope now)

- **Google OAuth (signed-in user):** Real account; we store them and app history. Dashboard only for that user (admin can masquerade). API exposes only **"delete my account"**. Retention notice shown only when they go through with account deletion. If logged in (or log in from popup), no guest/company form; we use Google name/email; they go to Stripe and must check privacy policy to pay.
- **Guest:** One-time. Choose Guest → fill **guest form** (required values) → payment screen → check privacy policy → pay. Stored in **Guests** table: name, email, payment amount, donation amount, date, cart, payment confirmation. After payment, redirect home; they lose access; admin only. Guest form is separate from company form.
- **Company:** One-time. Choose Company → fill **company form** → payment screen → check privacy policy → pay. Stored in **Sponsors** table: company name, email, name (optional), company url, payment amount, date. After payment, redirect home; they lose access; admin only.
- **Admin:** Exists; can masquerade (e.g. as Google user), monitor, and change data in certain tables via the app (no direct DB). **Full admin design is not in scope now** — see Potential-Features.

**Mapping:** Guest (flow/actor) maps to DB table **Guests**; Company (flow/actor) maps to DB table **Sponsors**.

### Payment / checkout flow

- **Popup (payment page only):** User must choose exactly one: Google OAuth | Guest | Company.
- **Guest/Company:** Popup closes → show corresponding form → user must submit valid required values → payment screen → must check "I agree to privacy policy" → pay. If form incomplete or privacy unchecked: payment does not complete; message like "Payment unsuccessful. Please fill in all required values and accept the privacy policy."
- **Google:** No guest/company form; use Google name/email → Stripe → must check privacy policy to pay.
- **Everyone:** Must accept privacy policy to complete payment and (for guest/company) be stored. After successful payment, guest/company redirect home and lose access to that record.

### Database (Supabase)

- **Schema:** `public` for all app tables.
- **Tables:** hero_images, Plants, Users, User Preferences, Sponsors, Guests, Transactions, Harvest Quantity, Other Resources. **Mapping:** Guest → **Guests**; Company → **Sponsors**. **Other Resources:** additional images or files that can be useful or interchanged; columns: id, resource_name, resource_type, url, page, created_at.
- **Forms:** Guest form inputs map to **Guests** table columns; company form inputs map to **Sponsors** table columns. Display order of fields on forms is TBD (see Potential-Features).
- **RLS:** Enable per table as needed; add policies after creating tables so the API respects who can read/write what.

### API surface (v1)

- **Public:** Hero/dynamic content (e.g. `GET /api/v1/content/hero` or equivalent), plant catalog (list with type filter and harvest-month visibility).
- **Checkout:** Create checkout session (guest vs company with correct payloads); Stripe integration (payment intent, confirmation, webhooks).
- **Authenticated user (Google):** "Me" (profile), history (payments, cart, donations), "delete my account" (retention notice in that flow).
- **Admin:** Masquerade, monitor, modify certain tables via API — **high-level scope only**; detailed design is in Potential-Features.
- **Design principles:** REST conventions, single resource + query params, `/me` for user data, snake_case, `{ data, meta }` envelope, standard errors. Full details in [organization/API.md](../organization/API.md).

---

## 2. Potential-Features (see organization/Potential-Features.md)

Items not locked in now: Admin full design, Form/display order for guest/company forms, Realtime (undecided for all tables; TBD).

---

## 3. Production steps (see organization/Push-to-Production.md)

Pre-launch checklist: API base URL and env, Supabase backups and RLS and secrets, Stripe live keys and webhooks and privacy URL, domain/HTTPS, PII and logs, retention notice placement, audit logging for admin actions.

---

## 4. Sync with existing docs

- **Project-Decisions.md** and **Project-Simple-Decisions.md** updated to match this plan.
- **API.md** — When building, document routes, auth, and payloads here. OpenAPI blueprint can live in plans/ or repo root.

---

## 5. Next step

Draft the OpenAPI spec (routes, schemas, security) from section 1 when ready to implement the API.
