-- D: Auto-fill plant_name from plant_catalog so it's always in sync.
create or replace function set_harvest_quantity_plant_name()
returns trigger language plpgsql as $$
begin
  select name into new.plant_name from plant_catalog where id = new.plant_id;
  return new;
end;
$$;

drop trigger if exists harvest_quantity_set_plant_name on public.harvest_quantity;
create trigger harvest_quantity_set_plant_name
  before insert or update on public.harvest_quantity
  for each row
  execute function set_harvest_quantity_plant_name();
