-- Add cart and basket (jsonb) to profiles for logged-in user cart/basket storage.
-- See Supabase docs: https://supabase.com/docs/guides/database/json
-- We only allow updating these columns from the app (never role); use RLS + optional column privileges.

alter table public.profiles
  add column if not exists cart jsonb not null default '[]'::jsonb,
  add column if not exists basket jsonb not null default '[]'::jsonb;

comment on column public.profiles.cart is 'Shop cart items (jsonb array). Updated only by cart API.';
comment on column public.profiles.basket is 'Harvest basket items (jsonb array). Updated only by cart API.';
