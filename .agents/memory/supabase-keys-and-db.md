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
The DoneMark web (Vite) and mobile (Expo) artifacts talk to the **same** Supabase
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

## Auth email links depend on Site URL + Redirect allow-list (not code)
Supabase emails (signup confirmation, password reset) and OAuth use the project's
**Site URL** as the default/fallback base, and only honor an explicit `redirectTo`
if that URL matches the **Redirect URLs allow-list**. The app passing a correct
`redirectTo` (web uses `window.location.origin`) is NOT enough — if the allow-list
doesn't include the web domain, Supabase falls back to Site URL. A Site URL left at
`http://localhost:3000` silently breaks links for real web users.

**How to apply:** change these in Authentication → URL Configuration, or via the
Management API `PATCH https://api.supabase.com/v1/projects/<ref>/config/auth` with
`{ site_url, uri_allow_list }` (comma-separated string; wildcards like
`https://<domain>/**` work). Needs an **account-level** access token (`sbp_…`) —
the project's `service_role` / `SUPABASE_SERVICE_ROLE_KEY` does NOT work for the
Management API. Preserve existing entries (e.g. `mobile://,mobile://*`) when patching.
After deploying the web app, update Site URL from the dev domain to the published one.
