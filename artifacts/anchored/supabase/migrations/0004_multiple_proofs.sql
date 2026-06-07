-- Anchored: allow MULTIPLE proofs per anchor per day ("log another check").
-- Run this in the Supabase SQL Editor (or via `psql` against the Supabase Postgres
-- connection string).
--
-- Previously a unique (user_id, anchor_id, date_key) constraint enforced exactly
-- one proof per anchor per day and saving used upsert. We now let users verify the
-- same anchor several times in a day (e.g. checking the iron was unplugged twice),
-- so each verification is its own time-stamped row.

-- The constraint is named automatically by Postgres as
-- "proofs_user_id_anchor_id_date_key_key"; drop it if present.
alter table public.proofs
  drop constraint if exists proofs_user_id_anchor_id_date_key_key;

-- Helpful for looking up a given anchor's checks within a day.
create index if not exists proofs_anchor_id_date_key_idx
  on public.proofs (user_id, anchor_id, date_key);
