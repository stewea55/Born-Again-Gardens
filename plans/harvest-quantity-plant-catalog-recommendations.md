# Harvest quantity & plant_catalog – recommendations

**Date:** 2026-02-27  
**Summary:** Options for harvest_quantity and plant_catalog given a static catalog and one row per plant. Pick what you want; we can implement next.

---

## Done

1. **Migration 1:** `profiles.cart` and `profiles.basket` added (jsonb, default `[]`). Applied via Supabase MCP.
2. **Migration 2 (Option B):** RLS policy “update own profile” (id = auth.uid()) plus column privileges so `authenticated` can only UPDATE `cart` and `basket` on `profiles`. Applied via Supabase MCP. Repo copy: `supabase/migrations/20260227_002_profiles_rls_cart_basket_only.sql`.

---

## Recommendations (choose what you want)

### A. harvest_quantity: add UNIQUE on plant_id (recommended if one row per plant)

- **What:** `ALTER TABLE harvest_quantity ADD CONSTRAINT harvest_quantity_plant_id_key UNIQUE (plant_id);`
- **Why:** Enforces one row per plant, and allows a single upsert:  
  `INSERT INTO harvest_quantity (plant_id, plant_name, quantity) VALUES ($1, $2, $3)  
   ON CONFLICT (plant_id) DO UPDATE SET quantity = harvest_quantity.quantity + EXCLUDED.quantity, plant_name = EXCLUDED.plant_name;`  
  No separate SELECT-then-update-or-insert; fewer round-trips and no race duplicates.
- **When to skip:** If you might later want multiple rows per plant (e.g. by date or batch), don’t add the unique.

---

### B. harvest_quantity: leave as-is

- **What:** No schema change. Keep current logic: select by plant_id, then update existing row or insert.
- **Why:** Works today; you’re sure there are no duplicate plant_ids. Easiest.
- **When to choose:** You’re happy with current behavior and don’t care about simplifying to an upsert.

---

### C. plant_catalog: no change

- **What:** Keep as-is. It’s the source of truth; harvest_quantity.plant_id already has an FK to plant_catalog.id.
- **Why:** Static catalog, no need to change. FK already prevents invalid plant_id in harvest_quantity.

---

### D. harvest_quantity: auto-fill plant_name from plant_catalog (optional)

- **What:** Trigger on INSERT/UPDATE of harvest_quantity: set `plant_name = (SELECT name FROM plant_catalog WHERE id = NEW.plant_id)` so the stored name always matches the catalog.
- **Why:** Single source of truth; no reliance on basket metadata for the name.
- **When to skip:** If you’re fine with plant_name coming from the basket (or being null) and don’t care about it matching the catalog exactly.

---

## What to tell me

Reply with something like:

- “A only” → we add the unique on plant_id and switch finalize logic to upsert.
- “B” → we leave harvest_quantity and code as they are.
- “A and D” → unique + trigger for plant_name.
- “Just C” → no changes; we’re good.

Then we move forward with the chosen options.

---

## Implemented (A + D, 2026-02-27)

- **A:** Unique constraint on `harvest_quantity.plant_id` applied. New RPC `add_harvest_quantity(p_plant_id, p_quantity)` does the upsert (add quantity when row exists, insert when not). Finalize logic in `lib/checkout/pending.js` now calls this RPC per basket item.
- **D:** Trigger `harvest_quantity_set_plant_name` on INSERT or UPDATE sets `plant_name` from `plant_catalog.name`, so the stored name always matches the catalog.

Migrations in repo: `20260227_003_harvest_quantity_unique_plant_id.sql`, `20260227_004_harvest_quantity_trigger_plant_name.sql`, `20260227_005_harvest_quantity_rpc_add_quantity.sql`.
