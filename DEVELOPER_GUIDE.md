# Anchored — Developer Handover Guide

This document is written for a human developer taking over the **Anchored**
codebase. It explains what the app does, how it is built, **why** each major
decision was made, where every important piece of code lives, and how to debug
the things most likely to break.

Read it top-to-bottom once, then use it as a map. For a shorter project README
see `replit.md`; for cross-session "gotchas" the previous agents recorded, see
`.agents/memory/`.

---

## 1. What Anchored is

Anchored helps anxious / conscientious people build **trustworthy daily proof**
that important routines were done — locking up, taking medication, paying bills,
personal care, pet care. The emotional promise is *peace of mind / "everything's
under control"*, not "remember more".

Core loop:
1. User signs up (email+password or Google).
2. User picks **anchors** (routines) to track, grouped by category.
3. Each day they **verify** each anchor via self-confirm, a **photo**, or a
   **receipt** (PDF/image).
4. Verifications become **proofs** that stack into a private timeline.
5. All data is **private per user** (enforced by Postgres Row-Level Security).

There are **two front-end apps that share one backend**:
- **Web** — `artifacts/anchored` (React + Vite + wouter).
- **Mobile** — `artifacts/mobile` (Expo / React Native + expo-router).

---

## 2. High-level architecture

```
            ┌─────────────────────┐     ┌─────────────────────┐
            │  Web app (Vite)     │     │  Mobile app (Expo)  │
            │  artifacts/anchored │     │  artifacts/mobile   │
            └─────────┬───────────┘     └──────────┬──────────┘
                      │  (same Supabase project, same RLS)       
        Auth + data   │                            │  Auth + data
        (browser SDK) │                            │  (RN SDK)
                      ▼                            ▼
            ┌───────────────────────────────────────────────┐
            │  SUPABASE  (Auth + Postgres + Storage)         │
            │  project ref: zpjxbhbpnflynwhvsnmu             │
            │  tables: anchors, proofs  (RLS: user_id=uid)   │
            │  storage bucket: receipts                      │
            └───────────────────────────────────────────────┘
                      ▲
        file uploads  │  (multipart POST /api/receipts/upload)
                      │
            ┌─────────┴───────────┐
            │  API server (Express)│  artifacts/api-server
            │  uploads files to    │  (uses Supabase service role key)
            │  the receipts bucket │
            └──────────────────────┘
```

Key idea: **the browser/mobile talk to Supabase directly** for auth and for
reading/writing `anchors` and `proofs`. The only thing the API server does today
is accept a file upload and push it into Supabase Storage, returning a public
URL that then gets written onto the proof row.

> ⚠️ **Two different Postgres databases — do not confuse them.**
> - **Supabase Postgres** (`*.supabase.co`) holds the real app data (`anchors`,
>   `proofs`) and auth users. Schema + RLS live in
>   `artifacts/anchored/supabase/migrations/` and are applied **manually in the
>   Supabase dashboard SQL editor**.
> - **Replit "Helium" Postgres** (`DATABASE_URL`, managed by `lib/db` +
>   drizzle) is a *separate, currently essentially-unused* database. Its Drizzle
>   schema (`lib/db/src/schema/index.ts`) is empty template. Running
>   `pnpm --filter @workspace/db run push` touches **Helium, not Supabase**.

---

## 3. Repository layout (pnpm monorepo)

```
artifacts/
  anchored/        Web app (React + Vite + wouter)         → served at "/"
  mobile/          Mobile app (Expo / expo-router)
  api-server/      Express API (file uploads)              → served at "/api"
  mockup-sandbox/  Design/preview sandbox (dev tooling only, not shipped)
lib/
  db/              Drizzle + Helium Postgres (currently unused for app data)
  api-spec/        OpenAPI 3.1 spec (only /healthz today) + Orval codegen config
  api-zod/         GENERATED Zod schemas from the spec
  api-client-react/GENERATED React Query hooks from the spec
scripts/           Shared utility scripts (@workspace/scripts)
pnpm-workspace.yaml, tsconfig.base.json, tsconfig.json, package.json
replit.md          Short project README + user preferences + gotchas
.agents/memory/    Cross-session agent notes (durable lessons)
```

Conventions (enforced by the `pnpm-workspace` skill):
- Workspace packages are named `@workspace/<name>`.
- `lib/*` packages are **composite** TS libs (emit declarations,
  `tsc --build`). `artifacts/*` are **leaf** packages (`tsc --noEmit`) and must
  **not** import each other — share code via a `lib/*` package instead.
- The shared reverse proxy routes by path: web at `/`, api at `/api`, matched
  most-specific-first. Services must handle their own full base path.
- For ad-hoc requests always go through the proxy at `localhost:80` (e.g.
  `curl localhost:80/api/healthz`), never the service port directly. The Expo
  app is the exception — reach it via `$REPLIT_EXPO_DEV_DOMAIN`.

---

## 4. Environment variables & secrets

Set/edit these through Replit's secrets tooling — never hard-code them.

| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | web | Supabase project URL (build-time, baked into bundle). |
| `VITE_SUPABASE_ANON_KEY` | web | **Publishable/anon key — browser-safe by design.** Not a true secret; RLS protects data, not key secrecy. |
| `EXPO_PUBLIC_SUPABASE_URL` | mobile | Same Supabase project as web. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile | Same publishable key, Expo prefix. |
| `SUPABASE_URL` | api-server | Server-side Supabase URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | api-server | **TRUE SECRET.** Bypasses RLS; must never reach any front-end. Used only to upload to the `receipts` storage bucket. |
| `DATABASE_URL` | lib/db | Replit Helium Postgres (NOT Supabase). |
| `SESSION_SECRET` | (reserved) | Present in env; not central to current flows. |
| `PORT`, `BASE_PATH` | all artifacts | Injected by the Replit workflow; do not hard-code. The most common "blank preview" bug is a hard-coded port instead of reading `PORT`. |

**Why the anon key is not treated as secret:** any `VITE_`/`EXPO_PUBLIC_` value
ends up in the shipped client bundle regardless. Security comes from Row-Level
Security (`user_id = auth.uid()`), not from hiding the publishable key. See
`.agents/memory/supabase-keys-and-db.md`.

---

## 5. Data model & Supabase

Source of truth: `artifacts/anchored/supabase/migrations/0001_init.sql`
(applied by hand in the Supabase SQL editor — there is no automated migration
runner for Supabase here).

### `public.anchors`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users`; RLS key |
| `name` | text | routine name |
| `category` | text | e.g. Home Safety, Medication |
| `verification_method` | text | self / photo / receipt |
| `active` | bool | toggled from the Anchors screen |
| `created_at` | timestamptz | |

### `public.proofs`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users`; RLS key |
| `anchor_id` | uuid | FK → `anchors` |
| `date_key` | text | `YYYY-MM-DD` **local** day bucket |
| `status` | text | verified, etc. |
| `verification_method` | text | how it was proven |
| `photo_url` / `receipt_url` / `voice_url` | text | public URL from the upload API |
| `created_at` | timestamptz | |

- **Unique constraint:** `(user_id, anchor_id, date_key)` → **one proof per
  anchor per day**. Saving uses `upsert` on that key, so re-verifying the same
  anchor the same day overwrites rather than duplicating.
- **RLS:** every table has `select/insert/update/delete` policies of the form
  `auth.uid() = user_id`. This is the *entire* data-isolation mechanism — there
  is no server-side authorization layer in front of the data.

**Why `date_key` is text local-time:** days are bucketed by the user's local
calendar date so "did I do it today?" matches the user's perception. If you ever
move proof logic server-side, preserve the local-date semantics or proofs will
appear to land on the wrong day across timezones.

---

## 6. Authentication

Both apps use **Supabase Auth** (email/password + Google OAuth). The clients
hold the session; RLS isolates data. There is no custom session server.

### Web (`artifacts/anchored/src/lib/auth-context.tsx`)
- `AuthProvider` / `useAuth` expose sign-in, sign-up, Google OAuth,
  `resetPassword`, sign-out, and the live `session`/`user`.
- `redirectUrl(path)` = `` `${window.location.origin}${import.meta.env.BASE_URL}${path}` ``.
  This is **dynamic** — it always matches whatever domain the app is served on.
- Sign-up email confirmation uses `emailRedirectTo: redirectUrl()`.
- Password reset uses `redirectTo: redirectUrl("reset-password")` →
  `src/pages/reset-password.tsx`, which waits for the `PASSWORD_RECOVERY`
  session event before showing the new-password form.
- Route protection lives in `src/App.tsx` via `<ProtectedRoute>`. Public routes:
  `/`, `/login`, `/reset-password`, `/privacy`, `/support`.

### Mobile (`artifacts/mobile/lib/auth-context.tsx`)
Differs because native has no `window.location`:
- Redirect URL comes from `Linking.createURL("/")` → resolves to the
  `mobile://` scheme in an installed build.
- Google OAuth opens `WebBrowser.openAuthSessionAsync`, then the code is pulled
  from the callback URL and exchanged with
  `supabase.auth.exchangeCodeForSession(code)` (PKCE).
- `lib/supabase.ts` is configured for native: persistent session in
  `AsyncStorage`, `detectSessionInUrl: false` (session is exchanged manually),
  and `AppState` listeners drive `startAutoRefresh`/`stopAutoRefresh`.

### ⚠️ Supabase URL configuration (the bug that bit us — read this)
Supabase emails (signup confirmation, password reset) and OAuth use the
project's **Site URL** as the default/fallback base, and only honor an explicit
`redirectTo` if that URL is in the **Redirect URLs allow-list**. The app sending
a correct `redirectTo` is **not enough** — if the allow-list doesn't include the
web domain, Supabase silently falls back to Site URL.

- This was originally set to `http://localhost:3000`, which broke web email
  links for real users.
- Current values (and a repeatable apply/verify runbook) are documented in
  `artifacts/anchored/supabase/AUTH_URL_CONFIG.md`.
- These are **project config, not code** — change them in Supabase dashboard
  (Authentication → URL Configuration) or via the Management API
  `PATCH /v1/projects/{ref}/config/auth` (`site_url`, `uri_allow_list`). Needs an
  **account-level** `sbp_…` token; the `service_role` key does **not** work for
  the Management API. Always preserve `mobile://,mobile://*` when patching.
- **After deploying the web app to a real domain, update Site URL from the dev
  domain to the published one** (this is the outstanding Task #15).

---

## 7. Web app deep dive (`artifacts/anchored`)

Stack: React + Vite + **wouter** (routing) + Tailwind v4 (`@theme inline` in
`src/index.css`) + Radix UI primitives + `lucide-react` + `vaul` drawers.

```
src/
  App.tsx            Providers + wouter routes + ProtectedRoute
  main.tsx           Entry
  index.css          Tailwind v4 theme (brand colors as CSS vars)
  lib/
    supabase-client.ts   Browser Supabase client (VITE_ env)
    auth-context.tsx     Auth (see §6)
    anchors-context.tsx  AnchorsProvider/useAnchors: anchors+proofs state,
                         selfConfirm / addPhotoProof / addReceiptProof, refresh()
    storage.ts           Supabase reads/writes; snake_case↔camelCase mapping;
                         upsertProof on (user_id,anchor_id,date_key); todayKey
    contact.ts           SUPPORT_EMAIL (currently support@anchored.app — TODO)
    utils.ts             cn() etc.
  components/
    AnchorCard, BottomNav, CategoryAccordion, PhotoSheet, ReceiptSheet,
    ProofCard, StatusBadge, ui/*  (Radix-based design system)
  pages/
    home.tsx           Public landing ("Everything's Under Control.")
    login.tsx          Email/Google + "Forgot password?"
    reset-password.tsx Set-new-password (waits for PASSWORD_RECOVERY)
    onboarding.tsx     Pick anchors from category templates
    dashboard.tsx      Today's progress + verify cards
    anchors.tsx        Enable/disable anchors
    proof.tsx          Timeline of proofs
    proof-review.tsx   One proof (image/PDF preview, self-confirm warning)
    privacy.tsx / support.tsx  Public legal/support pages (store requirement)
```

Brand colors (CSS vars in `index.css`): `--primary #3B82F6`,
`--brand-sky #60B8FF`, `--brand-orange #FF8C42`, `--brand-yellow #FFD93D`,
warm mid-century palette, Inter typeface.

Data flow: pages read anchors/proofs from `useAnchors()`. Verifying calls
`selfConfirm` / `addPhotoProof` / `addReceiptProof`, which write to Supabase via
`storage.ts` and then `refresh()` to re-pull. Photo/receipt sheets upload the
file to the API first (see §10), then store the returned URL on the proof.

---

## 8. Mobile app deep dive (`artifacts/mobile`)

Stack: Expo SDK 54, expo-router (file-based), React Native, AsyncStorage.

```
app/
  _layout.tsx        Root providers: Auth → Anchors → Reminders
  login.tsx          Email + Google (mobile:// PKCE flow)
  onboarding.tsx     Pick anchors
  (tabs)/
    _layout.tsx      Tab bar
    index.tsx        Dashboard (Today): progress %, verify/self-confirm/capture
    anchors.tsx      Manage anchors by category
    proof.tsx        Timeline grouped by date
    settings.tsx     Profile, daily reminder toggle + time picker,
                     "Clear all data", sign out
  proof/[id].tsx     Proof review (metadata + media)
lib/
  supabase.ts        Native Supabase client (AsyncStorage, detectSessionInUrl:false)
  auth-context.tsx   Native auth (Linking, WebBrowser, exchangeCodeForSession)
  anchors-context.tsx  anchors+proofs state, remaining-today logic
  reminders-context.tsx RemindersProvider/useReminders (see §11)
  notifications.ts   expo-notifications wrapper (DAILY trigger)
  storage.ts         Types + AsyncStorage keys
  upload.ts          uploadProofFile → multipart POST /api/receipts/upload
components/
  AnchorCard, ProofCard, CaptureSheet (camera/library/PDF), ProgressBar,
  StatusBadge
constants/colors.ts  light/dark palette (warm mid-century)
hooks/useColors.ts   returns palette via useColorScheme() + global tokens
app.json             STATIC Expo config (scheme "mobile", bundle/package
                     com.anchored.mobile, camera/photo permission strings,
                     plugins incl. expo-notifications + expo-image-picker)
```

> ⚠️ **`app.json` is intentionally static.** Do **not** add `app.config.ts/js`.
> Do not change the bundle identifier / package name. See `replit.md` gotchas.

> ⚠️ **Native module versions must match the installed Expo SDK.** When adding a
> native package, read the compatible version from
> `node_modules/.pnpm/expo@*/node_modules/expo/bundledNativeModules.json` and
> install that exact range with `pnpm --filter @workspace/mobile add`. Do not run
> `npx expo install` / `npx expo start` here — the app runs via the Replit
> workflow. See `.agents/memory/expo-compatible-versions.md`.

> ⚠️ **`constants/colors.ts` shape:** the scaffold's generic `useColors` cast
> breaks if you add a non-palette top-level key (e.g. `radius`) at the wrong
> level — index `colors.light` / `colors.dark` directly. See
> `.agents/memory/expo-scaffold-usecolors.md`.

---

## 9. API server deep dive (`artifacts/api-server`)

Express 5, esbuild CJS bundle, pino logging.

```
src/
  index.ts          Reads PORT, starts the server
  app.ts            cors + json + urlencoded + pino-http; mounts router at /api
  lib/logger.ts     pino (+ pino-pretty in dev); redacts Authorization/Cookie
  routes/
    health.ts       GET /api/healthz
    receipts.ts     POST /api/receipts/upload
```

`POST /api/receipts/upload`:
- `multer.memoryStorage()`, 10 MB limit.
- Allowed mimetypes: PNG, JPG, WEBP, HEIC, PDF.
- Uploads to the Supabase **`receipts`** storage bucket using the
  **service-role key**, path `YYYY-MM-DD/UUID.ext`.
- Returns `{ publicUrl, contentType }` (via Supabase `getPublicUrl`).

**Logging rule:** never use `console.log` in server code — use `req.log` in
handlers and the singleton `logger` elsewhere (see `pnpm-workspace` skill).

### Contract-first codegen
`lib/api-spec/openapi.yaml` (OpenAPI 3.1) is the contract. Run
`pnpm --filter @workspace/api-spec run codegen` to regenerate Zod schemas
(`lib/api-zod`) and React Query hooks (`lib/api-client-react`). Today the spec
only covers `/healthz`; **the receipts upload endpoint is not yet in the spec**
(tech debt — see §15). Do not change the OpenAPI `info.title`; it controls
generated filenames.

---

## 10. File upload flow, end to end

1. User taps a photo/receipt verify action.
   - Web: `PhotoSheet.tsx` / `ReceiptSheet.tsx`.
   - Mobile: `CaptureSheet.tsx` → `expo-image-picker` (camera/library) or
     `expo-document-picker` (PDF).
2. Client builds `FormData` and POSTs to `/api/receipts/upload`
   (mobile uses `lib/upload.ts` → `uploadProofFile`).
3. API validates type/size, uploads to the Supabase `receipts` bucket with the
   service-role key, returns the public URL.
4. Client writes that URL onto the proof row (`photo_url` / `receipt_url`) via
   `addPhotoProof` / `addReceiptProof` (which `upsert`s the proof and refreshes).

> ⚠️ **Upload-then-link ordering bug class:** if the capture sheet is dismissed
> mid-upload, the file can upload but never get linked to a proof (orphaned
> file). Capture the target anchor id at the *start* of the flow, or block
> dismissal until the upload resolves. See `.agents/memory/upload-link-flows.md`.

---

## 11. Daily reminders (mobile only)

- `lib/notifications.ts`: sets the notification handler; web-guarded helpers
  `requestNotificationPermission`, `scheduleDailyReminder`,
  `cancelDailyReminder`, using a `DAILY` schedulable trigger and a fixed
  reminder identifier.
- `lib/reminders-context.tsx`: `RemindersProvider`/`useReminders`. Persists
  `enabled`/`hour`/`minute` to AsyncStorage (default 20:00), computes today's
  **unverified count** from `useAnchors`, builds the notification body
  ("N routines left to verify"), and reschedules when the time or count changes.
- UI: `app/(tabs)/settings.tsx` (toggle + `DateTimePicker`), with graceful
  alerts when permission is denied or on web (where it's unsupported).
- Wired in `app/_layout.tsx` inside `AnchorsProvider` (so it can read anchors).

Known limitation: the body reflects the unverified count *at schedule time* and
is refreshed on app activity, so it can be a day stale until the app is next
opened. A natural next step (already a project task) is to deep-link a tapped
reminder to today's dashboard.

---

## 12. Build, run, typecheck, deploy

Apps run via **Replit workflows**, not `pnpm dev` at the repo root (the root has
no `dev` script by design). Useful commands:

| Command | What |
|---|---|
| `pnpm run typecheck` | Canonical full typecheck (builds libs, then leaf checks). Trust this over editor/LSP. |
| `pnpm run typecheck:libs` | `tsc --build` the composite libs only. |
| `pnpm --filter @workspace/<slug> run typecheck` | Verify one artifact (preferred over `build`, which needs workflow env). |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks + Zod from the spec. |
| `pnpm --filter @workspace/db run push` | Push Drizzle schema to **Helium** (dev only; NOT Supabase). |

To run/verify an app, use the workflow (restart it) or the preview pane — don't
shell out to `pnpm dev`.

**Deploy:** the web + API publish together via Replit Publishing (Autoscale is
the right target for this app). Production deployment config lives in each
artifact's `.replit-artifact/artifact.toml` `[services.production]` (web is
`serve = "static"`, `publicDir = artifacts/anchored/dist/public`). Do not use
Netlify — static-only hosting would break the upload API.

---

## 13. Store publishing

- **iOS:** ships via Replit's **Expo Launch** (the Publish button) — **not EAS.**
  Do **not** create `eas.json` or run `eas …` commands; do not add
  `app.config.*`. "Store readiness" work means finalizing static `app.json`.
- **Android / Play Store:** **not currently supported** on Replit.
- Store listing content + generated marketing screenshots live in
  `artifacts/mobile/store/` (`store-listing.md`, `screenshots/`,
  `generate-screenshots.mjs`). Public Privacy/Support pages are hosted on the web
  app at `/privacy` and `/support`.
- **Before submission TODO:** `SUPPORT_EMAIL` (`support@anchored.app`) must
  become a real, monitored inbox — Apple requires deletion requests be honored
  there, and full account deletion is currently a support-email process.

---

## 14. Debugging playbooks

**Blank/!working web preview**
1. Is the workflow running? Restart it after code/package changes.
2. Console errors? Use the logs.
3. Dev server must allow all hosts (Vite `server.allowedHosts: true`) — the
   preview is a proxied iframe from a different origin.
4. Confirm the app reads `PORT` (a hard-coded port is the #1 cause).

**Web email links (confirm / reset) go nowhere**
→ It's Supabase URL config, not code. See §6 and
`artifacts/anchored/supabase/AUTH_URL_CONFIG.md`. Check Site URL + allow-list.

**Google sign-in fails**
→ If Google shows **"The OAuth client was deleted / Error 401: deleted_client"**
(or `invalid_client`), the Google Cloud OAuth client Supabase points at no longer
exists — recreate it and reconnect it to Supabase. Full step-by-step runbook:
`artifacts/anchored/supabase/GOOGLE_OAUTH_SETUP.md`.
→ Otherwise confirm the Google provider is **enabled** at the Supabase project
level and the redirect (`mobile://*` for mobile, the web domain for web) is
allow-listed. The provider being disabled returns "provider is not enabled" from
`/authorize`. Email/password sign-in works regardless of Google config.

**"column/relation does not exist" against Supabase**
→ The migration in `supabase/migrations/` wasn't applied in the Supabase
dashboard. Remember: `pnpm db push` targets Helium, not Supabase.

**A user sees another user's data / sees nothing**
→ RLS. Verify the policies (`auth.uid() = user_id`) exist and the client is
authenticated. With the anon key and no session, RLS correctly returns no rows.

**Upload succeeds but proof has no image**
→ Upload-then-link ordering (see §10). Check the sheet isn't dismissed before the
POST resolves and that the returned URL is written to the proof.

**Mobile crashes on a native module / redbox after adding a package**
→ Version mismatch with the Expo SDK. Re-pin from `bundledNativeModules.json`
(see §8) and restart the mobile workflow.

**Mobile preview**
→ Reach the Expo app via `$REPLIT_EXPO_DEV_DOMAIN`, not the shared proxy.

---

## 15. Known limitations & outstanding work

- **Site URL still points at the dev domain** — must be swapped to the published
  web domain after first deploy (Task #15). Until then, web email links only work
  while the workspace is running.
- **Support email is a placeholder** (`support@anchored.app`) on an unowned
  domain — must become a real monitored inbox before store submission.
- **Account deletion** in-app only clears anchors/proofs; full account deletion
  is a manual support-email process.
- **Receipts upload endpoint is not in the OpenAPI spec** — clients call it
  directly with hand-written fetch/FormData instead of generated hooks. Adding it
  to `lib/api-spec/openapi.yaml` would give typed Zod validation + hooks.
- **`lib/db` (Helium) is essentially unused** — all real data is in Supabase. If
  you don't plan to use Helium, consider removing it to avoid confusion.
- **Android publishing** is unsupported on Replit today.
- Some pre-existing type errors were noted in web `ui/calendar.tsx` and
  `ui/spinner.tsx` (unrelated scaffold components).

---

## 16. Where the "why" is recorded

- `replit.md` — short README, run commands, architecture decisions, gotchas,
  user preferences.
- `.agents/memory/` — durable cross-session lessons:
  - `supabase-keys-and-db.md` — keys, the two-database distinction, Site
    URL/allow-list rule.
  - `expo-compatible-versions.md` — pinning native module versions.
  - `expo-scaffold-usecolors.md` — the colors.ts cast gotcha.
  - `upload-link-flows.md` — the orphaned-upload bug class.
  - `mobile-publishing.md` — Expo Launch vs EAS.
- `artifacts/anchored/supabase/AUTH_URL_CONFIG.md` — the auth URL runbook.
- `artifacts/mobile/store/store-listing.md` — store listing content + TODOs.
