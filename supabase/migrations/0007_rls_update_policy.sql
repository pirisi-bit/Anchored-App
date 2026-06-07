-- Migration 0007: ensure UPDATE RLS policy exists on anchors and proofs.
-- Run this in the Supabase SQL Editor.
-- Without an UPDATE policy Supabase silently rejects all UPDATE calls
-- from the browser client, even when SELECT works fine.

DO $$
BEGIN
  -- anchors: update own rows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'anchors'
      AND policyname = 'Users can update their own anchors'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update their own anchors"
        ON public.anchors
        FOR UPDATE
        USING  (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;

  -- proofs: update own rows (needed for future proof edits)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'proofs'
      AND policyname = 'Users can update their own proofs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update their own proofs"
        ON public.proofs
        FOR UPDATE
        USING  (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;
END $$;
