-- One row per plant: enforce uniqueness so we can use upsert (INSERT ... ON CONFLICT).
alter table public.harvest_quantity
  add constraint harvest_quantity_plant_id_key unique (plant_id);
