# Born Again Gardens Initial Build Plan

**Date:** 2026-02-24

**Summary:** Scaffold a new Next.js App Router app at the repo root, implement the documented public pages and Create Account popup, and wire Supabase + Stripe using the live schema so guest/company/volunteer submissions and checkout flow persist correctly.

---

## Plan

- **Scaffold the app in repo root**
  - Create a new Next.js App Router project in the repo root (no existing app detected).
  - Add base structure for `app/`, `lib/`, and UI components.
- **Global layout + branding**
  - Implement header/footer per the branding rules in [Word doc/Layout and Branding Rules.md](../Word%20doc/Layout%20and%20Branding%20Rules.md).
  - Apply fonts (Libre Baskerville, Poppins, Cormorant Garamond) and the color palette with Parchment as the default background.
- **Supabase + Stripe wiring (schema-first)**
  - Read Supabase schema (columns + constraints) for `guests`, `volunteers`, `sponsors_public`, `sponsors_private`, `transaction`, and any lookup tables needed for images/resources. Table names must match exactly (see [organization/Form-API-to-DB.md](../organization/Form-API-to-DB.md) and [organization/Project-Decisions.md](../organization/Project-Decisions.md)).
  - Set up `lib/` Supabase clients (server + browser) and keep business logic in `lib/` per backend rules.
  - Add Stripe server-side logic for session creation and webhook finalization per [plans/payment-flow-app-router.md](payment-flow-app-router.md) and [organization/API.md](../organization/API.md).
- **Pages + routes from docs**
  - Build pages from the copy docs:
    - Home: [Word doc/Pages/home.md](../Word%20doc/Pages/home.md)
    - About Us: [Word doc/Pages/about-us.md](../Word%20doc/Pages/about-us.md)
    - Donate: [Word doc/Pages/donate.md](../Word%20doc/Pages/donate.md)
    - Sponsorships: [Word doc/Pages/sponsorships.md](../Word%20doc/Pages/sponsorships.md)
    - Volunteer: [Word doc/Pages/volunteer.md](../Word%20doc/Pages/volunteer.md)
    - Happy to Serve You: [Word doc/Pages/happy-to-serve-you.md](../Word%20doc/Pages/happy-to-serve-you.md)
  - Create a minimal placeholder `/harvest` page per your request (not the full harvest flow yet).
  - Add empty containers for: Donation Options, Sponsorship Options, Our Generous Sponsors (no placeholder text).
- **Create Account popup + auth / forms**
  - Add a modal with three actions: "Sign in with Google," "Continue as guest" (link-style), and "On behalf of a company."
  - Google sign-in calls Supabase OAuth.
  - Guest and Company open forms built from the live schema (see Form-API-to-DB.md):
    - Guest form writes to `guests`.
    - Company form combines `sponsors_public` + `sponsors_private` inputs (no duplicates) and inserts in the correct order based on DB constraints.
- **Volunteer signups**
  - Wire the Volunteer and Happy‑to‑Serve‑You forms to insert into `volunteers`.
  - Add a small API route for inserts if RLS does not allow anon inserts.
- **Images from DB (with null placeholders)**
  - Query the `resources` table for the image URLs referenced in docs (e.g. lydia_image, sterling_image, Sponsorships-tiers.png).
  - If an image URL is missing, render a simple empty placeholder (no fallback asset) and ask you for the missing resource.
- **Production notes**
  - Add a brief "for‑now" entry in Push‑to‑Production if we ship a placeholder `/harvest` page (per the project rule).

## Key assumptions

- Next.js App Router in repo root with Supabase + Stripe, using `.env.local` for keys.
- DB schema in Supabase is authoritative; forms reflect actual column names and required fields (Form-API-to-DB.md is the single mapping record).
- Harvest page is placeholder only for now.

## Todos (from original plan)

- [ ] Scaffold Next.js App Router in repo root
- [ ] Implement header/footer, fonts, palette rules
- [ ] Read schema, set up Supabase/Stripe + routes
- [ ] Build pages + modal + placeholder sections
- [ ] Wire guest/company/volunteer forms to DB
