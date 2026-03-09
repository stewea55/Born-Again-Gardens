-- 2026-03-09
-- RLS on upcoming_events: SELECT for anon and authenticated (volunteer page);
-- INSERT/UPDATE/DELETE for authenticated admins only (same pattern as sponsors_public).

alter table public.upcoming_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'upcoming_events' and policyname = 'upcoming_events read anon and auth'
  ) then
    create policy "upcoming_events read anon and auth"
      on public.upcoming_events
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'upcoming_events' and policyname = 'admins full access upcoming_events'
  ) then
    create policy "admins full access upcoming_events"
      on public.upcoming_events
      for all
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;
