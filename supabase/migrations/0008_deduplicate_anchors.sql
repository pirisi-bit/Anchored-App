-- Migration 0008: find and remove duplicate anchors.
-- Run the SELECT first to review duplicates, then run the DELETE.
-- "Duplicate" = same (name, category) for the same user; keeps the oldest row.

-- Step 1: preview duplicates
SELECT name, category, count(*) AS copies, array_agg(id ORDER BY created_at) AS ids
FROM public.anchors
GROUP BY user_id, name, category
HAVING count(*) > 1;

-- Step 2: delete the newer copies (uncomment after reviewing step 1)
-- DELETE FROM public.anchors
-- WHERE id IN (
--   SELECT unnest(ids[2:])
--   FROM (
--     SELECT array_agg(id ORDER BY created_at) AS ids
--     FROM public.anchors
--     GROUP BY user_id, name, category
--     HAVING count(*) > 1
--   ) dups
-- );
