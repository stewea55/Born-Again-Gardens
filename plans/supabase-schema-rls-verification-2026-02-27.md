# Supabase schema and RLS verification (cart/basket implementation)

**Date:** 2026-02-27  
**Summary:** Verification of DB names, types, and RLS for the profiles/guests cart and basket + harvest_quantity flow. One change required (profiles RLS) before the new code will work for signed-in users.

---

## 1. Tables and columns (from Supabase)

### profiles
| Column      | Type      | Nullable | Notes |
|------------|-----------|----------|--------|
| id         | uuid      | NO       | PK, FK to auth.users |
| created_at | timestamptz | NO    | default now() |
| email      | text      | NO       | |
| full_name  | text      | NO       | |
| updated_at | timestamptz | YES   | |
| pii_deleted_at | timestamptz | YES | |
| role       | text      | NO       | default 'user' — **must never be user-writable** |
| avatar_url | text      | YES      | |

**Missing:** `cart` and `basket` columns. The migration `20260227_001_profiles_cart_basket.sql` adds them (jsonb not null default '[]'). **You need to run this migration** before the cart API can persist to profiles.

---

### guests
| Column    | Type      | Nullable | Notes |
|-----------|-----------|----------|--------|
| id        | uuid      | NO       | default gen_random_uuid() |
| created_at | timestamptz | NO    | default now() |
| full_name | text      | NO       | |
| payment_amount | numeric | NO    | |
| donation_amount | numeric | YES   | |
| cart      | jsonb     | YES      | **Matches our code** (array of cart items). |
| payment_confirmation | text | YES | |
| email     | text      | NO       | |
| basket    | jsonb     | YES      | **Matches our code** (array of basket items). |

Names and types are correct. Our code writes `cart` and `basket` as jsonb arrays; no change needed.

---

### transaction
| Column         | Type    | Nullable | Notes |
|----------------|---------|----------|--------|
| id             | bigint  | NO       | identity |
| user_id        | uuid    | YES      | FK to profiles.id — **we set this for logged-in checkout** |
| payment        | numeric | NO       | |
| donation_amount| numeric | NO       | |
| created_at     | timestamptz | NO   | default now() |
| stripe_id      | text    | NO       | |
| guest_id       | uuid    | YES      | FK to guests.id |
| status         | text    | YES      | |
| user_name      | text    | YES      | |
| guest_name     | text    | YES      | |

Both `user_id` and `guest_id` are nullable. Our code inserts with either `user_id` set (logged-in) or `guest_id` set (guest). **No schema change needed.**

---

### harvest_quantity
| Column    | Type      | Nullable | Notes |
|-----------|-----------|----------|--------|
| id        | uuid      | NO       | default gen_random_uuid() |
| plant_id  | integer   | NO       | FK to plant_catalog.id |
| quantity  | numeric   | NO       | |
| created_at | timestamptz | NO    | default now() |
| plant_name | text     | YES      | display name |

Matches what the code expects. **Note:** There is no UNIQUE constraint on `plant_id`. The code uses “select one row by plant_id, then update or insert.” If you ever have multiple rows per plant_id, we would only update one and could create duplicates. For “one row per plant, add quantities,” consider adding a unique constraint on `plant_id` and using an upsert (ON CONFLICT). Not required for the current logic to run.

---

## 2. RLS and server client usage

- **Server-side (createPendingCheckout, insertTransaction, finalizeCheckoutByStripeId):** Use `getServerSupabaseClient()` → **service role** key. RLS is bypassed. So:
  - Insert/update on **guests**, **transaction**, **profiles** (basket clear), **harvest_quantity** are all allowed.
- **Cart API (GET/PUT /api/cart):** Uses `getAuthedServerSupabaseClient(token)` → **anon** key with the user’s JWT. RLS applies for **profiles**.

---

## 3. RLS policies (relevant tables)

### profiles
- **SELECT:** “read own profile” (id = auth.uid()); “admin read all profiles” (is_admin()).
- **UPDATE:** Only “admin update profiles” (is_admin()). There is **no** policy that lets a non-admin user update their own row.

So when a signed-in user calls PUT /api/cart, the request runs as `authenticated` with the anon key. The update on `profiles` (setting `cart` or `basket`) is **denied by RLS**, because only admins can update profiles.

**Required change (choose one):**

- **Option A – RLS only (simplest):** Add a policy so users can update their own profile row, e.g.  
  - Name: “update own profile”  
  - Command: UPDATE  
  - Target roles: authenticated  
  - USING: `(id = auth.uid())`  
  - WITH CHECK: `(id = auth.uid())`  
  This allows updating any column, including `role`, so you must **not** rely on this alone if you need to block role changes.

- **Option B – RLS + column privileges (recommended):**  
  1. Add the same “update own profile” policy as in A.  
  2. Revoke table-level UPDATE on `profiles` from `authenticated`.  
  3. Grant UPDATE only on `cart` and `basket` to `authenticated` (see [Supabase Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security)).  
  Then users can only update their own row and only the `cart` and `basket` columns; they cannot change `role`.

- **Option C – RPC:** Expose a function that only sets `cart`/`basket` for the calling user and call it from the cart API instead of updating `profiles` directly.

I have **not** applied any RLS or privilege changes; per your rules, those require your explicit approval.

---

### guests
- **SELECT:** “admins can select guest” (is_admin()).
- No INSERT or UPDATE policies for non-admin roles.

The server uses the **service role** for guest insert (createPendingCheckout) and for reading/updating guests in finalizeCheckoutByStripeId, so RLS is bypassed. **No RLS change needed** for the new flow.

---

### transaction
- **SELECT:** “admin select transaction”; “authenticated select own transaction” (user_id = auth.uid()).
- No INSERT or UPDATE policies for non-admin.

Again, the server uses the **service role** for transaction insert and update. **No RLS change needed.**

---

### harvest_quantity
- RLS is enabled; policies were not listed in the query. Server writes use the service role, so **no change needed** for the new code.

---

## 4. Checklist before relying on the new code

| Item | Status |
|------|--------|
| Run migration `20260227_001_profiles_cart_basket.sql` (add profiles.cart, profiles.basket) | **You need to run this** |
| guests.cart / guests.basket jsonb | OK (already correct) |
| transaction.user_id / guest_id nullable | OK |
| harvest_quantity columns (plant_id, plant_name, quantity) | OK |
| RLS: allow authenticated to update own profiles for cart/basket only (Option B) or your choice | **You need to add policy/privileges** (see above) |

---

## 5. Summary

- **Schema:** Names and data types for guests, transaction, and harvest_quantity match the implementation. Profiles is missing `cart` and `basket` until the migration is run.
- **RLS:** The only blocker for the new cart/basket code is **profiles**: authenticated users cannot update their own row today. Add an “update own profile” path (and optionally column-level UPDATE only on `cart` and `basket`) so the cart API can persist without allowing `role` to be changed.

Once the migration is applied and the profiles RLS/privileges are in place, the implemented code is aligned with your Supabase DB.
