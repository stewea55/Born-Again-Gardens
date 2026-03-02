-- Sponsors layout canvas support
-- Adds per-sponsor layout fields and a configurable canvas size table.

alter table public.sponsors_public
  add column if not exists display_order integer,
  add column if not exists layout jsonb;

create table if not exists public.sponsors_section_config (
  id text primary key default 'default',
  canvas_width integer not null default 1000 check (canvas_width > 0),
  canvas_height integer not null default 500 check (canvas_height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.sponsors_section_config (id, canvas_width, canvas_height)
values ('default', 1000, 500)
on conflict (id) do nothing;

alter table public.sponsors_section_config enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'sponsors_section_config' and policyname = 'sponsors_section_config read anon and auth'
  ) then
    create policy "sponsors_section_config read anon and auth"
      on public.sponsors_section_config
      for select
      to anon, authenticated
      using (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'sponsors_section_config' and policyname = 'admins full access sponsors_section_config'
  ) then
    create policy "admins full access sponsors_section_config"
      on public.sponsors_section_config
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;
