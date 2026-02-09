# Auth Debugging Reference

## Current Architecture
- Zitadel v4.10.0 as identity broker
- zitadel-login v4.10.0 (separate container on :8081)
- NextAuth with ZitadelProvider → Zitadel → Google/internal
- Caddy proxies port 80 `/idps/*` → Zitadel (for Google callback)

## OAuth Flow
```
User → NextAuth → Zitadel authorize (:8080) → Login V2 (:8081) → Google
Google → http://localhost/idps/callback (Caddy:80 → Zitadel:8080)
Zitadel → Login V2 success URL → complete-registration/auto-create
Login V2 → Zitadel callback → NextAuth callback → App
```

## Google Cloud Console
- Authorized redirect URI: `http://localhost/idps/callback`
- Old URI (no longer needed): `https://localhost/api/auth/callback/google`

## Issues Fixed
1. ✅ Google rejected redirect_uri → Added `http://localhost/idps/callback` to Google Console
2. ✅ Connection reset on port 80 → Added Caddy HTTP handler for `/idps/*`
3. ✅ zitadel-login:latest mismatch → Pinned to v4.10.0
4. ✅ Instance login policy → Confirmed `allowRegister: true` already set
5. ✅ Added `X-Zitadel-Public-Host` header to zitadel-login

## Current Blocker (2026-02-09)
**Error**: `Missing required parameters` in `complete-registration/page.js`
- Login V2 successfully retrieves IdP intent from Zitadel API
- But then fails rendering the complete-registration page
- Required params: `id`, `token`, `idpId`, `organization`, `idpUserId`
- One or more of these is missing from the URL search params

### What Did NOT Fix It
- Pinning zitadel-login to v4.10.0 (same version as Zitadel)
- Setting instance-level allowRegister: true (was already set)
- Adding X-Zitadel-Public-Host header
- Passing isAutoCreation/isCreationAllowed in POST to `/management/v1/idps/google` (silently ignored!)

### Root Causes Found
1. **Generic OIDC IdP (`/management/v1/idps/oidc`)** → Login V2 can't map Google claims properly → "Missing required parameters" in complete-registration page
2. **Google-native IdP (`/management/v1/idps/google`)** → POST silently ignores `isAutoCreation`, `isCreationAllowed`, etc. → "creation not allowed"
3. **Fix**: After creating Google IdP, must do a separate PUT to `/management/v1/idps/google/{id}` with `providerOptions` to set auto-creation flags

### Critical API Quirks
- `/management/v1/idps/google` (POST) - Creates IdP but IGNORES isAutoCreation flags!
- `/management/v1/idps/google/{id}` (PUT) - Sets providerOptions correctly
- `/management/v1/idps/templates/{id}` (GET) - Read new-style IdP details (NOT `/management/v1/idps/{id}`)
- `/management/v1/idps/_search` (POST) - Only finds OLD-style IdPs (oidc/saml), not google/github templates
- v2 API (`/v2/idps/*`) - Does NOT exist in Zitadel v4.10.0

## Key Config Files
- `infra/docker-compose.yml` - Zitadel + Login V2 containers
- `infra/setup-zitadel.sh` - Automated Zitadel configuration
- `infra/zitadel-config.yaml` - NOT mounted in docker-compose (only env vars used)
- `web/app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `web/.env.local` - ZITADEL_ISSUER, ZITADEL_CLIENT_ID, ZITADEL_CLIENT_SECRET
- `infra/machinekey/admin.pat` - Admin PAT for API calls
- `infra/loginkey/login-client.pat` - Login V2 service user PAT

## Key IDs (current install)
- OIDC App Client ID: 358981049121832967
- Old Google IdP: 358983123976847367 (OIDC-style, DEACTIVATED)
- New Google IdP: 359311316051034119 (Google-native, ACTIVE with providerOptions)
