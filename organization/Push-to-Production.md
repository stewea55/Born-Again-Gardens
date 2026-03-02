# Push to Production

Pre-launch checklist. Each chapter is something that must be done or verified before go-live. See [Security-Checklist.md](Security-Checklist.md) and [.cursor/rules/production-path.mdc](../.cursor/rules/production-path.mdc).

**Date:** 2025-02-05 (chapters added from API and backend plan)

---

## 1. API base URL and env

**What we did (simple):** We defined the production API base URL as `https://bornagaingardens.org/api/v1` and version from day one.

**Why it matters:** The frontend and any external callers need to know the real API URL in production. Hardcoding the URL in code is brittle and breaks when you have staging vs production.

**What to do for production:**
- ~~Use an environment variable for the API base URL (e.g. `NEXT_PUBLIC_API_URL` or backend-only `API_BASE_URL`).~~ *(Included in initial scaffold.)*
- Set production value to `https://bornagaingardens.org/api/v1` on the host (Vercel/Railway).
- Set a different value for staging if you have a staging environment.
- ~~Do not hardcode the production URL in source code.~~ *(Included in initial scaffold.)*

**Reasoning:** Env-based config lets you switch environments without code changes and keeps secrets and environment-specific values out of the repo.

**Done:** [ ]

---

## 2. Supabase (backups, RLS, secrets)

**What we did (simple):** We use Supabase as source of truth (DB, auth, storage). Project is created (region East US (Ohio), Data API on, Postgres).

**Why it matters:** Before go-live we need backups, correct access control (RLS), and secrets only on the server so the app is safe and recoverable.

**What to do for production:**
- **Backups:** Set up backups (e.g. quarterly or pre-launch DB export to safe storage). Supabase has point-in-time recovery on paid plans; confirm what you have and document it.
- **RLS:** Enable RLS on all sensitive tables and add policies so only the right role (user, admin, backend) can read/write. No cross-user exposure.
- ~~**Secrets:** Store Supabase anon key and service role key in env vars on the server only. Never in frontend code or in the repo. `.gitignore` must cover `.env*`.~~ *(Included in initial scaffold.)*

**Reasoning:** Backups protect against data loss. RLS enforces who can see what at the DB layer. Server-only secrets prevent leaking keys to the client.

**Done:** [ ]

---

## 3. Stripe (live keys, webhooks, privacy policy)

**What we did (simple):** Payments go through Stripe (Embedded Checkout on /payment). Checkout requires accepting the privacy policy. After payment, Stripe redirects to our return URL (built from site base URL).

**Why it matters:** Live payments require live keys and a working webhook. The return URL and privacy policy URL must point at the real site.

**What to do for production:**
- Use Stripe **live** API keys in production env only (not test keys).
- Set **NEXT_PUBLIC_SITE_URL** to your production origin (e.g. `https://bornagaingardens.org`) so the Stripe Embedded Checkout return URL (`/payment/return?session_id=...`) is correct.
- Set **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** in env so the client can load Stripe.js (publishable key is safe for frontend).
- Configure the Stripe webhook endpoint for your production URL and set the signing secret in env.
- Set the privacy policy URL used at checkout and in the Stripe dashboard to the real, final URL.

**Reasoning:** Test keys must not be used in production. The return URL is derived from `getAppBaseUrl()` (NEXT_PUBLIC_SITE_URL); without it, redirects after payment would go to localhost. Webhooks need the correct origin and secret so Stripe can verify requests. Privacy policy URL must match what you promise users.

**Done:** [ ]

---

## 4. Domain and HTTPS

**What we did (simple):** The site and API are at bornagaingardens.org with API at `/api/v1` (same origin).

**Why it matters:** Users and the frontend must hit the real domain over HTTPS so traffic is encrypted and trusted.

**What to do for production:**
- Point bornagaingardens.org (and www if used) to your host (Vercel/Railway).
- Enforce HTTPS (host default; no HTTP-only access in production).
- Confirm the API is reachable at `https://bornagaingardens.org/api/v1` (or your chosen path).

**Reasoning:** HTTPS protects data in transit. Correct DNS and host config ensure the live site and API are where users expect.

**Done:** [ ]

---

## 5. PII and logs

**What we did (simple):** We store PII only where needed (guests, sponsors_private, profiles). Sensitive data must not leak in logs.

**Why it matters:** Logs and error tools (e.g. Sentry) can be visible to more people than the DB. Raw PII or payment data in logs is a compliance and security risk.

**What to do for production:**
- Confirm no raw PII or Stripe data is logged or attached to error reports (per [Security-Checklist.md](Security-Checklist.md)).
- When adding new PII fields or routes, apply the same rule: no raw PII in logs.

**Reasoning:** Logs are for debugging and ops, not for storing personal or payment details. Keeping PII out of logs reduces exposure and helps with compliance.

**Done:** [ ]

---

## 6. Retention notice (account deletion)

**What we did (simple):** When a user deletes their account, we show a notice that we may keep strictly necessary information for legal purposes (not payment type/method; may include PII).

**Why it matters:** Users must see this before they confirm deletion so they understand what we retain.

**What to do for production:**
- Finalize the exact copy and place it in the account-deletion flow (only when they go through with deletion).
- Document it here or in Project-Decisions so it’s not missed at launch.

**Reasoning:** Transparency at deletion builds trust and aligns with good practice around data retention.

**Done:** [ ]

---

## 7. Audit (admin actions)

**What we did (simple):** Admin can masquerade and change data. Sensitive actions should be logged.

**Why it matters:** If something goes wrong or we need to investigate, we need a record of who did what.

**What to do for production:**
- When admin features (masquerade, monitor, change data) are implemented, log sensitive actions (e.g. admin masquerade, bulk changes) as in [Security-Checklist.md](Security-Checklist.md).

**Reasoning:** Audit logs support accountability and debugging without exposing PII in the logs themselves.

**Done:** [ ]

---

## 8. Placeholder pages and assets (harvest + images)

**What we did (simple):** We shipped a placeholder Harvest page and placeholder images/empty sections while we build the full flow and gather final assets.

**Why it matters:** Placeholders are fine for early builds, but production should show the real harvest experience and brand assets so users trust the site and see the full story.

**What to do for production:**
- Replace the placeholder `/harvest` page with the real harvest flow.
- Replace the header logo placeholder with the final logo image.
- Load real image URLs from the `resources` table for `lydia_image`, `sterling_image`, and `Sponsorships-tiers.png`.
- Fill in the empty Donation Options, Sponsorship Options, and Our Generous Sponsors sections.

**Reasoning:** Placeholders are temporary scaffolding. Real content and assets are required for a polished, trustworthy production experience.

**Done:** [ ]

---

## 9. Delete profile (minimal scope)

**Date:** 2025-02-25

**What we did (simple):** "Delete profile" on the account page deletes the user's row in **user_preference** and **profiles**, then signs the user out and redirects to `/`. The auth account (Google) is **not** deleted—the user can sign in again and get a new preference row if one is created.

**Why it matters:** For production you may want true account deletion (auth user removed) so the user cannot sign back in with the same Google account, or you may want to keep this minimal behavior and document it.

**What to do for production:**
- Decide: keep minimal (delete data + sign out only) or add full account deletion (e.g. Supabase Edge Function or admin API calling `auth.admin.deleteUser()`).
- If keeping minimal: document in privacy/help that "Delete profile" removes their stored profile and preferences but they can sign in again; consider adding retention notice per chapter 6.
- If adding full deletion: implement and test; update RLS and any triggers that depend on auth.users.

**Reasoning:** Minimal scope avoids needing service-role or Edge Function for now. Full deletion requires backend or Supabase admin and may affect other tables that reference auth.users.

**Done:** [ ]

---

## 10. Stripe sandbox keys (for-now)

**Date:** 2026-02-26

**What we did (simple):** We intentionally use Stripe test/sandbox keys during local backbone implementation so payment flows can be tested safely.

**Why it matters:** Test mode prevents accidental real charges while we build and debug checkout flows.

**What to do for production:**
- Replace test keys with Stripe live keys in deployment env variables.
- Replace Stripe test webhook secret with live webhook secret.
- Run an end-to-end production dry run with very small live payment to verify webhook finalization.

**Reasoning:** Stripe mode is controlled by which keys are configured. Using test keys now is safer and faster while flows are still changing. Before launch, live mode is required because only live keys can create real charges and real accounting records.

**Done:** [ ]

---

## 11. Admin dashboard rollout (storage + authorization)

**Date:** 2026-03-01

**What we did (simple):** We added an in-app `/admin` dashboard with CRUD editors and image upload support (`/api/admin/*`).

**Why it matters:** Admin features touch sensitive data and file uploads, so production needs strict role checks, storage bucket setup, and audit visibility before launch.

**What to do for production:**
- Create and configure the storage bucket used by admin uploads (default `admin-assets`) and ensure only authorized admin users can upload/read as intended.
- Verify RLS/policies on all admin-edited tables so non-admin authenticated users cannot read/write admin-only records.
- Add audit logging for admin write actions (who changed what and when) for `/api/admin/:resource` and `/api/admin/upload`.
- Run a permission smoke test with one non-admin account and one admin account before launch.

**Reasoning:** The dashboard intentionally centralizes many write operations. Without storage policy setup and strict permission checks, unauthorized users could change content or upload files. Audit logs provide accountability and a recovery trail if bad changes happen.

**Done:** [ ]

---

## Summary (pre-launch checklist)

Order = order of work; security before performance.

- [ ] ~~API base URL in env; no hardcoded production URL~~ *(env usage included in scaffold; still set production value on host)*
- [ ] Supabase: backups, RLS on sensitive tables, ~~secrets in env only~~ *(secrets-in-env included in scaffold)*
- [ ] Stripe: live keys, NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, webhook and signing secret, privacy policy URL
- [ ] Domain and HTTPS enforced
- [ ] PII and Stripe data not in logs or error monitoring
- [ ] Retention notice in account-deletion flow and documented
- [ ] Audit logging for admin actions when implemented
- [ ] Replace placeholders: harvest flow, logo, resource images, section content
- [ ] Delete profile: confirm minimal vs full account deletion; add retention notice if keeping minimal (see chapter 9)
- [ ] Switch Stripe from test keys/webhooks to live production keys/webhooks (see chapter 10)
- [ ] Admin dashboard: storage bucket/policies, admin-only access checks, and audit logging (see chapter 11)
