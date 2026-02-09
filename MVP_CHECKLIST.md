# MVP Checklist - Real Estate Platform

> **Última actualització**: 2026-02-06
> 
> **Objectiu**: Definir el Mínim Producte Viable per validar la plataforma

---

## 🎯 Definició del MVP

### Objectiu del MVP

Crear una plataforma funcional que permeti:

1. ✅ Usuaris registrar-se i autenticar-se
2. ✅ Publicar immobles amb informació bàsica i fotos
3. ✅ Cercar i filtrar immobles
4. ✅ Contactar amb propietaris
5. ✅ Gestionar els propis anuncis

### Fora de l'Abast del MVP

- ❌ Verificacions d'identitat i propietat (Fase 2)
- ❌ Sistema de valoracions (Fase 2)
- ❌ Immobles privats amb requisits d'accés (Fase 2)
- ❌ Admin panel complet (Fase 2)
- ❌ App mòbil nativa (Fase 3)
- ❌ Analítica avançada (Fase 3)

---

## 📋 Checklist MVP - Fase 1

### 1. Infraestructura i Configuració

#### 1.1 Base de Dades
- [x] Configurar PostgreSQL amb Prisma
- [x] Crear esquema de BD (users, properties, contacts, property_views, favorites)
- [x] Configurar migracions automàtiques
- [x] Crear seeds de dades de prova

#### 1.2 Elasticsearch
- [x] Configurar Elasticsearch (Docker)
- [x] Crear índex `properties` amb mapping
- [ ] Configurar analyzers per català/castellà
- [x] Implementar sincronització PostgreSQL → Elasticsearch

#### 1.3 Storage
- [x] Configurar MinIO (ja fet)
- [x] Crear bucket `realstate-properties`
- [x] Configurar políticas d'accés públic per imatges
- [ ] Implementar processament d'imatges (thumbnails, optimització)

#### 1.4 Autenticació
- [x] Configurar NextAuth amb múltiples providers
- [x] Implementar provider de Google OAuth (via Zitadel broker)
- [ ] Implementar provider de Facebook OAuth
- [x] Implementar Zitadel com a identity broker (setup automatitzat)
- [x] Auto-provisió d'usuaris OAuth a la BD
- [x] Configurar JWT i sessions
- [x] Token refresh automàtic

---

### 2. Backend API

#### 2.1 Autenticació
- [ ] `POST /api/auth/register` - Registre amb email/password
- [ ] `POST /api/auth/login` - Login amb email/password
- [x] `GET /api/auth/me` - Obtenir usuari autenticat (`GET /me`)
- [x] `PUT /api/auth/profile` - Actualitzar perfil

#### 2.2 Gestió d'Immobles
- [x] `POST /api/properties` - Crear immoble
- [x] `GET /api/properties` - Llistar immobles (amb filtres)
- [x] `GET /api/properties/:id` - Detall d'immoble
- [x] `PUT /api/properties/:id` - Actualitzar immoble (només propietari)
- [x] `DELETE /api/properties/:id` - Eliminar immoble (només propietari)
- [ ] `PATCH /api/properties/:id/status` - Canviar estat (actiu/pausat/tancat)

#### 2.3 Gestió d'Imatges
- [x] `POST /api/properties/:id/images/upload-url` - Generar URL signada (`POST /properties/upload-url`)
- [ ] `POST /api/properties/:id/images` - Registrar imatge pujada
- [ ] `DELETE /api/properties/:id/images/:imageId` - Eliminar imatge
- [ ] `PATCH /api/properties/:id/images/reorder` - Reordenar imatges

#### 2.4 Cerca i Filtres
- [x] `GET /api/search` - Cerca amb Elasticsearch (via `GET /properties`)
- [x] Filtres: preu, ubicació, m², habitacions, tipus
- [x] Cerca per text (títol, descripció)
- [ ] Ordenació: preu, data, relevància

#### 2.5 Contacte
- [ ] `POST /api/properties/:id/contact` - Contactar propietari
- [ ] `GET /api/contacts` - Llistar contactes rebuts (propietari)

#### 2.6 Favorits
- [ ] `POST /api/properties/:id/favorite` - Afegir a favorits
- [ ] `DELETE /api/properties/:id/favorite` - Treure de favorits
- [ ] `GET /api/favorites` - Llistar favorits de l'usuari

#### 2.7 Mètriques Bàsiques
- [ ] `POST /api/properties/:id/view` - Registrar visualització
- [ ] `GET /api/properties/:id/stats` - Estadístiques bàsiques (només propietari)

---

### 3. Frontend Web

#### 3.1 Autenticació
- [ ] Pàgina de registre (`/auth/register`)
- [ ] Pàgina de login (`/auth/login`)
- [ ] Integració amb Google OAuth
- [ ] Integració amb Facebook OAuth
- [ ] Gestió de sessions amb NextAuth
- [ ] Protecció de rutes privades

#### 3.2 Landing Page
- [ ] Hero section amb cerca ràpida
- [ ] Llistat d'immobles destacats
- [ ] Filtres bàsics (preu, ubicació)
- [ ] Paginació

#### 3.3 Cerca i Llistat
- [ ] Pàgina de cerca (`/properties`)
- [ ] Filtres avançats (sidebar)
- [ ] Cerca per text
- [ ] Ordenació
- [ ] Vista de graella/llista
- [ ] Paginació infinita o clàssica

#### 3.4 Detall d'Immoble
- [ ] Pàgina de detall (`/properties/[id]`)
- [ ] Galeria d'imatges (lightbox)
- [ ] Informació completa
- [ ] Mapa de ubicació (Google Maps o Mapbox)
- [ ] Botó de contacte
- [ ] Botó de favorit
- [ ] Immobles similars

#### 3.5 Gestió d'Immobles (Usuari)
- [ ] Dashboard (`/dashboard`)
- [ ] Llistat "Les Meves Propietats"
- [ ] Formulari de creació (`/properties/new`)
- [ ] Formulari d'edició (`/properties/[id]/edit`)
- [ ] Gestió d'imatges (drag & drop, reordenar)
- [ ] Canvi d'estat (actiu/pausat/tancat)
- [ ] Estadístiques bàsiques (visites, contactes)

#### 3.6 Perfil d'Usuari
- [ ] Pàgina de perfil (`/profile`)
- [ ] Editar informació personal
- [ ] Canviar contrasenya (si auth amb email)
- [ ] Llistat de favorits

#### 3.7 Contacte
- [ ] Modal/pàgina de contacte
- [ ] Formulari amb validació
- [ ] Confirmació d'enviament

---

### 4. UX/UI

#### 4.1 Disseny
- [ ] Sistema de disseny (colors, tipografia, components)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibilitat (WCAG 2.1 AA)
- [ ] Dark mode (opcional)

#### 4.2 Components Reutilitzables
- [ ] Card d'immoble
- [ ] Filtres
- [ ] Formularis (input, select, textarea, file upload)
- [ ] Modals
- [ ] Toasts/notificacions
- [ ] Loading states
- [ ] Error states

---

### 5. Seguretat i Validació

#### 5.1 Backend
- [ ] Validació d'inputs (Zod o similar)
- [ ] Sanitització de dades
- [ ] Rate limiting per endpoints
- [ ] CORS configurat correctament
- [ ] Protecció CSRF
- [ ] Headers de seguretat (Helmet)

#### 5.2 Frontend
- [ ] Validació de formularis
- [ ] Sanitització d'inputs
- [ ] Protecció XSS
- [ ] Gestió d'errors

---

### 6. Testing

#### 6.1 Backend
- [ ] Tests unitaris (funcions crítiques)
- [ ] Tests d'integració (endpoints API)
- [ ] Tests de base de dades (Prisma)

#### 6.2 Frontend
- [ ] Tests de components (Jest + React Testing Library)
- [ ] Tests E2E (Playwright o Cypress)
  - [ ] Flux de registre
  - [ ] Flux de login
  - [ ] Flux de creació d'immoble
  - [ ] Flux de cerca i contacte

---

### 7. Documentació

- [ ] README.md actualitzat
- [ ] Documentació d'API (Swagger/OpenAPI)
- [ ] Guia de desplegament
- [ ] Variables d'entorn documentades

---

## 📊 Resum de Tasques

| Categoria | Tasques | Completades | % |
|-----------|---------|-------------|---|
| Infraestructura | 13 | 0 | 0% |
| Backend API | 21 | 0 | 0% |
| Frontend Web | 29 | 0 | 0% |
| UX/UI | 9 | 0 | 0% |
| Seguretat | 11 | 0 | 0% |
| Testing | 7 | 0 | 0% |
| Documentació | 4 | 0 | 0% |
| **TOTAL** | **94** | **0** | **0%** |

---

## 🚀 Pla d'Execució

### Sprint 1: Fonaments (2 setmanes)
**Objectiu**: Infraestructura i autenticació

- [ ] Configurar PostgreSQL, Elasticsearch, MinIO
- [ ] Implementar autenticació completa (Google, Facebook, email)
- [ ] Crear esquema de BD i migracions
- [ ] Implementar endpoints bàsics d'usuari

**Entregable**: Usuaris poden registrar-se i autenticar-se

---

### Sprint 2: Gestió d'Immobles (2 setmanes)
**Objectiu**: CRUD complet d'immobles

- [ ] Implementar endpoints de propietats
- [ ] Crear formularis de creació/edició
- [ ] Implementar pujada i gestió d'imatges
- [ ] Sincronització PostgreSQL ↔ Elasticsearch

**Entregable**: Usuaris poden crear i gestionar immobles

---

### Sprint 3: Cerca i Navegació (2 setmanes)
**Objectiu**: Cerca funcional i llistat

- [ ] Implementar cerca amb Elasticsearch
- [ ] Crear pàgina de cerca amb filtres
- [ ] Implementar pàgina de detall
- [ ] Optimitzar rendiment de cerca

**Entregable**: Usuaris poden cercar i veure immobles

---

### Sprint 4: Contacte i Interacció (1 setmana)
**Objectiu**: Contacte entre usuaris

- [ ] Implementar sistema de contacte
- [ ] Implementar favorits
- [ ] Implementar tracking de visites
- [ ] Crear dashboard amb estadístiques bàsiques

**Entregable**: Usuaris poden contactar i interactuar

---

### Sprint 5: Poliment i Testing (1 setmana)
**Objectiu**: Qualitat i estabilitat

- [ ] Tests E2E complets
- [ ] Correcció de bugs
- [ ] Optimització de rendiment
- [ ] Documentació

**Entregable**: MVP llest per producció

---

## 🎯 Criteris d'Èxit del MVP

### Funcionals
- ✅ Usuaris poden registrar-se amb Google, Facebook o email
- ✅ Usuaris poden crear anuncis amb fotos
- ✅ Usuaris poden cercar immobles per filtres
- ✅ Usuaris poden contactar propietaris
- ✅ Propietaris poden gestionar els seus anuncis

### Tècnics
- ✅ API REST funcional i documentada
- ✅ Base de dades PostgreSQL amb dades reals
- ✅ Elasticsearch operatiu amb cerca ràpida (<500ms)
- ✅ Imatges emmagatzemades a MinIO
- ✅ Tests E2E cobreixen fluxos crítics

### UX
- ✅ Interfície responsive (mobile, tablet, desktop)
- ✅ Temps de càrrega <3s
- ✅ Accessibilitat bàsica (WCAG AA)

---

## 📈 Mètriques de Validació

Per considerar el MVP exitós, cal assolir:

| Mètrica | Objectiu |
|---------|----------|
| Usuaris registrats | 50+ |
| Immobles publicats | 100+ |
| Cerques realitzades | 500+ |
| Contactes generats | 20+ |
| Taxa de conversió (visita → contacte) | >2% |
| Temps mitjà de cerca | <30s |

---

## 🔄 Iteració Post-MVP

Després del MVP, prioritzar segons feedback:

1. **Verificacions** (si hi ha demanda de confiança)
2. **Valoracions** (si hi ha prou interaccions)
3. **Admin panel** (si cal moderació)
4. **App mòbil** (si hi ha demanda mobile)

---

**Document viu**: Aquest checklist s'actualitzarà a mesura que es completin tasques i es rebin feedbacks.
