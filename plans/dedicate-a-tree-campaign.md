# Dedicate a Tree campaign — implementation plan

**Date:** 2026-03-09  
**Summary:** Dedicate a Tree campaign: home popup (once per visit, hidden when quantity = 0), route /dedicate, quantity check > 0, dedication text max 200 chars, optional user image upload, $350 fixed price; admin-only dedications table; tree-specific success copy.

---

## Summary

- **Route:** `/dedicate`. Page title "Dedicate a Tree". The **dedicate page form** collects: **name** (input), **email** (input), **price** (display only, $350), **dedication text** (input, max 200 chars), **optional image upload**. Then button **"Dedicate a tree"** → guest/Google gate → `/payment`. Quantity must be > 0 to proceed (enforced on page and in API).
- **Home popup:** Once per visit; **only visible when campaign quantity_remaining > 0**. Copy and layout from [xEdits 1.3/dedicate a tree popup.md](xEdits 1.3/dedicate a tree popup.md); image from `resources.dedicate_tree`. Click-outside-to-close; CTA → `/dedicate`.
- **Thank-you:** When payment was for a tree, show [xEdits 1.3/tree specific copy.md](xEdits 1.3/tree specific copy.md): "Payment success! Our garden is honored by your unique dedication. Thank you for making it special!"
- **No public dedications list.** Data is for internal use (buy and customize product for the user after purchase). Single campaign row (no slug).

---

## 1. Database

**Assumptions:** The existing `transaction` and `guests` tables exist; if not, they must be created first.

### Campaign (one row)

- **Table `tree_campaign`:**  
  - `id`, `total_quantity` (default 18; **not visible in admin UI**), `quantity_remaining` (starts 18; decrement by 1 on each successful tree checkout), `active` (boolean; true when quantity_remaining > 0, false when 0), `price_per_tree` (350), `image_url` (or reference to `resources.dedicate_tree`).
  - On successful tree payment: `quantity_remaining = quantity_remaining - 1`; if `quantity_remaining = 0` then `active = false`.
  - Popup is shown only when quantity_remaining > 0 (and once-per-visit). Dedicate page and API both require quantity > 0 to proceed.

### Dedications (admin table)

- **Table `tree_dedications`:**  
  - `id`, `transaction_id` (FK to `transaction`), `full_name`, `email`, `dedication_text` (text, max 200), `dedication_image` (optional, text — URL or storage path for user-uploaded image), `created_at`.
  - Price is always $350 from campaign.
- **Admin panel display:** Full Name, email, dedication text, dedication_image (optional), price per tree ($350), quantity remaining, active. Quantity remaining and active come from the single `tree_campaign` row. Total quantity is in DB but **not visible** in admin. Image URL = campaign image_url.
- **RLS:** Admin can **view and edit** the entire `tree_campaign` and `tree_dedications` tables. Public: only SELECT on `tree_campaign` for active campaign info (quantity_remaining, active, price, image_url) used by popup and dedicate page; **no** public access to `tree_dedications`.

### Transaction and flow context

- Add to `transaction`: `flow_type` (text, nullable), `checkout_context` (jsonb, nullable). For dedicate_tree, `checkout_context` stores **full_name**, **email** (from the dedicate page form), `dedication_text`, and optional `dedication_image` (URL after upload). On finalize: insert into `tree_dedications` using full_name, email from checkout_context (or guest/user when available), plus dedication_text and dedication_image; then decrement `tree_campaign.quantity_remaining`.

### Popup/campaign image

- Use `resources` row with `resource_name = 'dedicate_tree'` and `image_url` (per xEdits 1.3/dedicate a tree popup.md).

### Migrations

- New migration: `tree_campaign` (total_quantity, quantity_remaining, active, price_per_tree, image_url) + `tree_dedications` (transaction_id, full_name, email, dedication_text, dedication_image) + RLS; alter `transaction` add `flow_type`, `checkout_context`. RLS: admin full access on both new tables; public read-only on `tree_campaign` for active/quantity/price/image where needed.

---

## 2. Backend / checkout

- **Flow type:** Add `dedicate_tree` to `FLOW_TYPES` in lib/checkout/constants.js.
- **Validation:** For `flow_type === 'dedicate_tree'`: require `checkout_context.full_name` and `checkout_context.email` (from dedicate page form), `checkout_context.dedication_text` (non-empty, max 200 chars), optional `checkout_context.dedication_image` (URL); validate campaign exists and **quantity_remaining > 0** and payment_amount = 350. Return clear error if sold out or invalid.
- **Checkout session API:** Pass `flow_type` and `checkout_context` into `insertTransactionForCheckoutSession` and persist on transaction. Stripe line item label: "Tree dedication" (and optionally submit_type: 'donate').
- **Webhook / finalize:** In finalizeCheckoutByStripeId: if `flow_type === 'dedicate_tree'`, insert into `tree_dedications` (transaction_id, full_name, email, dedication_text, dedication_image from checkout_context + guest/user), then decrement `tree_campaign.quantity_remaining` (safeguard so it does not go below zero) and set `active = false` when quantity_remaining = 0.
- **Campaign data:** Server-side read or GET API for campaign (quantity_remaining, active, price_per_tree, image_url) so popup and dedicate page can show quantity and hide popup when 0.

---

## 3. Optional user image upload

- On the dedicate page: optional file input for "dedication image" (photo/icon/logo for the sign). Upload via API (e.g. to Supabase storage, e.g. bucket or folder for dedication uploads with appropriate RLS so app can write, admin can read). API returns public URL; store URL in `checkout_context.dedication_image` and then in `tree_dedications.dedication_image`.
- Validation: optional; if present, validate file type/size per project standards.

---

## 4. Frontend

- **Home popup:** Client component (e.g. DedicateTreePopup.js). Only render when campaign quantity_remaining > 0 (server passes this). Once per visit: sessionStorage flag (e.g. bag_dedicate_tree_popup_seen). Backdrop click closes; inner content stopPropagation. Content per xEdits 1.3/dedicate a tree popup.md: Title "Dedicate a Tree", image from `getResourceImageUrl('dedicate_tree')`, caption "A Living Legacy", product details copy. CTA links to `/dedicate`.
- **Dedicate page:** `app/dedicate/page.js`. Server loads campaign (quantity_remaining, active, price, image_url). If quantity_remaining = 0, show "sold out" message and do not show form. Otherwise: campaign copy (per xEdits 1.3/dedicate copy.md), then a **form** with: **name** (required input), **email** (required input), **price** (display only, $350), **dedication text** (required input, max 200 chars), **optional image upload**. Button **"Dedicate a tree"** → CheckoutGateModal (guest/Google; can prefill name/email from form) → saveCheckoutContext with flow_type dedicate_tree, payment_amount 350, checkout_context { full_name, email, dedication_text, dedication_image? } → router.push('/payment'). Validate quantity > 0, name, email, and dedication text before opening gate; API re-checks quantity > 0 when creating session.
- **Payment page:** Already sends flow_type and checkout_context; no change except optional dedicate_tree-specific message if desired.
- **Payment return:** Session-status (or equivalent) returns flow_type for completed payment. When status complete and flow_type === 'dedicate_tree', show tree-specific copy: "Payment success! Our garden is honored by your unique dedication. Thank you for making it special!" (from xEdits 1.3/tree specific copy.md) and e.g. "Return to home".

---

## 5. Copy and assets (locked in)

- **Popup:** xEdits 1.3/dedicate a tree popup.md — Title "Dedicate a Tree", image from public.resources.dedicate_tree, caption "A Living Legacy", product details as in doc.
- **Dedicate page:** xEdits 1.3/dedicate copy.md — Title, image, caption "A Living Legacy", product details; after purchase note about design confirmation.
- **Success:** xEdits 1.3/tree specific copy.md — "Payment success! Our garden is honored by your unique dedication. Thank you for making it special!"
- **Branding:** Follow Word doc/Layout and Branding Rules.md for typography and colors.

---

## 6. Files to add or touch

| Area | Action |
|------|--------|
| DB | Migration: tree_campaign, tree_dedications, RLS; alter transaction (flow_type, checkout_context). |
| lib/checkout/constants.js | Add dedicate_tree to FLOW_TYPES. |
| lib/checkout/validate.js | Validate dedicate_tree: dedication_text (max 200), optional dedication_image; campaign quantity > 0; payment_amount = 350. |
| lib/checkout/pending.js | insertTransactionForCheckoutSession: save flow_type, checkout_context. finalizeCheckoutByStripeId: if dedicate_tree, insert tree_dedications (full_name, email, dedication_text, dedication_image), decrement tree_campaign.quantity_remaining, set active when 0. |
| app/api/checkout/sessions/route.js | Pass flow_type/context to insert; Stripe label for dedicate_tree. |
| Campaign read | Server or GET API for campaign (quantity_remaining, active, price, image_url). |
| app/page.js | Fetch campaign (quantity_remaining, image from resources.dedicate_tree); render DedicateTreePopup only when quantity_remaining > 0. |
| DedicateTreePopup.js | sessionStorage once per visit; backdrop close; content per popup doc; CTA to /dedicate. |
| app/dedicate/page.js | Form: name, email, price (display $350), dedication text (max 200), optional image upload; "Dedicate a tree" button → gate → payment. |
| Upload API | Optional dedication image upload → storage → URL in checkout_context. |
| Session-status / return | Return flow_type for completed payment. |
| PaymentReturnClient.js | When complete and flow_type === dedicate_tree, show tree-specific thank-you copy. |
| Admin | Add tree_campaign and tree_dedications to admin panel (admin RLS: view and edit entire tables). Display: Full Name, email, dedication text, dedication_image, price per tree, quantity remaining, active; total_quantity not visible; image url. |
| Docs | Project-Decisions.md, Project-Simple-Decisions.md, API.md, Push-to-Production.md as needed. |

---

## 7. Decisions locked in

- **Route:** /dedicate.
- **Plaque/dedication text:** max 200 characters.
- **No campaign slug:** single campaign row only.
- **No public dedications list:** data for internal product customization only.
- **Button label:** "Dedicate a tree" (not "Confirm").
- **Quantity:** Start 18; decrement by 1 on successful checkout; popup hidden when quantity = 0; check quantity > 0 before payment (page + API).
- **Optional user image:** dedication_image optional; user can upload; stored and shown in admin.

---

## Action items (what we’re doing)

**Database**
- Add migration: create `tree_campaign` (total_quantity 18, quantity_remaining, active, price_per_tree 350, image_url) and `tree_dedications` (transaction_id, full_name, email, dedication_text, dedication_image).
- Add columns to `transaction`: `flow_type`, `checkout_context`.
- Add RLS: admin can view/edit both new tables; public can only read campaign (quantity, active, price, image) for popup and dedicate page.
- Ensure `resources` has a row for `dedicate_tree` (image for popup/campaign).

**Checkout / backend**
- Add `dedicate_tree` to FLOW_TYPES.
- Validate dedicate_tree: dedication_text required (max 200), optional dedication_image; quantity_remaining > 0; payment_amount = 350.
- When creating checkout session: save flow_type and checkout_context on the transaction row; Stripe label “Tree dedication”.
- On successful payment (webhook): insert row into tree_dedications (from transaction + checkout_context), decrement tree_campaign.quantity_remaining, set active = false when quantity hits 0.
- Add a way for the app to read campaign (quantity_remaining, active, price, image_url) — server helper or GET API.

**Home popup**
- Create DedicateTreePopup component: show only when quantity_remaining > 0; once per visit (sessionStorage); click-outside closes; content from dedicate a tree popup.md; CTA to /dedicate.
- On home page: load campaign; if quantity > 0, render popup with image from resources.dedicate_tree.

**Dedicate page**
- Create app/dedicate/page.js: load campaign; if sold out (quantity 0) show sold-out message; else show copy from dedicate copy.md, quantity left, $350, dedication text (max 200), optional image upload, button “Dedicate a tree” → gate modal → payment. Check quantity > 0 before opening gate.

**Upload (optional image)**
- Add API to upload dedication image to storage; return URL; dedicate page sends URL in checkout_context.dedication_image.

**Payment return**
- Session-status (or return flow) returns flow_type for the completed payment.
- PaymentReturnClient: when complete and flow_type is dedicate_tree, show tree-specific copy from tree specific copy.md and “Return to home”.

**Admin**
- Add tree_campaign and tree_dedications to admin panel: admin can view and edit; show Full Name, email, dedication text, dedication_image, price per tree, quantity remaining, active (total_quantity not shown); campaign image url.

**Docs**
- Update Project-Decisions, Project-Simple-Decisions, API.md, Push-to-Production as needed.
