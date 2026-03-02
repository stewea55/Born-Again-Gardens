# Supabase edits – docs verification

**Date:** 2026-02-27  
**Summary:** Confirmation that our migrations and RPC/trigger code match Supabase’s documented patterns for JSON, RLS, column-level security, triggers, and database functions.

---

## 1. profiles.cart and profiles.basket (jsonb)

**Migration:** `20260227_001_profiles_cart_basket.sql`

**Supabase docs:** [Managing JSON and unstructured data](https://supabase.com/docs/guides/database/json)

- Doc: “The recommended type is **jsonb** for almost all cases.”
- Doc: “Create a jsonb column in the same way you would create a text or int column” (e.g. `metadata jsonb`).
- Our migration: `add column ... cart jsonb not null default '[]'::jsonb` and same for `basket`. Valid JSON default for an empty array.

**Verdict:** Aligned with Supabase JSON docs.

---

## 2. RLS policy “update own profile”

**Migration:** `20260227_002_profiles_rls_cart_basket_only.sql` (policy part)

**Supabase docs:** [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

- Doc: Policies use `CREATE POLICY "name" ON table FOR command TO role USING (expression) WITH CHECK (expression)`.
- Doc: “Supabase maps every request to … **authenticated** … You can use these roles within your Policies using the **TO** clause.”
- Doc: Example update policy: `create policy "Allow update for owners" on posts for update using ((select auth.uid()) = user_id);`
- Our policy: `create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());` — same pattern; `profiles.id` is the user id (FK to auth.users).

**Verdict:** Aligned with Supabase RLS docs.

---

## 3. Column-level privileges (cart, basket only)

**Migration:** `20260227_002_profiles_rls_cart_basket_only.sql` (revoke/grant part)

**Supabase docs:** [Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security)

- Doc: “Revoke the table-level UPDATE privilege from the authenticated role and granting a column-level UPDATE privilege on just the title and content columns”:
  ```sql
  revoke update on table public.posts from authenticated;
  grant update (title, content) on table public.posts to authenticated;
  ```
- Our migration: `revoke update on table public.profiles from authenticated; grant update (cart, basket) on table public.profiles to authenticated;` — same pattern.

**Verdict:** Aligned with Supabase column-level security docs.

---

## 4. Trigger (plant_name from plant_catalog)

**Migration:** `20260227_004_harvest_quantity_trigger_plant_name.sql`

**Supabase docs:** [Postgres Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

- Doc: “Creating triggers involve 2 parts: The actual Trigger object … and a Function which will be executed.”
- Doc: Example trigger: `create trigger "trigger_name" after insert on "table_name" for each row execute function trigger_function();`
- Doc: “Trigger before changes are made”: `create trigger before_insert_trigger before insert on orders for each row execute function before_insert_function();`
- Doc: Trigger function “returns trigger”, “language plpgsql”, uses `NEW` and `return new;`.
- Our migration: Trigger uses `before insert or update … for each row execute function set_harvest_quantity_plant_name();`. Function returns `trigger`, language `plpgsql`, sets `new.plant_name` from `plant_catalog` and returns `new`.

**Verdict:** Aligned with Supabase trigger docs.

---

## 5. Database function / RPC (add_harvest_quantity)

**Migration:** `20260227_005_harvest_quantity_rpc_add_quantity.sql`

**Supabase docs:** [Database Functions](https://supabase.com/docs/guides/database/functions)

- Doc: “At its most basic a function has … create or replace function name() … returns type … language sql … as $$ body $$;”
- Doc: “If it returns nothing, you can **returns void**.”
- Doc: “Passing parameters” example: `create or replace function add_planet(name text) returns bigint language plpgsql …`
- Our function: `create or replace function add_harvest_quantity(p_plant_id int4, p_quantity numeric) returns void language sql as $$ … $$;` — same structure. Body uses standard Postgres `INSERT ... ON CONFLICT ... DO UPDATE` (documented in Postgres, not Supabase-specific).

**Verdict:** Aligned with Supabase database functions docs. Callable via `supabase.rpc('add_harvest_quantity', { p_plant_id, p_quantity })` per [JavaScript RPC reference](https://supabase.com/docs/reference/javascript/rpc).

---

## 6. Unique constraint (harvest_quantity.plant_id)

**Migration:** `20260227_003_harvest_quantity_unique_plant_id.sql`

Standard Postgres: `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (column)`. Supabase uses Postgres; no separate “Supabase” pattern. **Verdict:** Standard and correct.

---

## Summary

| Migration / feature           | Supabase doc reference                    | Aligned |
|-----------------------------|-------------------------------------------|--------|
| profiles cart/basket jsonb  | Database > JSON                           | Yes    |
| RLS “update own profile”    | Database > RLS                            | Yes    |
| Column privileges (cart, basket) | Database > Column Level Security    | Yes    |
| Trigger (plant_name)        | Database > Postgres Triggers              | Yes    |
| RPC add_harvest_quantity   | Database > Database Functions (+ RPC JS)  | Yes    |
| Unique on plant_id          | Postgres standard                         | Yes    |

All edits are in line with Supabase documentation and Postgres syntax used by Supabase.
