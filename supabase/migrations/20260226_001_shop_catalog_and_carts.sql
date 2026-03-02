-- 2026-02-26
-- Backbone-first schema updates for /shop and authenticated server-side carts.

alter table if exists public.shop_catalog
  add column if not exists product_name text,
  add column if not exists description text,
  add column if not exists details text,
  add column if not exists size_options jsonb default '[]'::jsonb;

create table if not exists public.user_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cart_type text not null check (cart_type in ('shop', 'harvest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cart_type)
);

create table if not exists public.user_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.user_carts(id) on delete cascade,
  item_type text not null check (item_type in ('shop', 'plant')),
  item_id bigint not null,
  quantity numeric not null check (quantity > 0),
  size text null,
  unit_price numeric null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_cart_items_unique_item
  on public.user_cart_items (cart_id, item_type, item_id, coalesce(size, ''));

alter table public.user_carts enable row level security;
alter table public.user_cart_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_carts' and policyname = 'users manage own carts'
  ) then
    create policy "users manage own carts"
      on public.user_carts
      for all
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_carts' and policyname = 'admins full access user_carts'
  ) then
    create policy "admins full access user_carts"
      on public.user_carts
      for all
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_cart_items' and policyname = 'users manage own cart items'
  ) then
    create policy "users manage own cart items"
      on public.user_cart_items
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.user_carts carts
          where carts.id = user_cart_items.cart_id
            and carts.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.user_carts carts
          where carts.id = user_cart_items.cart_id
            and carts.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_cart_items' and policyname = 'admins full access user_cart_items'
  ) then
    create policy "admins full access user_cart_items"
      on public.user_cart_items
      for all
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;
