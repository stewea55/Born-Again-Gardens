-- RPC: upsert harvest_quantity (add to quantity when plant_id exists, else insert). Trigger sets plant_name from catalog.
create or replace function add_harvest_quantity(p_plant_id int4, p_quantity numeric)
returns void language sql as $$
  insert into public.harvest_quantity (plant_id, quantity)
  values (p_plant_id, p_quantity)
  on conflict (plant_id) do update set
    quantity = harvest_quantity.quantity + excluded.quantity;
$$;
