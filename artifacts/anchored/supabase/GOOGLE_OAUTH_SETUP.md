# Google Sign-In (OAuth) Setup & Recovery (runbook)

"Sign in with Google" works by connecting **Google Cloud** (which issues a
**Client ID** + **Client Secret**) to **Supabase Auth** (which stores them and
handles the login). The app code itself holds **no** Google credentials — both
the web app (`src/lib/auth-context.tsx`) and the mobile app
(`artifacts/mobile/lib/auth-context.tsx`) just call Supabase's
`signInWithOAuth({ provider: "google" })`. So all setup happens in two
dashboards, never in code.

- **Supabase project ref:** `zpjxbhbpnflynwhvsnmu`
- **Supabase callback URL (memorize this):**
  `https://zpjxbhbpnflynwhvsnmu.supabase.co/auth/v1/callback`

---

## Symptom this fixes

Google shows **"Access blocked: Authorization Error — The OAuth client was
deleted. Error 401: deleted_client"** (or `invalid_client`).

**Meaning:** the Google OAuth client that Supabase points at no longer exists in
Google Cloud (it was deleted, or its Google Cloud project was deleted). The fix
is to create a new client and paste it into Supabase. This is **configuration,
not a code bug** — nothing in this repo needs to change.

> Meanwhile, **email + password sign-in keeps working** and needs none of this.

---

## Part A — Create the OAuth client in Google Cloud

Do this at a computer, signed into the Google account that should own the app.

1. Go to **https://console.cloud.google.com/**.
2. Top bar → project picker → **New Project** (e.g. name it `Anchored`), then
   select it. (Or reuse an existing project you control.)
3. Left menu → **APIs & Services → OAuth consent screen**:
   - User type **External** → Create.
   - Fill **App name** (`Anchored`), **User support email**, and a **Developer
     contact email**. Save and continue through the steps.
   - While the app is in **Testing**, only **test users** you list can sign in.
     Either add your Google address under **Test users**, or **Publish app** to
     allow anyone. (Publishing a basic email/profile-scope app needs no Google
     verification review.)
4. Left menu → **APIs & Services → Credentials → Create Credentials → OAuth
   client ID**:
   - **Application type:** **Web application**.
   - **Name:** anything, e.g. `Anchored Supabase`.
   - **Authorized redirect URIs → Add URI:**
     `https://zpjxbhbpnflynwhvsnmu.supabase.co/auth/v1/callback`
     (exact, no trailing slash — this is the single most common mistake.)
   - Click **Create**.
5. Copy the **Client ID** and **Client Secret** shown in the dialog. Keep them
   private (do **not** paste them into the codebase or commit them anywhere).

> You do **not** add `mobile://` here. Mobile sign-in still routes through the
> Supabase callback above and back into the app — Google only needs the Supabase
> callback URL.

---

## Part B — Connect it to Supabase

1. Go to **https://supabase.com/dashboard** → your project
   (`zpjxbhbpnflynwhvsnmu`).
2. **Authentication → Sign In / Providers → Google**.
3. Toggle **Enable Sign in with Google** ON.
4. Paste the **Client ID** and **Client Secret** from Part A.
5. **Save.**

That's it. No redeploy or code change is required — the next Google sign-in
attempt uses the new client immediately.

---

## Part C — Verify

1. **Web:** open the running web app → Login → **Continue with Google**. It
   should bounce to Google, let you pick the account, and return you signed in.
2. **Mobile:** open the Expo app → Login → **Continue with Google**. The in-app
   browser should complete and return to the app authenticated (the app handles
   the PKCE `exchangeCodeForSession` step automatically).
3. If it still fails, see Troubleshooting.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `deleted_client` / `invalid_client` | Supabase points at a client that doesn't exist | Redo Part A + B with a brand-new client. |
| `redirect_uri_mismatch` | Redirect URI in Google ≠ Supabase callback | In Google Cloud → Credentials → your client, ensure the **only** authorized redirect URI is `https://zpjxbhbpnflynwhvsnmu.supabase.co/auth/v1/callback` (exact). |
| `access_denied` / "app is being tested" | Consent screen in Testing and your email isn't a test user | Add your email under **OAuth consent screen → Test users**, or **Publish app**. |
| Web returns to login, no session | App redirect domain not allow-listed in Supabase | See `AUTH_URL_CONFIG.md` (Site URL + Redirect URLs allow-list). |
| Works on web, not mobile | App scheme not allow-listed | Ensure `mobile://` and `mobile://*` remain in the Supabase **Redirect URLs** allow-list (see `AUTH_URL_CONFIG.md`). |

## Notes

- Treat the Client Secret like a password. If it ever leaks, delete that client
  in Google Cloud and create a new one, then update Supabase (Part B).
- Keep the Google Cloud **project** around — deleting the project deletes the
  client and reproduces the `deleted_client` error.
- Related runbook: `AUTH_URL_CONFIG.md` (Site URL + redirect allow-list, which
  governs where users land *after* Google returns them).
