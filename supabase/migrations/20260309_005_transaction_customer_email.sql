-- Add customer_email column to transaction table
-- Stores the email of the customer (guest or logged-in) at the time of checkout.

ALTER TABLE transaction ADD COLUMN IF NOT EXISTS customer_email TEXT;
