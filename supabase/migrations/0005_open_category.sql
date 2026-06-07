-- Allow custom/user-defined category names on anchors.
--
-- Run this in the Supabase SQL Editor if you see "Could not save" errors
-- when trying to save an anchor with a custom category.
--
-- Background: the original schema may have a CHECK constraint that only allows
-- the six predefined category values. This removes that constraint so any
-- text value is accepted.

ALTER TABLE anchors
  DROP CONSTRAINT IF EXISTS anchors_category_check;

-- Make sure the column is plain text (not an enum type).
ALTER TABLE anchors
  ALTER COLUMN category TYPE text USING category::text;
