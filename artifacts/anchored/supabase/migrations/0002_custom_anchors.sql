-- Custom anchor fields: emoji and color.
-- Run this in the Supabase SQL Editor BEFORE creating custom anchors.
-- Safe to run multiple times (IF NOT EXISTS / IF column does not exist guards).

ALTER TABLE public.anchors
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS color text;
