# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/anchored` — the Anchored web app (React + Vite + wouter).
  - `src/lib/supabase-client.ts` — browser Supabase client (reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`).
  - `src/lib/auth-context.tsx` — `AuthProvider` / `useAuth` (email + Google auth, session).
  - `src/lib/anchors-context.tsx` — `AnchorsProvider` / `useAnchors` (async, user-scoped anchors & proofs).
  - `src/lib/storage.ts` — Supabase data access for `anchors` / `proofs` (camelCase ↔ snake_case mapping).
  - `src/pages/login.tsx` — auth screen (incl. "Forgot password?"); route protection lives in `src/App.tsx`.
  - `src/pages/reset-password.tsx` — set-new-password screen reached from the recovery email link; waits for the `PASSWORD_RECOVERY` session before showing the form.
  - `supabase/migrations/0001_init.sql` — source-of-truth DB schema + RLS (applied manually in the Supabase dashboard).
- `artifacts/api-server` — handles receipt/photo file uploads (`POST /api/receipts/upload`).
- `artifacts/mobile` — the Anchored native Expo app (mirrors the web design, same Supabase backend).
  - `lib/notifications.ts` — expo-notifications handler + daily-reminder scheduling helpers (web-guarded; native only).
  - `lib/reminders-context.tsx` — `RemindersProvider` / `useReminders` (persisted enable + time in AsyncStorage, permission request, reschedules the daily local reminder with today's unverified count).
  - Reminder UI lives in `app/(tabs)/settings.tsx` (toggle + time picker).

## Architecture decisions

- Auth + per-user data use **Supabase** (Auth + Postgres). The browser talks to Supabase directly with the publishable/anon key; **Row-Level Security** (`user_id = auth.uid()`) is what isolates each user's data.
- The publishable key (`sb_publishable_…`) is browser-safe and stored as the `VITE_SUPABASE_ANON_KEY` env var (embedded in the client bundle by design). The service-role key must never reach the frontend.
- Supabase tables/RLS are **not** managed by the repl's Postgres tooling — `DATABASE_URL`/Helium is a different database. Schema changes are applied in the Supabase SQL Editor via `supabase/migrations/`.
- One proof per anchor per day is enforced by a `unique (user_id, anchor_id, date_key)` constraint; saving a proof uses `upsert` on that key.
- File uploads (receipts/photos) stay on the existing API server; only the resulting URL is stored on the proof row.

## Product

Anchored lets users build trustworthy daily proof that important routines were done (home safety, medication, bills, personal care, pet care). Users sign up (email/password or Google), pick anchors to track, and verify each one daily via self-confirm, photo, or receipt. Proofs form a timeline. All data is private per user.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
