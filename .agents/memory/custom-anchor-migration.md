---
name: Custom anchor DB migration
description: The emoji and color columns on the anchors table must be applied in Supabase before custom anchors will save correctly.
---

Custom anchors (CreateAnchorSheet) write `emoji` and `color` fields to the `anchors` table. These columns are NOT in the original schema (0001_init.sql).

**Migration file:** `artifacts/anchored/supabase/migrations/0002_custom_anchors.sql`

**Why:** The client uses `...(a.emoji ? { emoji: a.emoji } : {})` spread so the field is omitted from the payload when absent — safe before migration — but custom anchors always set emoji+color, so the migration must be run before they're used.

**How to apply:** User runs `0002_custom_anchors.sql` in the Supabase SQL Editor (Dashboard → SQL Editor → paste → Run). Safe to re-run (uses `ADD COLUMN IF NOT EXISTS`).
