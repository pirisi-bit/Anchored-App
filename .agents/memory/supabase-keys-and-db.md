---
name: Supabase keys & which Postgres is which
description: Browser-safe Supabase key handling and the fact that the repl's Postgres is NOT the Supabase DB
---

# Supabase in this project

## The browser key is publishable, not secret
Supabase's new-format key `sb_publishable_…` (and the legacy `anon` key) is the
**browser-safe** key. It is embedded into the client bundle by design, so it is
public — set it as a plain `VITE_…` env var via `setEnvVars`, do NOT treat it as a
true secret. Only `sb_secret_…` / `service_role` must stay server-side and out of
the frontend.

**Why:** any `VITE_`-prefixed value ends up in the shipped JS regardless, so
"requesting it as a secret" gives a false sense of protection and just blocks the
agent. RLS — not key secrecy — is what protects user data with the publishable key.

## Web and mobile share ONE Supabase project
The Anchored web (Vite) and mobile (Expo) artifacts talk to the **same** Supabase
project. The only difference is the env-var prefix the bundler exposes: web reads
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; mobile reads
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Same publishable key,
same RLS — so per-user data isolation carries across both clients with no extra work.

## The repl's Postgres ≠ the Supabase database
`DATABASE_URL` / `PGHOST` here point at Replit's **Helium** Postgres, not Supabase
(`*.supabase.co`). So the agent CANNOT apply Supabase table/RLS migrations through
the built-in DB tools.

**How to apply:** the user runs the SQL in the Supabase dashboard → SQL Editor (or
provides the Supabase DB connection string). To check whether a table exists, hit
`https://<ref>.supabase.co/rest/v1/<table>?select=id&limit=1` with the publishable
key as both `apikey` and `Bearer`: `404 PGRST205` = table missing, `200 []` = table
exists and RLS is active (anon sees no rows).
