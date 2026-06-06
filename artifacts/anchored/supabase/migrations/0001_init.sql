-- Anchored: per-user tables with Row-Level Security.
-- Run this in the Supabase SQL Editor (or via `psql` against the Supabase Postgres
-- connection string). RLS ensures each user can only read/write their own rows.

-- =========================
-- anchors
-- =========================
create table if not exists public.anchors (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  verification_method text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists anchors_user_id_idx on public.anchors (user_id);

alter table public.anchors enable row level security;

drop policy if exists "anchors_select_own" on public.anchors;
create policy "anchors_select_own" on public.anchors
  for select using (user_id = auth.uid());

drop policy if exists "anchors_insert_own" on public.anchors;
create policy "anchors_insert_own" on public.anchors
  for insert with check (user_id = auth.uid());

drop policy if exists "anchors_update_own" on public.anchors;
create policy "anchors_update_own" on public.anchors
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anchors_delete_own" on public.anchors;
create policy "anchors_delete_own" on public.anchors
  for delete using (user_id = auth.uid());

-- =========================
-- proofs
-- =========================
create table if not exists public.proofs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  anchor_id uuid not null references public.anchors (id) on delete cascade,
  date_key text not null,
  status text not null,
  verification_method text not null,
  photo_url text,
  receipt_url text,
  voice_url text,
  created_at timestamptz not null default now(),
  -- One proof per anchor per day per user (enables upsert on save).
  unique (user_id, anchor_id, date_key)
);

create index if not exists proofs_user_id_idx on public.proofs (user_id);
create index if not exists proofs_user_id_date_key_idx on public.proofs (user_id, date_key);

alter table public.proofs enable row level security;

drop policy if exists "proofs_select_own" on public.proofs;
create policy "proofs_select_own" on public.proofs
  for select using (user_id = auth.uid());

drop policy if exists "proofs_insert_own" on public.proofs;
create policy "proofs_insert_own" on public.proofs
  for insert with check (user_id = auth.uid());

drop policy if exists "proofs_update_own" on public.proofs;
create policy "proofs_update_own" on public.proofs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "proofs_delete_own" on public.proofs;
create policy "proofs_delete_own" on public.proofs
  for delete using (user_id = auth.uid());
