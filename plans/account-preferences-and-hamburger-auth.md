# Account Preferences Page and Hamburger Auth Links

**Date:** 2025-02-25  
**Summary:** Add "Sign in" in the hamburger menu (Google); when signed in, replace it with "View my profile" linking to a user_preference page. That page shows only user-relevant columns (email, email_newsletter, full_name, volunteer_updates) with toggles, plus a "Delete profile" confirmation modal. No RLS changes.

---

## Current state

- **Auth**: Google sign-in via [CreateAccountModal.js](components/CreateAccountModal.js); browser Supabase client from [lib/supabase/browser.js](lib/supabase/browser.js). No app code yet reads session or shows different UI when signed in.
- **Table**: Supabase **`user_preference`** (RLS enabled). Columns: `id`, `created_at`, `user_id`, `email_newsletter`, `updated_at`, `email`, `full_name`, `volunteer_updates`. Name lives here as **full_name** (user fixed the column to snake_case).
- **profiles**: Has `full_name`, `avatar_url`, and links to `user_preference.email`; no `first_name`/`last_name`.
- **Exclude from user-facing page**: `id`, `created_at`, `updated_at`, `user_id` (internal / not for user control).
- **Show on preference page** (as column headers / controls): **email**, **email_newsletter**, **full_name**, **volunteer_updates**.
- **Modal pattern**: [CreateAccountModal.js](components/CreateAccountModal.js) uses a backdrop that closes on click and inner content with `onClick={(e) => e.stopPropagation()}`. Same pattern for delete confirmation.

---

## 1. Hamburger menu: Sign in vs View my profile

- **When signed out**: In the hamburger menu ([Header.js](components/Header.js)), add a **"Sign in"** hyperlink. Clicking it triggers **sign in with Google** (same flow as the existing Create Account modal — e.g. open that modal, or a dedicated sign-in page that calls `signInWithOAuth({ provider: "google" })`).
- **When signed in**: Replace the "Sign in" link with a **"View my profile"** hyperlink that routes to the user preference page (e.g. `/account` or `/profile`). Only one of the two is visible at a time, depending on auth state.
- **Implementation**: Header (or a client child used inside it) must read auth state (e.g. `getBrowserSupabaseClient().auth.getSession()` or `getUser()`) and render either "Sign in" or "View my profile" in the same slot in the nav.

---

## 2. User preference page (signed-in only)

- **Route**: e.g. `app/account/page.js` (or `app/profile/page.js`). Content only when signed in; otherwise redirect or "Sign in to view your account" CTA.
- **What to display**: The **column headers from `user_preference` that are relevant for the user**, excluding: `id`, `created_at`, `updated_at`, `user_id`. So the page shows controls/labels for: **email**, **email_newsletter**, **full_name**, **volunteer_updates**.
- Each can be shown as a label + toggle (for boolean-like prefs) or label + text display/edit (e.g. email, full_name). Toggles update the row in the DB via the browser Supabase client (RLS applies).

---

## 3. Delete profile button and confirmation modal

- **Button**: At the bottom of the account page, a single button: "Delete profile" (or "Delete my account", depending on scope).
- **Modal**: On click, open a modal (reuse existing `.modal-backdrop` / `.modal` styles from [app/globals.css](app/globals.css)).
  - **Copy**: "Are you sure?" with two actions: **Confirm** and **Close**.
  - **Close behavior**: Modal closes when the user clicks **Close** or clicks anywhere **outside** the modal (on the backdrop). Backdrop `onClick` to close; modal content div `onClick={(e) => e.stopPropagation()}` so clicks on the popup do not close it. Same pattern as CreateAccountModal.
- **Confirm action**: On Confirm, perform the delete (see below), then close the modal and redirect/sign out as needed.

---

## 4. What "delete profile" does

- **Minimal scope**: Delete the current user's row in `user_preference` and their row in `profiles` (both keyed by `auth.users.id` / user_id). Then call `supabase.auth.signOut()` and redirect to `/`. RLS will allow delete only on their own rows.
- **Broader scope**: If "delete profile" should also remove the auth account, that requires a Supabase Edge Function or admin API. Document in Push-to-Production or Potential-Features if we do the minimal version for now.

---

## 5. Implementation details (no RLS changes)

- **Supabase access**: Use `getBrowserSupabaseClient()` so the user's JWT is sent; RLS enforces access. No new or changed RLS policies.
- **Auth check**: Account page (client component) checks session on mount; if none, redirect or show sign-in CTA. Header uses the same session check to show "Sign in" vs "View my profile".
- **Create/update row**: If the user has no `user_preference` row yet, you may need to insert one (with `user_id`, and optionally `email` from `auth.user.email`). Ensure RLS allows insert for the authenticated user's own row; if not, propose the policy change explicitly.
- **Styling**: Follow [Layout and Branding Rules](Word doc/Layout and Branding Rules.md): titles (Libre Baskerville Bold), subheadings/paragraph (Poppins), Parchment background, palette. Use existing `.modal-backdrop` and `.modal` for the delete confirmation.

---

## 6. File and doc updates

- **New**: `app/account/page.js` — client wrapper that checks auth and renders the account UI (or redirect/sign-in CTA).
- **New**: Optional component for the preferences form (toggles + edit for the four columns) and a delete confirmation modal.
- **Header**: In the hamburger menu, show "Sign in" when signed out and "View my profile" when signed in (link to account page). Header or a client child must read session.
- **Docs**: Log in Project-Decisions.md that the account page is the signed-in destination for managing user_preference; document "delete profile" scope. If we add a for-now behavior (e.g. no auth account deletion), add a chapter to Push-to-Production.md.

---

## Schema reminder

| Table             | Shown on preference page (exclude id, created_at, updated_at, user_id) |
|------------------|------------------------------------------------------------------------|
| `user_preference` | **email**, **email_newsletter**, **full_name**, **volunteer_updates**  |

`profiles` has `full_name`, `avatar_url` and links to user_preference.email; use if needed for display. Preference page displays only the four user_preference columns above; toggles or edit as appropriate per column type.

---

## Build checklist

- [x] **Header**: In hamburger menu, add auth check (getSession). When signed out: "Sign in" link/button that triggers `signInWithOAuth({ provider: "google" })`. When signed in: "View my profile" link to `/account`. Close menu on nav.
- [x] **Route**: `app/account/page.js` — client component; if no session, redirect to `/` or show "Sign in to view your account"; if session, fetch `user_preference` where `user_id = user.id` and render preferences UI.
- [x] **Preferences form**: Display and edit email, email_newsletter (toggle → jsonb e.g. `{ "enabled": true }`), full_name (text), volunteer_updates (toggle or text). Update DB on change via browser Supabase client.
- [x] **Delete profile**: Button at bottom; on click open modal "Are you sure?" with Confirm and Close; backdrop click or Close dismisses; on Confirm delete user_preference row + profiles row for current user, signOut, redirect to `/`.
- [x] **Styling**: Use existing .modal-backdrop / .modal; follow Layout and Branding Rules (Libre Baskerville title, Poppins subheading/paragraph, Parchment background).
- [x] **Docs**: Update Project-Decisions.md and Push-to-Production.md per decision-and-code-logging rule.
