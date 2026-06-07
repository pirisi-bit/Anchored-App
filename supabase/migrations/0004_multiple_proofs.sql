-- Allow multiple proofs per anchor per day.
--
-- The original schema had a UNIQUE constraint on (user_id, anchor_id, date_key)
-- that limited users to one proof per anchor per calendar day. This drops it so
-- each verification creates its own row — "Log another check" can add a second
-- (or third) same-day entry without conflict.
--
-- Run this in the Supabase SQL Editor before using the "Log another check" feature.

ALTER TABLE proofs
  DROP CONSTRAINT IF EXISTS proofs_user_id_anchor_id_date_key_key;

-- Also drop the legacy name that some projects use.
ALTER TABLE proofs
  DROP CONSTRAINT IF EXISTS unique_user_anchor_date;
