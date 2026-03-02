-- 2026-03-01
-- Give plant_catalog.id a default so admin can insert new rows without supplying id.
-- Other admin tables already have id auto-generated (identity, gen_random_uuid(), or app-generated).

create sequence if not exists public.plant_catalog_id_seq;

select setval(
  'public.plant_catalog_id_seq',
  coalesce((select max(id) from public.plant_catalog), 1)
);

alter table public.plant_catalog
  alter column id set default nextval('public.plant_catalog_id_seq');
