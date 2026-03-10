-- 2026-03-09
-- Add customer_email to transaction for display in admin (guest or logged-in payer email).

alter table public."transaction"
  add column if not exists customer_email text null;
