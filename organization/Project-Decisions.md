# Project Decisions

**Date:** 2025-02-04 (initial); **2025-02-05** (API, auth, DB tables, payment flow); **2025-02-16** (API design principles); **2025-02-24** (hero and header logo); **2026-02-27** (sponsorships = contact only, no Stripe).

---

## Platform and infra

- Supabase (auth, DB, storage), GitHub, deploy on Vercel or Railway (TBD). Payments via Stripe.

---

## API

- **Base URL:** `https://bornagaingardens.org/api/v1`. Versioned from day one; API shape stays consistent.
- **Dynamic content:** Anything we want to change or swap (hero images, other images, swappable content) lives in the DB and is served via our API. Frontend calls our API; API reads from Supabase (single source of truth).
- **Copy:** All page copy is hardcoded in the frontend; no API for copy.
- **API design principles (locked in):** REST verbs (GET read, POST create, PATCH update, DELETE remove). Single resource + query params (e.g. `GET /plants?status=available`). Endpoints are nouns, not verbs. No side effects in GET. Public vs user-specific: same paths, auth where needed; `/me` for current user data. snake_case for all fields and params. Response envelope `{ "data": ..., "meta": ... }`. Error format `{ "error": { "code", "message", "details" } }` with standard status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 500). Pagination `limit`/`offset`; sorting `sort`/`order`. Design for cacheability (no GET side effects, clear public/user split); implement cache headers only when needed. Full details in [API.md](API.md).

---

## Product

- Web app for donations, payments, and updates ("what's ready"). Plant catalog as main public content.

---

## Data and access

- **Plant catalog:** Table **plant_catalog**. Viewable by everyone (guests and logged-in users), read-only. Columns: id, name, scientific_name, category, description, harvest_start, harvest_end, medicinal_benefits, harvest_instructions, companion_plants, market_price, unit, status, image_url, in_stock, created_at. Filtering by category (e.g. fruit, vegetable, herb, flower). 
- **Date:** 2026-03-01 — Harvest catalog pricing field is `market_price` (replaces `suggested_donation`).
- **Sensitive (restricted):** Stripe-related data and personal checkout/donation history only. Sensitive tables have RLS enabled and policies so only the owning user or backend can access; no cross-user exposure. No raw PII from checkout or Stripe in logs (per Security-Checklist).
- **Routes:** Routes that return sensitive data (checkout history, Stripe-related) require an authenticated user or backend-only access. Catalog and public content may be served without auth.

---

## Database (Supabase)

- **Schema:** `public` for all app tables.
- **Tables (exact Supabase names):** hero_images, plant_catalog, profiles, user_preference, sponsors_public, sponsors_section_config, sponsors_private, guests, transaction, harvest_quantity, resources, upcoming_events, volunteers, shop_catalog, tree_campaign, tree_dedications.
- **Mapping:** Guest (flow/actor) maps to table **guests**. **sponsors_public** is the single table for "Our Generous Sponsors" (display only); RLS allows SELECT for anon and authenticated, and full access for authenticated admins. See [Form-API-to-DB.md](Form-API-to-DB.md) for form/API payload → table & column mapping. Guest form inputs map to guests columns.
- **resources:** Additional images or files for the site; columns: id, resource_name, resource_type, image_url, page, created_at.
- **RLS:** Enable per table as needed; add policies so the API respects who can read/write what.

**Date:** 2026-02-25

- **profiles insert (RLS):** New-user profile rows are inserted via the auth trigger with an INSERT policy that only allows `id = auth.uid()`. The trigger sets request JWT claims for the new user before inserting so RLS stays on (no row_security bypass).
- **profiles ↔ user_preference FK:** Profiles no longer depend on `user_preference.email`. Instead, `user_preference.user_id` references `profiles.id` with cascade on update/delete, so auth → profiles → preferences is the dependency chain.
- **user_preference seed (RLS):** The auth trigger also creates a default `user_preference` row (email + newsletter disabled). `user_preference.user_id` is unique, and INSERT is allowed only when `user_id = auth.uid()`.

---

## Guest (no login)

- Guest = **one-time placeholder only.** No persistent guest_id or cookie that follows the user.
- One-time record created per checkout/donation in the **guests** table (first_name, last_name, email, payment_amount, donation_amount, cart, payment_confirmation). The visitor never sees or "returns to" that record.
- Next visit without logging in = new anonymous user; previous guest record is not accessible to them.

---

## Company / sponsor (contact only)

- Corporate sponsorship is **contact only**. No Stripe or payment path on the website. Companies reach out via email (info@bornagaingardens.org) or phone (317-385-4165); payment is discussed and handled offline. The /sponsorships page shows tier info and a Contact us card. **sponsors_public** is the single table for the home page "Our Generous Sponsors"; RLS gives anon and authenticated SELECT, and admins full access.

---

## Auth and checkout UX

- **Home / site:** Optional "Log in" for users who already have an account (dashboard, history, settings).
- **Payment page popup:** User **must** choose exactly one: **Google OAuth** | **Guest**. No continuing without choosing. (Company/sponsor path removed; corporate = contact only.)
- **If Guest:** Popup closes → show guest form (guests columns; see Form-API-to-DB.md). User must submit valid required values, then payment screen, then check "I agree to privacy policy" → pay. If form incomplete or privacy unchecked: payment does not complete; show message like "Payment unsuccessful. Please fill in all required values and accept the privacy policy."
- **If Google (logged in or log in from popup):** No guest/company form; we use Google name, email, etc. User goes straight to Stripe payment and must check privacy policy to pay.
- **Everyone:** Must accept privacy policy to complete payment and (for guest/company) be stored. After successful payment, guest/company redirect home and lose access to that record.
- **Logged-in users (Google):** Can access a dashboard with account history, delete their account (API exposes "delete my account" only). Retention notice shown only when they go through with account deletion: we may keep strictly necessary information for legal purposes (not payment type/method; may include PII). Account deletion: user and personal data deletable; payment/donation records are retained for our records (compliance/bookkeeping).
- **Admin:** Exists; can monitor and change data through `/admin` using authenticated API routes and Supabase RLS enforcement (no direct DB console required for normal content operations).

---

## Frontend / UI

**Date:** 2025-02-24

- **Hero section:** Full-bleed edge-to-edge (no rounded corners); same min-height and overlay transparency on all pages. Hero images come from **hero_images** per page; overlay is consistent (single opacity).
- **Header logo:** The logo in the header is the image from **resources** where `resource_name` = `bag_logo`. That logo is a link to the home page on every page. If no bag_logo row exists, we show the placeholder circle with "BAG".

**Date:** 2025-02-25

- **Hamburger menu (auth):** When signed out, the hamburger shows a "Sign in" link that triggers Google OAuth. When signed in, that slot shows "View my profile" linking to `/account`. Only one is visible at a time. The "Admin dashboard" link is shown only when the current user's profile has `role = 'admin'` (checked via `GET /api/auth/me`); non-admins never see it.
- **Account page (`/account`):** Signed-in-only page where the user manages their **user_preference** row. Shows and edits: email, email_newsletter (toggle), full_name, volunteer_updates (toggle). Excludes id, created_at, updated_at, user_id from the UI. "Delete profile" button at bottom opens a confirmation modal ("Are you sure?" with Confirm and Close); backdrop or Close dismisses the modal. On Confirm we delete the user's row in user_preference and profiles, then sign out and redirect to `/`. Auth account (Google) is not deleted—user can sign in again (see Push-to-Production for production scope).

**Date:** 2026-02-25

- **Account page sign out:** Add a "Sign out" button on `/account` so users can end their session without deleting their profile.

**Date:** 2026-02-26

- **Payment path routes:** Standard payment paths are `/shop -> /cart -> /payment`, `/harvest -> /basket -> /payment`, and `/donate -> /payment`. There is no `/sponsorships -> /payment` path; corporate sponsorship is contact only (email, phone on /sponsorships).
- **Auth gate behavior:** `/cart`, `/basket`, and `/donate` require a gate choice before `/payment` (Google sign-in or continue as guest). Closing the gate keeps users on the same page.
- **Sponsorship behavior:** `/sponsorships` shows tier info and a Contact us card (info@bornagaingardens.org, 317-385-4165). No payment on the website; companies contact to discuss payment offline.
- **Guest schema:** Guest checkout uses `guests.full_name` and `guests.email` as required identity fields.
- **Cart persistence split:** Guest cart/basket is stored in local storage; at checkout, guest row gets `guests.cart` and `guests.basket` (jsonb). Authenticated users use `profiles.cart` and `profiles.basket` (jsonb). On sign-in, guest localStorage overwrites profile cart/basket. **Date:** 2026-02-27
- **Stripe mode for local build:** Use Stripe test/sandbox keys for current implementation and switch keys later for production.
- **Checkout implementation:** Checkout uses Stripe Embedded Checkout (payment form on /payment); we create the Stripe session first, then insert the transaction row with stripe_id set (session-first flow). Webhook finalizes by stripe_id. For guest: transaction has guest_id; for logged-in: transaction has user_id (no guest row). On successful payment (status paid), basket items are written to harvest_quantity (upsert by plant_id), then basket is cleared. **Date:** 2026-02-27

**Date:** 2026-03-01

- **Admin dashboard (`/admin`):** Tabbed admin UI now supports CRUD editing for plant_catalog, guests, profiles, user_preference, transaction, resources, shop_catalog, sponsors_public, upcoming_events, and volunteers. Only users with `profiles.role = 'admin'` can see the hamburger link or access the page; non-admins who open `/admin` directly are redirected to `/`. **Date:** 2026-03-02
- **Upcoming events content model:** Volunteer upcoming events are stored in table `upcoming_events` (event_name, event_start_date, event_end_date, event_start_time, event_end_time, image_url, additional_textbox, visibility). Image can be a pasted URL or an upload to the `admin-assets` bucket (folder e.g. upcoming_events). **Date:** 2026-03-09
- **Sponsors home card source:** Home page "Our Generous Sponsors" renders from `sponsors_public` so admin edits show on the public site.
- **Sponsors RLS (2026-03-01):** `sponsors_public` has RLS: SELECT for anon and authenticated; INSERT/UPDATE/DELETE for authenticated where `is_admin()`. New sponsor rows get a UUID generated by the admin API when id is omitted.
- **Volunteer upcoming events rendering:** Volunteer page renders a clickable bullet list from `upcoming_events` where `visibility = true`; display order is event name, image (if set), When (dates/times), additional text. Id, visibility, and created_at are never shown to users.
- **Upcoming events RLS (2026-03-09):** `upcoming_events` has RLS: SELECT for anon and authenticated; INSERT/UPDATE/DELETE for authenticated where `is_admin()`.
- **Date:** 2026-03-02
- **Sponsors canvas layout (admin-only editor):** The admin panel includes a sponsors layout editor with a sponsor catalog and canvas. Logo and company name are independent objects on the canvas. Admin can place/move/resize each object separately, change canvas width/height, and set overlap order. Save writes `sponsors_public.layout`, `sponsors_public.display_order`, and `sponsors_section_config` canvas size.
- **Sponsors home rendering:** Home page "Our Generous Sponsors" now renders only logo + company name from the saved admin canvas layout. The home page is read-only and never shows editor controls.
- **X remove behavior:** Clicking X removes only the selected canvas object (`layout.logo` or `layout.name`). If both objects are removed, `layout` becomes null and the sponsor is hidden on home. Sponsor rows are never deleted by canvas actions.
- **Home auth CTA visibility:** Home page "Ready to Visit?" card (with Create Account button) is shown only to signed-out visitors. Signed-in users do not see that card.

**Date:** 2026-03-07

- **Basket copy and unit display:** Basket copy now uses "Market Price" for the basket total and "Payment Amount" for the editable checkout amount. Basket line items display `Market Price: $X.XX per unit`, with `unit` fetched from `public.plant_catalog` by plant id.
- **Harvest modal confirm flow:** Harvest plant modal now uses split close behavior based on state. If quantity is 0 (Add to basket visible), users can close by clicking outside. If quantity is greater than 0 (Confirm visible), outside click is blocked and only Confirm closes + saves quantity.
- **Shop and payment copy cleanup:** Removed temporary v1 `/shop` scaffold text, hid `View cart` on `/shop` for now, and removed `Flow:` wording from `/payment`.
- **Home wishlist CTA:** Added a new homepage card between generous support and volunteer sections with the copy "Eager to support in a tangible way? checkout our wishlist" and `wishlist` linked to the MyRegistry URL.

**Date:** 2026-03-07 (Basket CYA)

- **Basket disclaimer:** Basket page shows the disclaimer "Basket selections are for in-person harvest planning only and do not guarantee availability or quantity." below Payment Amount and above the Back to harvest / Confirm and checkout buttons.
- **Checkout gate modal copy:** Removed the sentence "Closing this popup keeps you on this page." from the Continue to payment modal; it now only says "Choose one option to continue."
- **Basket-flow payment checkbox:** When payment is reached from the basket flow (`flow_type === "basket"`), the payment page shows a required checkbox "I understand basket selections are for in-person harvest planning only." Users must check it to continue; otherwise they see a message. Donate and cart flows are unchanged and do not see this checkbox.

**Date:** 2026-03-07

- **Shop page first card placeholder:** When the shop has products, the first section card on `/shop` now shows an "Our shop" subheading so the card is never empty; the empty-state message and add-to-cart status behavior are unchanged.

**Date:** 2026-03-07 (Zero-payment harvest flow)

- **Basket $0 flow:** When the user sets Payment Amount to $0 and clicks Confirm and checkout, the sign-in popup does not appear. The client POSTs basket items to `/api/harvest/record-basket`, which records quantities via the existing `add_harvest_quantity` RPC (same as paid flow). On success, the basket is cleared and the user is redirected to `/harvested`. No DB schema or RLS changes; the new API uses the server Supabase client.
- **Harvested page:** `/harvested` is a thank-you page with title "Thank you for visiting", copy thanking visitors and inviting them to consider volunteer opportunities (with link to `/volunteer`), and links back to harvest and home.

**Date:** 2026-03-09 (Dedicate a Tree campaign)

- **Route and auth:** Added `/dedicate` with a Google-only gate. Users must sign in with Google before they can access the dedication form. Guest checkout is not allowed for this flow.
- **Campaign model:** Added `tree_campaign` (single-row settings/inventory) and `tree_dedications` (one submission per paid dedication). Quantity starts at 18 and decrements by 1 on successful webhook finalize.
- **Pricing and validation:** Dedicate flow is fixed at `$350` and not editable by users. API creates Stripe sessions using server campaign price and rejects mismatched client amounts.
- **Stock safety:** Webhook finalize uses a race-safe stock claim function (`claim_tree_campaign_unit`) before creating `tree_dedications` rows. If sold out during finalize, we mark transaction status `sold_out` and do not insert a dedication row.
- **Finalize on return:** When the user lands on the payment return URL, `GET /api/checkout/session-status` is called. If Stripe reports the session as `complete`, we call `finalizeCheckoutByStripeId` there as well (idempotent: if the transaction is already `paid` or `sold_out`, we skip). This ensures `tree_dedications` and transaction status are updated even when the Stripe webhook has not yet run (e.g. local dev or webhook delay).
- **Home + return UX:** Home now shows a once-per-visit dedicate popup only when `quantity_remaining > 0`. Payment return now reads transaction `flow_type` and shows dedicated success copy for `dedicate_tree`.
- **Admin visibility:** Admin now has `tree_campaign` and `tree_dedications` tabs for managing campaign settings and reviewing submissions (name, email, image, dedication text, payment confirmation).
