-- Migration 0006: add reminder column to anchors table
-- Run this in the Supabase SQL Editor.
-- The reminder column stores per-anchor notification settings as JSONB:
--   { enabled: boolean, days: number[], hour: number, minute: number }
-- It is nullable — NULL means no reminder configured.

ALTER TABLE public.anchors
  ADD COLUMN IF NOT EXISTS reminder jsonb DEFAULT NULL;
