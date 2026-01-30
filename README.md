# Real Estate POC

## 📋 Objectiu del Projecte

Aquest projecte és una **Prova de Concepte (POC)** end-to-end per validar un stack tecnològic complet per a una aplicació immobiliària. L'objectiu principal és demostrar la integració funcional de tots els components del sistema:

### 🔑 Principi Fonamental: API i Auth Compartides

> **IMPORTANT**: Aquest projecte segueix una arquitectura **API-First** on:
> - 📡 **Una sola API** (Backend Node.js) serveix tant el frontend web com l'aplicació mòbil
> - 🔐 **Un sol sistema d'autenticació** (Zitadel OIDC) gestiona la identitat per totes les plataformes
> - 🎫 **Mateix JWT** vàlid per web i mobile
> - 📊 **Mateixos endpoints** accessibles des de qualsevol client

Això garanteix:
- ✅ Consistència de dades entre plataformes
- ✅ Experiència d'usuari unificada (mateix login, mateixes dades)
- ✅ Mantenibilitat (una sola lògica de negoci)
- ✅ Escalabilitat (afegir nous clients sense duplicar backend)

### Objectius Funcionals
- ✅ **Landing Page Funcional**: Mostrar propietats immobiliàries amb dades reals
- ✅ **Autenticació Unificada**: Sistema d'autenticació OIDC **compartit** entre web i mobile
- ✅ **API Backend Única**: Servei REST que gestiona dades i autenticació per **tots els clients**
- ✅ **Persistència de Dades**: Base de dades relacional operativa
- ✅ **Gestió d'Imatges**: Sistema d'emmagatzematge d'objectes integrat
- ✅ **Multi-plataforma**: Mateix backend servint web i aplicació mòbil

### Abast de la POC
Aquest és un **MVP tècnic**, no un producte final. L'objectiu és validar:
- Connectivitat entre components
- Flux d'autenticació OIDC
- Integració de serveis
- Viabilitat del stack escollit

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTS (Multi-plataforma)                │
├──────────────────────────┬──────────────────────────────────┤
│   Web (Next.js)          │   Mobile (Flutter)               │
│   Port: 3000             │   Android/iOS                    │
└──────────────┬───────────┴──────────────┬───────────────────┘
               │                          │
               │    ╔═══════════════════════════════╗
               │    ║  HTTP/REST + JWT (Compartit) ║
               │    ╚═══════════════════════════════╝
               │                          │
┌──────────────▼──────────────────────────▼───────────────────┐
│         ⭐ API ÚNICA COMPARTIDA (Node.js + Express)          │
│              Port: 3001                                      │
│  ┌────────────────┬──────────────────┬──────────────────┐  │
│  │ Auth Middleware│  Prisma ORM      │  MinIO Client    │  │
│  │ (JWT Verify)   │  (Data Access)   │  (File Storage)  │  │
│  └────────────────┴──────────────────┴──────────────────┘  │
│                                                              │
│  Endpoints:                                                  │
│  • GET  /properties      (públic)                           │
│  • GET  /me              (protegit - web & mobile)          │
│  • POST /upload-url      (protegit - web & mobile)          │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
               │                  │
┌──────────────▼─────┐  ┌─────────▼──────────┐  ┌────────────┐
│   PostgreSQL       │  │   MinIO (S3)       │  │  Zitadel   │
│   Port: 5432       │  │   Port: 9000/9001  │  │  Port: 8080│
│   - users          │  │   - Bucket:        │  │ ⭐ OIDC IdP │
│   - properties     │  │   realstate-props  │  │ (Compartit)│
└────────────────────┘  └────────────────────┘  └────────────┘
```

### Flux d'Autenticació (Compartit Web + Mobile)
1. **Client** → Redirecció a Zitadel (OIDC Authorization Code Flow)
2. **Zitadel** → Autenticació d'usuari i emissió de JWT
3. **Client** → Crida a Backend API amb JWT a la capçalera
4. **Backend** → Validació del JWT contra Zitadel
5. **Backend** → Retorn de dades protegides

---

## 🛠️ Stack Tecnològic

### Frontend Web
- **Framework**: Next.js 14+ (App Router)
- **Llenguatge**: TypeScript
- **Estils**: TailwindCSS
- **Autenticació**: NextAuth.js amb provider Zitadel
- **HTTP Client**: Fetch API nativa
- **Port**: 3000

### Frontend Mobile
- **Framework**: Flutter 3.19+
- **Llenguatge**: Dart
- **Gestió d'Estat**: Provider
- **Autenticació**: flutter_appauth (OIDC)
- **HTTP Client**: package `http`
- **Plataformes**: Android, iOS

### Backend
- **Runtime**: Node.js v20
- **Framework**: Express.js
- **Llenguatge**: TypeScript (executat amb ts-node)
- **ORM**: Prisma 5.22.0
- **Autenticació**: express-oauth2-jwt-bearer
- **Storage Client**: MinIO SDK
- **Port**: 3001

### Base de Dades
- **Motor**: PostgreSQL 16 (Alpine)
- **ORM**: Prisma
- **Esquema**:
  - `users`: Usuaris del sistema
  - `properties`: Propietats immobiliàries

### Infraestructura
- **Orquestració**: Docker (manual via script `start.sh`)
- **Identity Provider**: Zitadel (OIDC/OAuth2)
- **Object Storage**: MinIO (compatible S3)
- **Xarxa**: Docker network `realstate-net`

---

## 📁 Estructura del Projecte

```
realState/
├── backend/              # API Node.js
│   ├── src/
│   │   └── index.ts     # Entrypoint del servidor
│   ├── prisma/
│   │   └── schema.prisma # Esquema de BD
│   ├── .env             # Variables d'entorn
│   └── package.json
│
├── web/                 # Frontend Next.js
│   ├── app/
│   │   ├── components/  # Components React
│   │   ├── api/auth/    # NextAuth route handler
│   │   ├── page.tsx     # Landing page
│   │   └── layout.tsx   # Root layout
│   ├── .env.local       # Config local
│   └── package.json
│
├── mobile/              # App Flutter
│   ├── lib/
│   │   └── main.dart    # Entrypoint de l'app
│   └── pubspec.yaml     # Dependències
│
├── infra/               # Infraestructura Docker
│   ├── docker-compose.yml
│   ├── start.sh         # Script d'inici
│   └── init-postgres.sh # Init DB
│
└── tools/               # Eines locals (Flutter SDK)
```

---

## 🚀 Com Executar el Projecte

### Opció Ràpida: Scripts Automatitzats ⚡

Per arrencar tot el sistema amb un sol comandament:

```bash
./start-all.sh
```

Aquest script fa:
1. ✅ Arrenca tots els serveis Docker (PostgreSQL, Redis, Elasticsearch, MinIO, Zitadel, Caddy)
2. ✅ Espera que els serveis estiguin saludables
3. ✅ Aplica les migracions de Prisma
4. ✅ Arrenca el backend (port 3001)
5. ✅ Arrenca el frontend (port 3000)

```bash
# Comprovar l'estat de tots els serveis
./status.sh

## Quick Start

### 1. Start All Services
Use the unified startup script:
```bash
./start-all.sh
```
This will start Docker containers, the Backend (port 3002), and Frontend (port 3000).
Access the application at **https://localhost**.

### 2. Database Reset & Seeding
To reset the database and load demo data (creates 'Demo User' and sample property):
```bash
cd backend
npm run db:reset
```

### 3. Architecture
- **Frontend**: Next.js (Port 3000)
- **Backend API**: Express (Port 3002, exposed via Caddy at `/api`)
- **Auth**: Zitadel (Port 8443)
- **Proxy**: Caddy (Port 80/443 mapping to `localhost`)
- Docker: `cd infra && docker-compose logs -f`

---

### Opció Manual: Pas a Pas

Si prefereixes arrencar els serveis manualment:

#### 1. Infraestructura
```bash
cd infra
./start.sh
```
Això inicia:
- PostgreSQL (port 5432)
- MinIO (ports 9000, 9001)
- Zitadel (port 8080) ✅ **FUNCIONANT**

**Credencials Zitadel**:
- URL: http://localhost:8080
- Username: `admin`
- Password: `Admin123!`

**⚠️ Important**: Després d'iniciar la infra, has de configurar l'aplicació OIDC a Zitadel.  
Segueix la guia: `infra/ZITADEL_SETUP.md`

#### 2. Backend
```bash
cd backend
export PATH=$HOME/.nvm/versions/node/v20.20.0/bin:$PATH
npm install
npx prisma generate
npx prisma db push
npx ts-node src/index.ts
```
Backend disponible a: `http://localhost:3001`

#### 3. Frontend Web
```bash
cd web
export PATH=$HOME/.nvm/versions/node/v20.20.0/bin:$PATH
npm install
npm run dev
```
Web disponible a: `http://localhost:3000`

#### 4. Mobile (Opcional)
```bash
cd mobile
flutter pub get
flutter run
```
**Nota**: Requereix Android SDK o Xcode instal·lat.

---

## 🎯 Decisions Tècniques i Restriccions

### Arquitectura
- **Monorepo**: Tots els components en un sol repositori per facilitar la POC
- **API-First**: Backend REST com a única font de veritat
- **Stateless Backend**: JWT per autenticació, sense sessions
- **Shared Database**: Una sola BD per simplicitat (en producció es podria separar)

### Clean Code i Bones Pràctiques
1. **Separació de Responsabilitats**
   - Backend: Lògica de negoci i accés a dades
   - Frontend: Presentació i experiència d'usuari
   - Infra: Configuració d'entorn

2. **Tipat Fort**
   - TypeScript al backend i web
   - Dart (tipat estàtic) al mobile

3. **Variables d'Entorn**
   - Configuració sensible en fitxers `.env`
   - No committejar secrets al repositori

4. **Gestió d'Errors**
   - Try-catch als endpoints crítics
   - Logs descriptius per debugging

### Restriccions Aplicades
- **No Auth Completa**: Zitadel configurat però sense client OIDC real (mock al mobile)
- **Imatges Placeholder**: URLs de placeholder en lloc d'imatges reals
- **Seed Automàtic**: Dades de prova inserides a l'inici del backend
- **CORS Obert**: `cors()` sense restriccions (només per POC)
- **HTTP (no HTTPS)**: Comunicació en text pla (acceptable per entorn local)

### Decisions de Compromís (POC vs Producció)
| Aspecte | POC | Producció |
|---------|-----|-----------|
| HTTPS | ❌ HTTP | ✅ HTTPS obligatori |
| Validació Input | ⚠️ Bàsica | ✅ Exhaustiva |
| Rate Limiting | ❌ | ✅ Implementat |
| Logging | 🟡 Console | ✅ Sistema centralitzat |
| Tests | ❌ | ✅ Unit + Integration |
| CI/CD | ❌ | ✅ Pipeline automatitzat |
| Monitoratge | ❌ | ✅ APM + Alertes |

---

## 🔐 Seguretat

### Implementat
- ✅ JWT per autenticació
- ✅ Validació de tokens al backend
- ✅ OIDC amb Zitadel
- ✅ Variables d'entorn per secrets

### Pendent (Producció)
- ⚠️ HTTPS/TLS
- ⚠️ Rate limiting
- ⚠️ Input sanitization
- ⚠️ CORS restrictiu
- ⚠️ Helmet.js (security headers)
- ⚠️ Rotació de secrets

---

## 📊 Endpoints del Backend

### Públics
- `GET /health` - Health check
- `GET /properties` - Llistat de propietats

### Protegits (requereixen JWT)
- `GET /me` - Informació de l'usuari autenticat
- `POST /properties/upload-url` - Genera URL signada per pujar imatges

---

## 🧪 Verificació

### Backend
```bash
curl http://localhost:3001/properties
```
Hauria de retornar JSON amb propietats.

### Web
Obre `http://localhost:3000` al navegador.

### Mobile
Executa l'app en un emulador Android (usa `10.0.2.2:3001` per localhost).

---

## 📝 Notes Importants

1. **Node.js v20**: Requereix NVM o Node v20+ instal·lat
2. **Docker**: Tots els serveis d'infra corren en contenidors
3. **Prisma**: Versió 5.22.0 (v7 té breaking changes)
4. **Flutter SDK**: Descarregat localment a `tools/flutter/`
5. **Zitadel**: Pot trigar 1-2 minuts en arrencar la primera vegada

---

## 🔄 Pròxims Passos (Post-POC)

1. **Configurar Zitadel**: Crear aplicació OIDC real amb client_id/secret
2. **Implementar Auth Real al Mobile**: Substituir mock per `flutter_appauth`
3. **Afegir Tests**: Jest (backend), Vitest (web), Flutter test (mobile)
4. **Millorar UI**: Disseny més elaborat amb components reutilitzables
5. **Desplegar**: Configurar entorns de staging i producció
6. **Monitoratge**: Integrar Sentry, Datadog o similar

---

## 👥 Contribució

Aquest és un projecte POC. Per a millores:
1. Crear una branca des de `main`
2. Implementar canvis seguint les convencions del projecte
3. Assegurar que tots els serveis funcionen
4. Crear Pull Request amb descripció detallada

---

## 📄 Llicència

Aquest projecte és una POC interna sense llicència pública.
