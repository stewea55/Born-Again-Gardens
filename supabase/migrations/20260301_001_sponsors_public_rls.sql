-- 2026-03-01
-- RLS on sponsors_public: SELECT for anon and authenticated (home page logos);
-- INSERT/UPDATE/DELETE for authenticated admins only (same pattern as user_carts).

alter table public.sponsors_public enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sponsors_public' and policyname = 'sponsors_public read anon and auth'
  ) then
    create policy "sponsors_public read anon and auth"
      on public.sponsors_public
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sponsors_public' and policyname = 'admins full access sponsors_public'
  ) then
    create policy "admins full access sponsors_public"
      on public.sponsors_public
      for all
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;
