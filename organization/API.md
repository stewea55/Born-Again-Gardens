# API

**Date:** 2025-02-05; **2025-02-16** (design principles locked in).

When we start building the API, document routes, auth, and payloads here (per [Filing-Checklist.md](Filing-Checklist.md)).

**Source of truth for v1 design:** [plans/api-and-backend-plan.md](../plans/api-and-backend-plan.md).

---

## API design principles (locked in)

These principles are locked in. See [Project-Decisions.md](Project-Decisions.md) for the decision record.

### REST and structure

- **HTTP verbs:** GET reads, POST creates, PATCH updates, DELETE removes.
- **Single resource + query params:** Prefer one endpoint with params over many one-off endpoints. Example: `GET /plants?status=available&category=vegetable` instead of `/getAvailableProduce`.
- **Endpoints are nouns, not verbs:** Use `POST /checkout/sessions`, not `POST /createCheckoutSession`.
- **No side effects in GET:** GET requests must not create, update, or delete anything. Keeps responses cache-friendly.

### Paths and auth

- **Public vs user-specific:** Same resource paths; auth required only where needed. Public: `GET /plants`, `GET /plants/:id`, `GET /content/hero`. User-specific: `GET /me`, `GET /me/donations`, etc. No `/public/` prefix.
- **`/me` for current user:** All "my stuff" lives under `/me` (profile, donations, history, delete account).

### Naming and casing

- **snake_case everywhere:** All API field names and query params use snake_case (matches Supabase). Example: `created_at`, `harvest_start`, `limit`, `offset`.

### Response format

- **Global envelope:** All success responses use `{ "data": ..., "meta": ... }`.
  - List: `{ "data": [ ... ], "meta": { "limit": 20, "offset": 0, "total": 312 } }`
  - Single item: `{ "data": { ... }, "meta": {} }`
- **Stable shapes:** Keep response schemas consistent across endpoints so the frontend can rely on them.

### Error format

- **Structure:** `{ "error": { "code": "SOME_CODE", "message": "Human readable", "details": {} } }`
- **Status codes:**
  - 200 OK (GET, PATCH)
  - 201 Created (POST that creates a resource)
  - 204 No Content (DELETE, no body)
  - 400 Bad Request (malformed request: invalid JSON, bad syntax)
  - 401 Unauthorized (not authenticated)
  - 403 Forbidden (authenticated but not allowed)
  - 404 Not Found
  - 409 Conflict (e.g. duplicate, state conflict)
  - 422 Unprocessable Entity (valid JSON but validation failed)
  - 500 Internal Server Error

### Pagination and sorting

- **Pagination:** `?limit=20&offset=0` (offset/limit for now; cursor-based only if needed later).
- **Sorting:** `?sort=created_at&order=desc` (single-field sort; multi-field later if needed).

### Caching

- **Design for cacheability now:** No side effects in GET, clear public vs user-specific separation, stable response shapes. Do not implement ETag/Cache-Control until caching is actually needed.

---

## API surface (v1)

- **Base URL:** `https://bornagaingardens.org/api/v1`
- **Public:** Hero/dynamic content, plant catalog (list with type filter and harvest-month visibility).
- **Checkout:** Create session (guest vs company); Stripe integration.
- **Authenticated user:** "Me," history, "delete my account."
- **Admin:** Masquerade, monitor, modify certain tables (design TBD).

OpenAPI blueprint can live in `plans/` or repo root and feed into this file when ready.

---

## Checkout endpoints (draft)

**Date:** 2026-02-23

These endpoints match the “pending record → Stripe → webhook finalize” flow.

### `POST /checkout/sessions`

Creates a pending `transaction` and related records, then returns a Stripe session URL.

**Request (guest example):**
```json
{
  "flow_type": "guest",
  "guest": {
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com"
  },
  "payment": {
    "payment_amount": 25.00,
    "donation_amount": 5.00,
    "cart": [{ "plant_id": 12, "quantity": 1 }]
  },
  "privacy_accepted": true
}
```

**Response (success):**
```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/...",
    "transaction_id": 123,
    "status": "pending"
  },
  "meta": {}
}
```

**Response (error):**
```json
{
  "error": {
    "code": "validation_failed",
    "message": "privacy_accepted is required",
    "details": {}
  }
}
```

**Error codes (draft):** `validation_failed`, `stripe_failed`, `payment_canceled`, `payment_not_created`

### `POST /stripe/webhook`

Stripe sends confirmed results here. The webhook updates `transaction.status` and related records.

**Notes:**
- This is server-only. Webhooks do **not** show user-facing errors.
- Use Stripe signature verification.
- Update status values: `pending` → `paid` or `failed`.

---

## Checkout and cart updates (backbone v1)

**Date:** 2026-02-26

### `PUT /api/cart`

Stores the authenticated user's cart server-side in `profiles.cart` (shop) or `profiles.basket` (harvest).

- Requires Bearer access token from Supabase session.
- Request body:
  - `cart_type`: `shop` or `harvest`
  - `items`: array of `{ item_type, item_id, quantity, size, unit_price, metadata }`
- Guest users do not call this route; they use local storage.

### `GET /api/cart?cart_type=shop|harvest`

Returns authenticated user's current server-side cart items from `profiles.cart` or `profiles.basket`.

### `POST /api/checkout/sessions`

Creates guest row, then Stripe Checkout Session (embedded), then transaction row with `stripe_id` set. Returns `client_secret` for Stripe Embedded Checkout (no redirect URL).

- Supported `flow_type`: `cart`, `basket`, `donate`
- Supported `entry_mode`: `guest`, `google`
- For `google`, frontend resolves profile info and submits to checkout payload.
- **Response (success):** `{ data: { client_secret, return_url, status } }` — frontend uses `client_secret` with Stripe Embedded Checkout; after payment Stripe redirects to `return_url` (e.g. `/payment/return?session_id=...`).

### `GET /api/checkout/session-status?session_id=cs_...`

Retrieves Checkout Session from Stripe and returns status for the return page.

- **Response:** `{ data: { status, customer_email } }` — `status` is `complete` or `open`; `customer_email` from session when available.

### `POST /api/stripe/webhook`

Verifies Stripe webhook signature and finalizes `transaction.status` by `stripe_id` (session id):

- `checkout.session.completed` -> `paid`
- `checkout.session.expired` -> `failed`

---

## Auth / current user

**Date:** 2026-03-02

### `GET /api/auth/me`

Returns whether the current user is an admin. Used by the header (to show or hide the "Admin dashboard" link) and by the admin page (to redirect non-admins).

- **Auth:** Bearer access token from Supabase session (required).
- **Response:** `{ "isAdmin": true }` or `{ "isAdmin": false }`. Returns `isAdmin: false` when not authenticated, token invalid, or profile role is not `admin`. Does not expose role or any admin URL.

---

## Admin endpoints (xEdits 1.1)

**Date:** 2026-03-01

These routes power the in-app admin dashboard (`/admin`) and rely on Supabase auth + RLS for access control.

### `GET /api/admin/:resource`

Returns rows for the selected admin resource.

- Requires Bearer access token from Supabase session.
- Supported resources in this build:
  - `plant_catalog`
  - `guests`
  - `profiles`
  - `user_preference`
  - `transaction`
  - `resources`
  - `shop_catalog`
  - `sponsors_public`
  - `volunteers`
  - `upcoming_events` (mapped to `resources` where `page = 'volunteer'` and `resource_type = 'upcoming_event'`)

### `POST /api/admin/:resource`

Creates or updates a row for the selected resource.

- If payload includes the resource id, route updates the existing row.
- If payload does not include id, route inserts a new row.
- For `upcoming_events`, payload uses:
  - `title` -> `resources.resource_name`
  - `details` -> `resources.image_url`
  - Fixed filters: `page = 'volunteer'`, `resource_type = 'upcoming_event'`

### `DELETE /api/admin/:resource`

Deletes one row by id for the selected resource.

- Request body: `{ "id": <row_id> }`
- `upcoming_events` delete is constrained to volunteer event rows in `resources`.

### `POST /api/admin/upload`

Uploads an image/file to Supabase Storage for admin-managed content.

- Requires Bearer access token.
- Request: `multipart/form-data` with:
  - `file` (required)
  - `bucket` (optional, defaults to `admin-assets`)
  - `folder` (optional, defaults to `admin`)
- Response includes `publicUrl`, `bucket`, and `path`.

### `GET /api/admin/sponsors-layout`

Returns admin-only sponsors layout editor data in one response:

- Sponsors catalog rows from `sponsors_public` (including `layout` and `display_order`)
- Canvas config from `sponsors_section_config` (`canvas_width`, `canvas_height`)

### `POST /api/admin/sponsors-layout`

Saves the admin-edited sponsors canvas:

- Request body:
  - `canvas`: `{ "width": number, "height": number }`
  - `items`: array of `{ "id": "<sponsor_uuid>", "layout": { "logo": { centerX, centerY, width, height } | null, "name": { centerX, centerY, width, height, fontSize } | null } | null, "display_order": number | null }`
- Behavior:
  - Upserts canvas size in `sponsors_section_config`
  - Updates each sponsor row in `sponsors_public` with `layout` + `display_order`
  - If `layout.logo` or `layout.name` is set to `null`, only that object is removed from canvas
  - If both are `null` (or `layout` is `null`), sponsor is hidden from canvas/home only (row is not deleted)

