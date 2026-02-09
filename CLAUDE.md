# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real Estate Platform - A multi-platform real estate application with API-First architecture. Shared backend serving web (Next.js) and mobile (Flutter) clients. Uses Zitadel as identity broker for OIDC authentication (Google, internal users, and future providers).

## Commands

### Start Everything
```bash
./start-all.sh    # Starts Docker services, backend (port 3002), frontend (port 3000)
./stop-all.sh     # Stop all services
./status.sh       # Check service status
```

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

Supporting: Zitadel API (:8080), Zitadel Login V2 (:8081), Elasticsearch (:9200), Redis (:6379), Caddy (:80/443/:8443)
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

- **Frontend**: NextAuth with ZitadelProvider (primary) + Demo CredentialsProvider (dev fallback)
- **Backend**: `express-oauth2-jwt-bearer` validates Zitadel JWTs + auto-provisions users in DB
- **Auto-provisioning**: After JWT validation, middleware upserts user in User table (with 5-min cache)
- **Demo bypass**: `Authorization: Bearer demo-token` still works for development
- **Login UI**: Zitadel Login V2 (separate container on :8081) - shows Google, internal login, and any configured providers
- **Setup**: `infra/setup-zitadel.sh` configures Zitadel via Management API (idempotent, no UI needed)
- **Token refresh**: NextAuth automatically refreshes expired Zitadel tokens via refresh_token grant
- **Scalability**: To add new providers (Facebook, Apple, etc.), only add them to Zitadel - no frontend/backend changes needed

### Auth flow
```
User → "Iniciar Sessió" → Zitadel Login V2 (:8081) → Google/email/internal → Zitadel JWT → Backend validates → User auto-created in DB
```

### Setup
```bash
# Automated (runs during start-all.sh):
./infra/setup-zitadel.sh

# Reconfigure:
rm infra/.zitadel-configured && ./infra/setup-zitadel.sh
```

## Features

Large feature plans are documented in `features/` directory. Check there for context, rationale and implementation details.

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

| Service            | Port  | Credentials                    |
|--------------------|-------|--------------------------------|
| Frontend           | 3000  | -                              |
| Backend            | 3002  | -                              |
| PostgreSQL         | 5432  | postgres / postgrespassword    |
| MinIO Console      | 9001  | minioadmin / minioadminpassword|
| Zitadel API        | 8080  | admin / Admin123!              |
| Zitadel Login V2   | 8081  | -                              |
| Zitadel (Caddy)    | 8443  | HTTPS proxy to :8080           |
| Caddy (HTTPS)      | 443   | https://localhost              |

## Important Rules for Claude

- **Never make big architecture/infra changes without asking permission first.** Always propose options and let the user decide. This includes auth flows, identity providers, database schema changes, docker infrastructure, etc.

## Playwright Browser Testing

**IMPORTANT - DO NOT launch the browser unless the user explicitly asks for it.** The system becomes unstable due to lack of memory when running browser automation. Only use Playwright when specifically requested.

**Browser Configuration (when explicitly requested):**
- **Always use Firefox** instead of Chrome/Chromium for Playwright operations (Chrome causes system stability issues)
- **Maximum 3 tabs open at any time** - Close tabs before opening new ones
- **Avoid infinite loops** - Do not enter repetitive navigation patterns that consume tokens unnecessarily
- When finished testing, always close the browser with `browser_close`
