-- Add user_name and guest_name columns to transaction table
-- user_name stores the full name of a logged-in (Google) user at checkout.
-- guest_name stores the full name of a guest user at checkout.
-- Only one will be set per row; the other will be null.

ALTER TABLE transaction ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE transaction ADD COLUMN IF NOT EXISTS guest_name TEXT;
