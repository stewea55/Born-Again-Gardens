-- 2026-03-09
-- Define is_admin() so RLS policies that use it do not hit "stack depth limit exceeded".
-- Safe, non-recursive: single SELECT from profiles for auth.uid(); no access to other tables.
-- SECURITY DEFINER so it runs with definer rights and is not blocked by RLS on profiles.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

comment on function public.is_admin() is 'Returns true when the current user has role=admin in profiles. Used by RLS policies.';
