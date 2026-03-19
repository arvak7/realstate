# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real Estate Platform - A multi-platform real estate application with API-First architecture. Shared backend serving web (Next.js) and mobile (Flutter) clients. Uses Zitadel as identity broker for OIDC authentication (Google, internal users, and future providers).

## Environments

| Entorn | Script | Configuració | Certs SSL |
|--------|--------|--------------|-----------|
| **DEV** | `./start-all.sh` | `infra/.env` (`APP_ENV=DEV`, `DOMAIN=localhost`) | mkcert (local, trusted) |
| **PRE** | `./deploy.sh` | `infra/.env` (`APP_ENV=PRE`, `DOMAIN=staging.xxx.com`) | Let's Encrypt (Caddy auto) |
| **PRO** | `./deploy.sh` | `infra/.env` (`APP_ENV=PRO`, `DOMAIN=xxx.com`) | Let's Encrypt (Caddy auto) |

- **DEV**: frontend i backend corren al host (Node.js local), infraestructura via Docker
- **PRE/PRO**: frontend i backend corren via PM2 al servidor, infraestructura via Docker
- El `Caddyfile` es genera automàticament de `Caddyfile.dev` o `Caddyfile.prod` via `envsubst`

## Commands

### DEV (local)
```bash
./install.sh      # PRIMERA VEGADA: deps + .env + mkcert + arrenca tot + seed
./start-all.sh    # Ús diari: arrenca Docker + backend + frontend (+ seed automàtic 1a vegada)
./stop-all.sh     # Atura tots els serveis
./status.sh       # Estat dels serveis
```

### PRE / PRO (Hostinger VPS)
```bash
./deploy.sh       # Pull + build + Docker + PM2 (llegeix infra/.env)
```
Veure `DEPLOYMENT.md` per la configuració inicial del VPS.

### Backend (backend/)
```bash
npm run dev              # Run development server
npm run db:reset         # Reset database and seed demo data
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma database UI
```

### Frontend (web/)
```bash
npm run dev     # Development server
npm run build   # Production build
npm run lint    # ESLint
```

### Docker Logs
```bash
cd infra && docker-compose logs -f
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│   Web (Next.js:3000)    │   Mobile (Flutter)           │
└──────────────┬──────────┴──────────────┬───────────────┘
               │    HTTPS/REST + JWT     │
┌──────────────▼──────────────────────────▼───────────────┐
│         Backend API (Express:3002 via Caddy)            │
│         JWT Auth + Prisma ORM + MinIO Storage           │
└──────────────┬──────────────────┬──────────────────────┘
       ┌───────▼──────┐  ┌────────▼──────┐
       │  PostgreSQL  │  │   MinIO (S3)  │
       │  :5432       │  │   :9000/9001  │
       └──────────────┘  └───────────────┘

Supporting: Zitadel API (:8080), Zitadel Login V2 (via Caddy /ui/v2/login), Elasticsearch (:9200), Redis (:6379), Caddy (:443)
```

## Key Files

### Backend
- `backend/src/index.ts` - Server entrypoint, route mounting
- `backend/src/config/index.ts` - Service clients (Prisma, MinIO, Elasticsearch, Redis)
- `backend/src/middleware/auth.ts` - JWT validation middleware (demo + real OIDC)
- `backend/src/controllers/propertyController.ts` - Property CRUD and search
- `backend/prisma/schema.prisma` - Database schema (User, Property, Rating, etc.)

### Frontend
- `web/app/page.tsx` - Landing page (redirects to locale)
- `web/app/[locale]/` - i18n routes (ca, es, en)
  - `page.tsx` - Localized landing page
  - `properties/` - Property pages (list, detail, create)
  - `profile/` - User profile page
  - `auth/` - Authentication pages
- `web/app/api/auth/[...nextauth]/route.ts` - NextAuth config (Google OAuth + Demo provider)
- `web/app/components/` - Reusable components
  - `Navbar.tsx` - Navigation with language switcher
  - `PropertyGrid.tsx` - Property card grid
  - `ImageUploader.tsx` - Drag & drop image upload to MinIO
  - `LocationPicker/` - Address search + map picker (Nominatim geocoding)
  - `PrivacyCircleMap/` - Shows approximate location circle for privacy
  - `ProfilePhotoUploader.tsx` - User avatar upload
- `web/messages/` - i18n translations (ca.json, es.json, en.json)

### Mobile
- `mobile/lib/main.dart` - Flutter app entry with login and properties screens

## API Routes

**Public:**
- `GET /health` - Health check
- `GET /properties` - List properties (supports search, filters, pagination)
- `GET /properties/:id` - Property details

**Protected (JWT required):**
- `POST /properties` - Create property
- `PUT /properties/:id` - Update property
- `DELETE /properties/:id` - Delete property
- `POST /properties/upload-url` - Generate MinIO presigned URL
- `GET /me` - Current user info

## Authentication

Zitadel acts as identity broker. All authentication (Google, internal users, future providers like Facebook/Apple) goes through Zitadel, which issues its own JWT tokens. Single source of truth for identity.

- **Frontend**: NextAuth with ZitadelProvider (primary)
- **Backend**: `express-oauth2-jwt-bearer` validates Zitadel JWTs + auto-provisions users in DB
- **Auto-provisioning**: After JWT validation, middleware upserts user in User table (with 5-min cache)
- **Demo bypass**: `Authorization: Bearer demo-token` still works for development
- **Login UI**: Zitadel Login V2 container, served via Caddy on `https://localhost/ui/v2/login/*` (same port 443 as frontend)
- **Setup**: `infra/setup-zitadel.sh` configures Zitadel via Management API (idempotent, no UI needed)
- **Token refresh**: NextAuth automatically refreshes expired Zitadel tokens via refresh_token grant
- **Scalability**: To add new providers (Facebook, Apple, etc.), only add them to Zitadel - no frontend/backend changes needed

### Auth flow
```
User → "Iniciar Sessió" → https://localhost/ui/v2/login (Zitadel Login V2 via Caddy)
  → Google/email/internal → Zitadel JWT → Backend validates → User auto-created in DB
```

### HTTPS & Certificates
- **mkcert** generates locally-trusted certs (browser shows green padlock)
- Caddy terminates TLS for all services on port 443
- Login V2, frontend, backend API, and IdP callbacks all served through `https://localhost`
- Run `cd infra && bash mkcert-setup.sh` to install/regenerate certs

### Zitadel Admin Console (Security)
La consola d'administració de Zitadel (`/ui/console`) és accessible a qualsevol usuari autenticat per disseny (Zitadel ho permet per self-service), però usuaris normals no veuen res sensible. Per seguretat en producció:

| Entorn | Port 8080 binding | Accés consola |
|--------|-------------------|---------------|
| **DEV** | `0.0.0.0` (totes les IPs) | `http://localhost:8080` |
| **PRE/PRO** | `127.0.0.1` (només servidor) | Via SSH tunnel (veure baix) |

**Credencials admin Zitadel**: `admin@realestate.localhost` / `ZITADEL_ADMIN_PASSWORD` (de `infra/.env`)

**Accés en PRE/PRO via SSH tunnel:**
```bash
ssh -L 8080:localhost:8080 user@servidor
# Després: http://localhost:8080
```

**A `infra/.env` per entorn:**
```bash
# DEV
ZITADEL_BIND=0.0.0.0

# PRE/PRO
ZITADEL_BIND=127.0.0.1
```

El port 8443 (HTTPS proxy via Caddy) bloqueja `/ui/console` en Caddyfile.prod.

### Google OAuth Redirect URIs (Google Cloud Console)
Only these two are needed:
```
https://localhost/api/auth/callback/google
https://localhost/idps/callback
```

### Setup
```bash
# Automated (runs during start-all.sh):
./infra/setup-zitadel.sh

# Reconfigure (e.g. after Docker volume reset):
rm infra/.zitadel-configured && ./infra/setup-zitadel.sh

# Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in web/.env.local BEFORE running setup
```

## Features

Large feature plans are documented in `features/` directory. Check there for context, rationale and implementation details.

**IMPORTANT**: When implementing code changes for a feature, ALWAYS update the corresponding `features/*.md` file:
- Mark completed checklist items with `[x]`
- Update the "Estat" column in the files table (Pendent → Completat)
- If a new issue is discovered, add it to the feature doc
- This ensures the feature MD is always the source of truth for progress tracking

## Internationalization (i18n)

Uses `next-intl` with three locales:
- `ca` - Catalan (default)
- `es` - Spanish
- `en` - English

Translation files: `web/messages/{locale}.json`

## Location & Privacy

- **LocationPicker**: Interactive map + address search using OpenStreetMap Nominatim API
- **Privacy Circle**: Properties show approximate location (random offset ~200-500m) to protect exact address
  - Backend generates `privacyCircleCenterLat/Lon` on property creation
  - Frontend displays circle on map instead of exact marker

## Database

PostgreSQL with Prisma ORM. Key models: `User`, `Property`, `Rating`, `IdentityVerification`, `PropertyVerification`, `Contact`, `PropertyView`, `Favorite`.

## Environment

Backend uses `.env`, frontend uses `.env.local`. Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `MINIO_*` - Object storage config
- `ELASTICSEARCH_NODE` - Search engine
- `ZITADEL_*` - OIDC identity provider

## Tech Stack

- **Backend**: Node.js 20, Express 5, TypeScript, Prisma, JWT
- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS, NextAuth.js
- **Mobile**: Flutter, Dart, Provider, flutter_appauth
- **Infra**: Docker, PostgreSQL 16, MinIO, Elasticsearch 8, Redis 7, Zitadel, Caddy

## Services & Ports

| Service            | Port  | URL                              | Credentials                    |
|--------------------|-------|----------------------------------|--------------------------------|
| Caddy (HTTPS)      | 443   | https://localhost                 | -                              |
| Frontend           | 3000  | https://localhost (via Caddy)     | -                              |
| Backend API        | 3002  | https://localhost/api (via Caddy) | -                              |
| Zitadel Login V2   | -     | https://localhost/ui/v2/login     | -                              |
| Zitadel API        | 8080  | http://localhost:8080             | admin / Admin123!              |
| Zitadel (Caddy)    | 8443  | https://localhost:8443            | HTTPS proxy to :8080           |
| PostgreSQL         | 5432  | -                                | postgres / postgrespassword    |
| MinIO Console      | 9001  | https://localhost:9001            | minioadmin / minioadminpassword|

## Fresh Install Checklist (ordinador nou)

Passos necessaris per posar en marxa el projecte en un ordinador net:

### Prerequisites del sistema
- [ ] **Docker & Docker Compose** - `sudo apt install docker.io docker-compose-v2` (o Docker Desktop)
- [ ] **Node.js 20+** - recomanat via [nvm](https://github.com/nvm-sh/nvm): `nvm install 20`
- [ ] **Git** - `sudo apt install git`

### 1. Clonar i instal·lar dependències
```bash
git clone <repo-url> && cd realstate
cd backend && npm install && cd ..
cd web && npm install && cd ..
```

### 2. Certificats HTTPS locals (mkcert)
Imprescindible perquè el browser no mostri "Not Secured" i l'auth funcioni sense errors TLS.
```bash
cd infra && bash mkcert-setup.sh && cd ..
```
Això:
- Instal·la `mkcert` i `libnss3-tools` (per Firefox)
- Crea una CA local i la registra al system trust store
- Genera `infra/certs/localhost.pem` i `localhost-key.pem` signats per la CA local

**Important**: Per Firefox, cal instal·lar la CA manualment al perfil:
```bash
CAROOT=$(mkcert -CAROOT)
certutil -A -n "mkcert" -t "TC,," -i "$CAROOT/rootCA.pem" \
  -d "sql:$(find ~/.mozilla/firefox -name cert9.db -printf '%h\n' | head -1)"
```

### 3. Arrencar serveis i configurar Zitadel
```bash
./start-all.sh
```
La primera execució:
- Arrenca Docker (PostgreSQL, Redis, Elasticsearch, MinIO, Zitadel, Caddy)
- Crea `.env` / `.env.local` amb placeholders si no existeixen
- Executa `infra/setup-zitadel.sh` que:
  - Crea el projecte OIDC i l'app a Zitadel
  - Escriu els `ZITADEL_CLIENT_ID`, `ZITADEL_CLIENT_SECRET`, `ZITADEL_ISSUER` correctes als `.env`
  - Configura Google IdP (si hi ha credencials Google OAuth a `web/.env.local`)

### 4. Google OAuth (opcional)
Per habilitar login amb Google, afegeix a `web/.env.local` **abans** d'executar `setup-zitadel.sh`:
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```
Després reconfigura: `rm infra/.zitadel-configured && ./infra/setup-zitadel.sh`

### 5. Verificar
- `https://localhost` - Frontend (ha de mostrar candau verd al browser)
- `https://localhost/api/health` - Backend health check
- Clicar "Iniciar Sessió" per testejar l'auth amb Zitadel

### Troubleshooting comú
| Problema | Causa | Solució |
|----------|-------|---------|
| Browser diu "Not Secured" | Certs auto-signats (no mkcert) | `cd infra && bash mkcert-setup.sh` + reiniciar Caddy |
| Auth falla amb "OAuthSignin" | Client ID inexistent a Zitadel | `rm infra/.zitadel-configured && ./infra/setup-zitadel.sh` |
| `self-signed certificate` als logs | `NODE_TLS_REJECT_UNAUTHORIZED=0` no posat | Verificar `.env` i `.env.local` |
| Port 3000/3002 ocupat | Procés anterior no aturat | `./stop-all.sh` o `sudo kill $(lsof -ti:3000)` |
| Zitadel volumes reset | Docker volumes esborrats | Esborrar flag + re-setup: `rm infra/.zitadel-configured && ./infra/setup-zitadel.sh` |

## Important Rules for Claude

- **Never make big architecture/infra changes without asking permission first.** Always propose options and let the user decide. This includes auth flows, identity providers, database schema changes, docker infrastructure, etc.

## Playwright Browser Testing

**IMPORTANT - DO NOT launch the browser unless the user explicitly asks for it.** The system becomes unstable due to lack of memory when running browser automation. Only use Playwright when specifically requested.

**Browser Configuration (when explicitly requested):**
- **Always use Firefox** instead of Chrome/Chromium for Playwright operations (Chrome causes system stability issues)
- **Maximum 3 tabs open at any time** - Close tabs before opening new ones
- **Avoid infinite loops** - Do not enter repetitive navigation patterns that consume tokens unnecessarily
- When finished testing, always close the browser with `browser_close`
