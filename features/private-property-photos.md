# Feature: Fotos Privades d'Immobles (Ghost Mode)

**Estat**: EN DESENVOLUPAMENT
**Data inici**: 2026-02-15

## Per què

Els propietaris volen controlar qui veu les fotos dels seus immobles. Compradors no qualificats no haurien de poder veure les fotos sense complir uns requisits establerts pel venedor (verificació d'identitat, match mutu, etc.). Això protegeix la privacitat del venedor i filtra compradors seriosos.

## Objectiu

Sistema extensible de clàusules de privacitat. Quan un immoble es marca com a "privat", les fotos apareixen en mode "ghost" (desenfocades, amb cadenat). El comprador ha de complir TOTS els requisits seleccionats pel venedor per veure-les. Afegir noves clàusules = 1 fitxer + traduccions.

---

## Checklist de funcionalitats

### Fase 1: Ghost Photos (visual)
- [x] Component `GhostImageOverlay` (blur + cadenat + text)
- [x] Component `PrivatePropertyBadge` (badge subtil per accés concedit)
- [x] Ghost mode a la pàgina de detall (`properties/[id]/page.tsx`)
- [x] Ghost mode a les cards del llistat (`properties/page.tsx`)
- [x] Traduccions `privatePhotos.*` a ca/es/en

### Fase 2: Backend - Sistema de clàusules
- [x] Model `PropertyPhotoAccess` a schema.prisma + migració
- [x] Camp `status` al model `Contact` (pending/accepted/rejected) + migració
- [x] Relacions `photoAccess` a Property i User
- [x] `backend/src/clauses/types.ts` - Interfícies del sistema
- [x] `backend/src/clauses/identityVerification.ts` - Clàusula verificació identitat
- [x] `backend/src/clauses/buyerSellerMatch.ts` - Clàusula match mutu (Contact.status === 'accepted')
- [x] `backend/src/clauses/index.ts` - Registre de clàusules
- [x] Afegir `is_private` al mapping d'Elasticsearch
- [x] Modificar `getPropertyById` - filtrar URLs condicionalment
- [x] Modificar `getProperties` - tractar propietats privades al llistat
- [x] Endpoint `GET /properties/:id/photo-access` - estat d'accés
- [x] Endpoint `POST /properties/:id/photo-access` - sol·licitar accés
- [x] Endpoint `GET /properties/clauses` - llistat de clàusules disponibles
- [x] Registrar noves rutes a `routes/properties.ts`

### Fase 3: Frontend - UI completa
- [x] `web/app/lib/clauses/types.ts` - Tipus frontend
- [x] `web/app/lib/clauses/index.ts` - Registre frontend
- [x] Component `ClauseSelectorPopup` - popup venedor al crear immoble
- [x] Component `RequirementsModal` - modal comprador al clicar ghost
- [x] Component `ClauseStatusItem` - fila d'estat d'una clàusula
- [x] Integrar `ClauseSelectorPopup` al formulari de creació
- [x] Integrar `RequirementsModal` al detall de propietat
- [x] Traduccions `clauses.*` a ca/es/en
- [x] Endpoint venedor: acceptar/rebutjar contactes

### Fase 4: Integració Stripe (diferida)
- [ ] Controller verificació Stripe Identity API
- [ ] Rutes de verificació
- [ ] Pàgina frontend de verificació Stripe
- [ ] Webhook Stripe per actualitzar `identityVerified`

---

## Pla d'implementació

### Fase 1: Ghost Photos (visual)

**Components nous**:

1. **`web/app/components/privacy/GhostImageOverlay.tsx`**
   - Fons gris (`bg-gray-200`) amb overlay semi-transparent
   - `LockClosedIcon` (Heroicon) centrat, blanc amb ombra
   - Text "Fotos privades" + comptador d'imatges ("5 fotos")
   - Hover: escala lleu + overlay més clar (indica clicabilitat)
   - Props: `totalImages`, `isMainSlot`, `onClick`, `className`

2. **`web/app/components/privacy/PrivatePropertyBadge.tsx`**
   - Badge per quan el comprador SÍ té accés (fotos visibles)
   - Variant `overlay`: pill al bottom-left de la imatge (cadenat + "Privat")
   - Variant `inline`: badge al costat del títol
   - Props: `variant: 'overlay' | 'inline'`

**Integració**:
- Detall: si `isPrivate && !photoAccess.granted` → `GhostImageOverlay` substitueix la galeria (línies 174-245)
- Llistat: si `isPrivate` → `GhostImageOverlay` a la card

### Fase 2: Backend - Sistema de clàusules (Registry Pattern)

**Estructura**:
```
backend/src/clauses/
  types.ts                    -- ClauseDefinition, ClauseCheckContext, AccessRequirements
  identityVerification.ts     -- checkSatisfied: User.identityVerified === true
  buyerSellerMatch.ts         -- checkSatisfied: Contact amb status 'accepted'
  index.ts                    -- clauseRegistry (Map), availableClauses (array)
```

**DB canvis**:
- Nou model `PropertyPhotoAccess` (cache d'accés concedit)
- Camp `status` a `Contact` amb default `"pending"` per match mutu

**API canvis**:
- `getPropertyById`: si `isPrivate` i no és propietari, comprovar `PropertyPhotoAccess`. Si no té accés → retornar imatges SENSE URLs + `photoAccess: { granted: false, requiredClauses: [...] }`
- `getProperties`: per propietats privades, eliminar URLs d'imatges al response
- `GET /properties/:id/photo-access`: retorna estat de cada clàusula
- `POST /properties/:id/photo-access`: re-verifica clàusules, si OK crea accés i retorna imatges
- `GET /properties/clauses`: metadata de clàusules per al frontend

### Fase 3: Frontend - UI completa

**Components nous**:

1. **`ClauseSelectorPopup`**: S'obre al marcar checkbox "Privat" al crear immoble. Llista clàusules amb checkbox. Mínim 1 seleccionada. Guarda a `formData.accessRequirements`.

2. **`RequirementsModal`**: S'obre al clicar foto ghost. Mostra estat de cada clàusula (completat/pendent) amb CTA. Quan tot complert → botó "Veure fotos" → POST photo-access → actualitzar imatges.

3. **`ClauseStatusItem`**: Fila reutilitzable amb icona + nom + estat.

**Registre frontend** (`web/app/lib/clauses/`): Mirror del backend amb `id`, `i18nKey`, `icon`, `order`, `actionType`.

### Fase 4: Integració Stripe (diferida)

Pendent. La clàusula `identity_verification` ja existirà al registre amb `checkSatisfied` que comprova `User.identityVerified`. La integració Stripe actualitzarà aquest camp.

---

## Fitxers afectats

| Fitxer | Acció | Fase | Estat |
|--------|-------|------|-------|
| `web/app/components/privacy/GhostImageOverlay.tsx` | CREAR | 1 | Completat |
| `web/app/components/privacy/PrivatePropertyBadge.tsx` | CREAR | 1 | Completat |
| `web/app/[locale]/properties/[id]/page.tsx` | MODIFICAR | 1,3 | Completat |
| `web/app/[locale]/properties/page.tsx` | MODIFICAR | 1 | Completat |
| `web/messages/ca.json` | MODIFICAR | 1,3 | Completat |
| `web/messages/es.json` | MODIFICAR | 1,3 | Completat |
| `web/messages/en.json` | MODIFICAR | 1,3 | Completat |
| `backend/prisma/schema.prisma` | MODIFICAR | 2 | Completat |
| `backend/src/clauses/types.ts` | CREAR | 2 | Completat |
| `backend/src/clauses/identityVerification.ts` | CREAR | 2 | Completat |
| `backend/src/clauses/buyerSellerMatch.ts` | CREAR | 2 | Completat |
| `backend/src/clauses/index.ts` | CREAR | 2 | Completat |
| `backend/src/controllers/propertyController.ts` | MODIFICAR | 2 | Completat |
| `backend/src/routes/properties.ts` | MODIFICAR | 2 | Completat |
| `backend/src/services/init.ts` | MODIFICAR | 2 | Completat |
| `web/app/lib/clauses/types.ts` | CREAR | 3 | Completat |
| `web/app/lib/clauses/index.ts` | CREAR | 3 | Completat |
| `web/app/components/privacy/ClauseSelectorPopup.tsx` | CREAR | 3 | Completat |
| `web/app/components/privacy/RequirementsModal.tsx` | CREAR | 3 | Completat |
| `web/app/components/privacy/ClauseStatusItem.tsx` | CREAR | 3 | Completat |
| `web/app/[locale]/properties/new/page.tsx` | MODIFICAR | 3 | Completat |
| `web/app/components/PropertyGrid.tsx` | MODIFICAR | 1 | Completat |

---

## Seguretat

- **URLs MinIO**: Públiques (bucket policy). Fase 1: no enviar URLs a usuaris no autoritzats (URL obscurity). Pre-producció: canviar a bucket privat + URLs presignades amb expiració.
- **Rate limiting**: Endpoint `POST /photo-access` amb rate limit per evitar brute-force.
- **Audit trail**: `PropertyPhotoAccess.grantedAt` per traçabilitat.

## Decisió: Match comprador-venedor

El match requereix **acceptació mútua**: el comprador envia contacte, el venedor ha d'acceptar explícitament. Implementat via camp `status` al model `Contact` (pending → accepted/rejected).

## Bugs Crítics Trobats i Corregits (2026-02-15)

### Bug 1: `createProperty` no escrivia `is_private` a Elasticsearch
- **Impacte**: Totes les propietats creades com a privades tenien `is_private: undefined` a ES
- **Causa arrel**: Dual storage (PG + ES) — el camp `isPrivate` s'escrivia a PostgreSQL però no al document ES
- **Fix**: Afegit `is_private: isPrivate` al document ES dins `createProperty`

### Bug 2: `updateProperty` no escrivia `is_private` a Elasticsearch
- **Impacte**: Canviar privacitat d'un immoble no es reflectia al llistat
- **Causa arrel**: Mateixa que Bug 1 — falta de sincronització dual-store
- **Fix**: Afegit `is_private: propertyData.isPrivate ?? property.isPrivate` al ES update

### Bug 3: `getProperties` depenia NOMÉS d'ES per `is_private`
- **Impacte**: Com que `is_private` mai s'escrivia a ES (bugs 1 i 2), totes les propietats es mostraven com a públiques al llistat
- **Causa arrel**: Conseqüència dels bugs 1 i 2. El codi de `getProperties` era correcte, però les dades a ES eren incorrectes
- **Fix**: Corregit implícitament pels fixes de bugs 1 i 2. Propietats existents necessiten reindexació.

### Lliçó apresa
> **REGLA DUAL-STORE**: Quan s'escriu un camp a PostgreSQL que també afecta el llistat (servit per ES), SEMPRE s'ha de sincronitzar a Elasticsearch al mateix moment. Revisar `createProperty` i `updateProperty` per qualsevol camp nou.

## Bug Fix: Propietats antigues sense `is_private` a ES (2026-02-17)

- **Problema**: Propietats creades abans del fix del 15/02 tenien `is_private: undefined` a ES (PG tenia `isPrivate: true`)
- **Impacte**: Usuaris anònims veien fotos privades al llistat (ES no tenia el camp)
- **Solució**: Funció `syncPrivacyToElasticsearch()` a `init.ts` — s'executa a cada arrencada del backend
- **Resultat**: Totes les propietats existents tenen `is_private` correcte a ES

## Dashboard Venedor (2026-02-17)

- **Pàgina**: `web/app/[locale]/dashboard/page.tsx` amb dos tabs
- **Tab Immobles**: Llista propietats del venedor amb dades enriquides (ES + PG), stats (visites, contactes, favorits), accions (veure, eliminar)
- **Tab Contactes**: Sol·licituds de contacte pendents/acceptades/rebutjades, amb accions acceptar/rebutjar
- **Backend**: `GET /me/properties` (enriquit amb ES data), `GET /me/contacts` (nou endpoint)
- **Navbar**: Hamburger menu convertit en menú d'usuari amb dropdown (Dashboard, Perfil, Tancar sessió)

## Peticions d'accés inline (2026-02-18)

- **Funcionalitat**: Per a propietats privades, les peticions d'accés (contactes pending) apareixen inline dins la card de la propietat al tab "Els meus immobles"
- **Badge "Privat"**: Badge indigo al costat del badge d'estat per propietats privades (`prop.isPrivate`)
- **AccessRequestsPanel**: Component inline amb icona de clau, llista de compradors pending, botons acceptar/rebutjar
- **Sempre visible**: La secció apareix per a totes les propietats privades (si no hi ha pending → "Cap petició pendent" en cursiva)
- **Filtrat client-side**: `contacts.filter(c => c.property.id === prop.id && c.status === 'pending')`
- **Fetch optimitzat**: `fetchContacts` sempre carrega TOTS els contactes (sense filtre API). El tab de contactes filtra client-side. Això garanteix que el panel inline tingui les dades correctes independentment del filtre actiu al tab.
- **Extensible**: Component `AccessRequestsPanel` rep `clauseType` param. Preparada per a futures clàusules (Stripe, identitat).

## Notes tècniques

- Clàusules al DB: `Property.accessRequirements = { clauses: ["identity_verification", "buyer_seller_match"] }`
- Camp `accessRequirements` (Json?) ja existeix al schema
- Camp `isPrivate` (Boolean) ja existeix al schema
- Elasticsearch necessita `is_private` al mapping per filtratge eficient al llistat
- Propietari sempre veu les seves fotos normalment
- Usuaris anònims sempre veuen ghost (endpoint usa `optionalAuth`)
- **IMPORTANT**: Qualsevol camp nou a PG que afecti el llistat ha de sincronitzar-se a ES (create + update)
