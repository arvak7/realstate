# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real Estate POC - A multi-platform real estate application demonstrating API-First architecture with shared backend serving web (Next.js) and mobile (Flutter) clients. Uses Zitadel for OIDC authentication (currently in demo mode).

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

Supporting: Zitadel (:8443), Elasticsearch (:9200), Redis (:6379), Caddy (:80/443)
```

## Key Files

### Backend
- `backend/src/index.ts` - Server entrypoint, route mounting
- `backend/src/config/index.ts` - Service clients (Prisma, MinIO, Elasticsearch, Redis)
- `backend/src/middleware/auth.ts` - JWT validation middleware (demo + real OIDC)
- `backend/src/controllers/propertyController.ts` - Property CRUD and search
- `backend/prisma/schema.prisma` - Database schema (User, Property, Rating, etc.)

### Frontend
- `web/app/page.tsx` - Landing page
- `web/app/api/auth/[...nextauth]/route.ts` - NextAuth config (Zitadel + Demo provider)
- `web/app/properties/` - Property pages (list, detail, create)
- `web/app/components/` - Reusable components (Navbar, PropertyGrid, etc.)

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

Currently uses demo mode (`demo-token`) that bypasses Zitadel. The backend auth middleware at `backend/src/middleware/auth.ts` accepts `Authorization: Bearer demo-token` and auto-creates a demo user. Real Zitadel OIDC is configured but requires manual app registration.

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

| Service       | Port  | Credentials                    |
|---------------|-------|--------------------------------|
| Frontend      | 3000  | -                              |
| Backend       | 3002  | -                              |
| PostgreSQL    | 5432  | postgres / postgrespassword    |
| MinIO Console | 9001  | minioadmin / minioadminpassword|
| Zitadel       | 8443  | admin / Admin123!              |
| Caddy (HTTPS) | 443   | https://localhost              |

## Playwright Browser Testing

**IMPORTANT - Browser Configuration:**
- **Always use Firefox** instead of Chrome/Chromium for Playwright operations (Chrome causes system stability issues)
- **Maximum 3 tabs open at any time** - Close tabs before opening new ones
- **Avoid infinite loops** - Do not enter repetitive navigation patterns that consume tokens unnecessarily
- When finished testing, always close the browser with `browser_close`
