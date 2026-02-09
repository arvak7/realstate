# Feature: Zitadel com a Identity Broker

**Estat**: EN VERIFICACIÓ
**Data inici**: 2026-02-07

## Per què

L'auth actual només funciona amb demo-token. Google OAuth falla perquè el backend valida tokens contra Zitadel, però rep tokens de Google. A més, els usuaris OAuth no es creen a la BD, causant errors FK en crear propietats.

## Objectiu

Zitadel actua com a broker: Google OAuth passa per Zitadel, que emet els seus propis JWT. El backend ja sap validar-los. Els usuaris es creen automàticament a la BD al primer request autenticat.

---

## Pla d'implementació

### Fase 1: Script de configuració Zitadel (`infra/setup-zitadel.sh`) ✅

Zitadel es configura via Management API amb un PAT (Personal Access Token) creat automàticament al primer init:

1. **Machine user + PAT**: docker-compose.yml configura `ZITADEL_FIRSTINSTANCE_PATPATH` i `ZITADEL_FIRSTINSTANCE_ORG_MACHINE_*` per crear un machine user IAM_OWNER amb PAT al primer arrencament
2. L'script llegeix el PAT de `infra/machinekey/admin.pat`
3. Crea projecte "RealEstate" via Management API
4. Crea app OIDC web amb redirect URIs per localhost
5. Afegeix Google com a IdP extern
6. Activa Google IdP al login policy
7. Escriu credencials als `.env` del backend i frontend

**Notes**: Connexió directa HTTP port 8080 (no Caddy/TLS) per simplicitat. Flag `infra/.zitadel-configured` evita re-execucions.

### Fase 2: Auto-provisió d'usuaris (`backend/src/middleware/auth.ts`) ✅

Després de JWT validation exitosa:
- Extreure sub, email, name del payload
- `prisma.user.upsert({ where: { id: sub }, create: {...}, update: {...} })`
- Cache en memòria (5 min) per evitar upsert cada request
- Handle email unique constraint (crear amb email temporal si conflicte)
- No trencar el request si upsert falla (log + continue)

### Fase 3: Actualitzar NextAuth (`web/app/api/auth/[...nextauth]/route.ts`) ✅

- ZitadelProvider com a provider principal
- Mantenir CredentialsProvider "demo" per dev
- Token refresh via refresh_token grant
- Captura d'imatge de perfil OAuth

### Fase 4: UI Login (`web/app/[locale]/auth/signin/page.tsx`) ✅

- Botó "Iniciar Sessió" (via Zitadel - mostra Google i altres opcions)
- Formulari demo per dev
- Separador visual "o bé"

### Fase 5: Entorn i infra ✅

- `web/.env.local`: credencials Zitadel actualitzades per setup-zitadel.sh
- `backend/.env`: ZITADEL_ISSUER + ZITADEL_AUDIENCE
- `docker-compose.yml`: healthcheck Zitadel + machine user PAT
- `start-all.sh`: crida condicional a setup-zitadel.sh (flag check)

### Fase 6: Documentació ✅

- CLAUDE.md actualitzat
- Feature doc (aquest fitxer)

---

## Fitxers afectats

| Fitxer | Acció | Estat |
|--------|-------|-------|
| `infra/setup-zitadel.sh` | CREAT | ✅ |
| `infra/docker-compose.yml` | MODIFICAT (healthcheck + machine user) | ✅ |
| `infra/machinekey/admin.pat` | GENERAT per Zitadel | ✅ |
| `backend/src/middleware/auth.ts` | MODIFICAT (auto-provisió) | ✅ |
| `web/app/api/auth/[...nextauth]/route.ts` | MODIFICAT (ZitadelProvider) | ✅ |
| `web/app/[locale]/auth/signin/page.tsx` | MODIFICAT (UI unificada) | ✅ |
| `web/.env.local` | MODIFICAT (credencials) | ✅ |
| `backend/.env` | MODIFICAT (audience + issuer) | ✅ |
| `start-all.sh` | MODIFICAT (step setup condicional) | ✅ |

---

## Detalls tècnics importants

### Zitadel API Auth Bootstrap (RESOLT)
Problema circular: necessites auth per la API, però necessites la API per crear auth.
**Solució**: `ZITADEL_FIRSTINSTANCE_PATPATH` + machine user env vars al docker-compose. Zitadel crea el PAT al primer init i l'escriu a `infra/machinekey/admin.pat`. L'script el llegeix directament.

### Issuer URL
Zitadel funciona en mode HTTP (port 8080, `ExternalSecure: false`). L'issuer als JWT és `http://localhost:8080`. Els `.env` han de coincidir amb aquest valor per a que la validació JWT funcioni.

### User ID Mapping
Zitadel `sub` (string numèric com "273955500988334084") s'usa directament com a User.id a Prisma. El camp és String, no UUID, així que és compatible.

### Email Unique Constraint
Si un demo user ja té l'email i un Zitadel user arriba amb el mateix, hi haurà conflicte. Solució: catch P2002 error i crear amb email temporal.

### Token Refresh
Zitadel access tokens expiren (default 12h). NextAuth guarda refresh_token al JWT callback i refresca quan expira.

### Flux d'execució
```
1. start-all.sh arrenca Docker
2. Zitadel init → crea machine user + PAT (primer cop)
3. setup-zitadel.sh → llegeix PAT → configura projecte/app/Google IdP → escriu .env
4. Backend arrenca → express-oauth2-jwt-bearer valida contra http://localhost:8080
5. Frontend arrenca → NextAuth ZitadelProvider redirigeix a Zitadel login
6. User fa login → Zitadel emet JWT → Backend valida → User auto-creat a BD
```

---

## Problemes coneguts i solucions

### 1. "code 5 Not Found" al fer login (2026-02-08)
**Causa**: La Login Policy de Zitadel referenciava un Google IdP (ID) que ja no existia a la BD.
Això passa si el container de Zitadel es recrea sense que el Google IdP persisteixi.

**Solució**:
```bash
# 1. Treure referència òrfena de la login policy
PAT=$(cat infra/machinekey/admin.pat)
curl -X DELETE "http://localhost:8080/management/v1/policies/login/idps/<OLD_IDP_ID>" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  -d '{"idpId":"<OLD_IDP_ID>"}'

# 2. Re-executar setup
rm infra/.zitadel-configured && bash infra/setup-zitadel.sh
```

### 2. docker-compose 1.25.0 trencat (conflicte Python urllib3)
**Causa**: La versió sistema de docker-compose (1.25.0) té conflicte amb urllib3.
**Solució**: Usar el binari modern a `tools/docker-compose` (v2.29.1). L'script `start-all.sh` ja el detecta.

### 3. `start_period` no suportat
**Causa**: docker-compose 1.25.0 no suporta `start_period` al healthcheck.
**Solució**: Tret del docker-compose.yml. Alternativa: usar `tools/docker-compose`.

### 4. Login V2 UI 404 (Zitadel v4+)
**Causa**: Zitadel v4 va separar el login UI v2 en un container Next.js apart. El Docker image estàndard ja no l'inclou, però l'authorize endpoint hi redirigeix → 404.
**Solució**: Desactivar Login V2 via API (setup-zitadel.sh ho fa automàticament):
```bash
curl -X PUT "http://localhost:8080/v2/features/instance" \
  -H "Authorization: Bearer $PAT" \
  -d '{"loginV2": {"required": false}}'
```
Ref: https://github.com/zitadel/zitadel/issues/10526

### 5. Protocol HTTP vs HTTPS
**Regla**: Zitadel corre en HTTP pur (port 8080). Tots els `.env` han de tenir `http://localhost:8080`.
El fallback per defecte al codi NextAuth és `https://localhost:8080` → **canviar-lo a `http://localhost:8080`** si es modifica.
Caddy fa proxy HTTPS a 8443 però NextAuth parla directament a HTTP 8080.

---

## URLs i ports (referència ràpida)

| Component | URL | Protocol |
|-----------|-----|----------|
| Zitadel (directe) | `http://localhost:8080` | HTTP |
| Zitadel (via Caddy) | `https://localhost:8443` | HTTPS |
| Frontend | `https://localhost` | HTTPS (Caddy) |
| Backend API | `https://localhost/api` | HTTPS (Caddy → 3002) |
| OIDC Discovery | `http://localhost:8080/.well-known/openid-configuration` | HTTP |
| Redirect URI | `https://localhost/api/auth/callback/zitadel` | HTTPS |

---

## Verificació pendent

1. ~~`./start-all.sh` → setup-zitadel s'executa sense errors~~ ✅ (script manual OK)
2. Login → botó "Iniciar Sessió" → redirecció a Zitadel → opció Google
3. Login amb Google → sessió vàlida al frontend
4. Usuari creat a taula User (verificar amb Prisma Studio)
5. Crear propietat → funciona sense error FK
6. Demo login segueix funcionant
