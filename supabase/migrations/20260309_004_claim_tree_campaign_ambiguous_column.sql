-- 2026-03-09
-- Fix "column quantity_remaining is ambiguous" in claim_tree_campaign_unit.
-- The function RETURNS TABLE(... quantity_remaining ...) so inside the UPDATE/RETURNING
-- the name quantity_remaining can refer to the return column or the table column.
-- Use a table alias so all references are explicit.

create or replace function public.claim_tree_campaign_unit()
returns table(campaign_id bigint, quantity_remaining integer, price_per_tree numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id bigint;
begin
  select tc.id
  into v_campaign_id
  from public.tree_campaign tc
  where tc.active = true
  order by tc.id asc
  limit 1;

  if v_campaign_id is null then
    return;
  end if;

  return query
  update public.tree_campaign tc
  set quantity_remaining = tc.quantity_remaining - 1
  where tc.id = v_campaign_id
    and tc.quantity_remaining > 0
  returning tc.id, tc.quantity_remaining, tc.price_per_tree;
end;
$$;
