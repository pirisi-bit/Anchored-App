-- Per-anchor reminder settings stored as JSON.
-- Run this in the Supabase SQL Editor. Safe to re-run.

ALTER TABLE public.anchors
  ADD COLUMN IF NOT EXISTS reminder jsonb;
