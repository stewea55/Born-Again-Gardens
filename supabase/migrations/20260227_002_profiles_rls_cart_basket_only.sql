-- Option B: Users can update only their own profile row, and only cart and basket columns (role stays protected).
-- See Supabase: https://supabase.com/docs/guides/database/postgres/column-level-security

create policy "update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update on table public.profiles from authenticated;
grant update (cart, basket) on table public.profiles to authenticated;
