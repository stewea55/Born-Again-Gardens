-- 2026-03-02
-- RLS on storage.objects for bucket admin-assets:
-- SELECT for anon and authenticated (public read so site can display images);
-- INSERT/UPDATE/DELETE for authenticated admins only (same pattern as sponsors_public, user_carts).
-- Bucket admin-assets must exist (create in Supabase Dashboard: Storage → New bucket → name: admin-assets, public: yes).

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'admin-assets read anon and auth'
  ) then
    create policy "admin-assets read anon and auth"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'admin-assets');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'admins full access admin-assets'
  ) then
    create policy "admins full access admin-assets"
      on storage.objects
      for all
      to authenticated
      using (bucket_id = 'admin-assets' and is_admin())
      with check (bucket_id = 'admin-assets' and is_admin());
  end if;
end $$;
