# Supabase Auth URL Configuration (runbook)

Supabase emails (signup confirmation, password reset) and OAuth use the
project's **Site URL** as the default/fallback base, and only honor an explicit
`redirectTo` if that URL is in the **Redirect URLs allow-list**. The web app
already builds a correct `redirectTo` from `window.location.origin`
(`src/lib/auth-context.tsx` → `redirectUrl()`), but if the allow-list does not
include the web domain, Supabase falls back to Site URL.

A Site URL left at `http://localhost:3000` silently breaks links for real web
users. This file is the source of truth for what those settings must be.

- **Project ref:** `zpjxbhbpnflynwhvsnmu`
- **Web app base path:** `/` (so links are `${origin}/` and `${origin}/reset-password`)

## Effective configuration (current)

> Dev domain is in use because the web app is not yet published. After deploying,
> swap `site_url` to the live domain and add it to `uri_allow_list` (see Task #15).

- **site_url:** `https://2643c90a-66cb-4a08-b3db-355bcd99606f-00-1ycrlcfnapqtd.worf.replit.dev`
- **uri_allow_list:**
  - `mobile://`
  - `mobile://*`
  - `https://2643c90a-66cb-4a08-b3db-355bcd99606f-00-1ycrlcfnapqtd.worf.replit.dev/**`

## How to apply

Either in the Supabase dashboard (Authentication → URL Configuration) or via the
Management API. The Management API needs an **account-level** access token
(`sbp_…`) — the project's `service_role` / `SUPABASE_SERVICE_ROLE_KEY` does NOT
work for it. Always preserve the mobile entries when patching.

```bash
# Requires SUPABASE_ACCESS_TOKEN (account-level sbp_ token; do not commit it)
REF=zpjxbhbpnflynwhvsnmu
DOMAIN=https://2643c90a-66cb-4a08-b3db-355bcd99606f-00-1ycrlcfnapqtd.worf.replit.dev

# Inspect current values
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/$REF/config/auth" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["site_url"]);print(d["uri_allow_list"])'

# Apply Site URL + allow-list (preserves mobile redirects)
curl -s -X PATCH -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/$REF/config/auth" \
  -d "{\"site_url\":\"$DOMAIN\",\"uri_allow_list\":\"mobile://,mobile://*,$DOMAIN/**\"}"
```

## Verification

1. Re-run the inspect command above; confirm `site_url` and `uri_allow_list`
   match the effective configuration.
2. From the running web app, use "Forgot password?" to trigger a reset email and
   confirm the link opens the web app's `/reset-password` screen (requires a real
   inbox; do this once after any domain change).
