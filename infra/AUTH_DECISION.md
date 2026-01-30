# Decisió: Demo Login com a Solució d'Autenticació per la POC

## Context

Després de múltiples intents de configurar Zitadel amb HTTPS, hem trobat problemes persistents:

1. **Error "Not Found"**: Zitadel no pot trobar la instància configurada
2. **Complexitat de configuració**: Requereix configuració manual via UI que no és accessible en aquest entorn
3. **Problemes de domini**: Conflictes entre `EXTERNALDOMAIN`, `EXTERNALPORT` i `EXTERNALPROTOCOL`

## Decisió

**Utilitzar Demo Login com a solució d'autenticació permanent per aquesta POC.**

### Justificació

1. ✅ **Funcional**: Demo Login funciona perfectament ara mateix
2. ✅ **Suficient per POC**: Permet validar tota la funcionalitat de l'aplicació
3. ✅ **Fàcil de substituir**: Es pot canviar a Zitadel/Auth0/altres en futur
4. ✅ **No bloqueja desenvolupament**: Podem continuar amb altres funcionalitats
5. ✅ **Temps invertit**: Hem dedicat >2h a Zitadel sense èxit

### Alternatives Considerades

| Opció | Pros | Cons | Decisió |
|-------|------|------|---------|
| **Demo Login** | Funciona, simple, ràpid | No és autenticació real | ✅ **SELECCIONAT** |
| Zitadel OIDC | Autenticació real, completa | No funciona en aquest entorn | ❌ Descartat |
| Auth0 | Fàcil configuració, SaaS | Requereix compte extern | ⏳ Futur |
| Keycloak | Open-source, flexible | Configuració complexa | ⏳ Futur |

---

## Implementació Actual

### Demo Login

**Ubicació**: `web/app/api/auth/[...nextauth]/route.ts`

**Funcionament**:
- Qualsevol email/password funciona
- Genera mock JWT
- Sessió vàlida per tota l'aplicació

**Pàgina de login**: `web/app/auth/signin/page.tsx`

---

## Pla per Producció

Quan es desplegui en producció, es pot substituir Demo Login per:

### Opció 1: Zitadel amb HTTPS Real

```typescript
// Reactivar provider Zitadel
ZitadelProvider({
  issuer: process.env.ZITADEL_ISSUER,
  clientId: process.env.ZITADEL_CLIENT_ID,
  clientSecret: process.env.ZITADEL_CLIENT_SECRET,
})
```

### Opció 2: Auth0

```typescript
import Auth0Provider from "next-auth/providers/auth0";

Auth0Provider({
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuer: process.env.AUTH0_ISSUER,
})
```

### Opció 3: Google/GitHub OAuth

```typescript
import GoogleProvider from "next-auth/providers/google";

GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
})
```

---

## Estat de Zitadel

- ✅ Contenidor Docker: Funcionant
- ✅ Base de dades: Inicialitzada
- ✅ HTTPS via Caddy: Configurat
- ❌ Consola UI: No accessible (error "Not Found")
- ❌ Aplicació OIDC: No es pot crear sense UI

**Conclusió**: Zitadel està preparat tècnicament però no és accessible en aquest entorn de desenvolupament.

---

## Documentació Actualitzada

- ✅ `README.md` - Reflecteix Demo Login
- ✅ `REQUISITS_FUNCIONALS.md` - RF-002 amb Demo Login
- ✅ `infra/ZITADEL_LIMITATION.md` - Explica limitacions
- ✅ Aquest document - Decisió tècnica documentada

---

**Data**: 2026-01-26  
**Decisió**: Demo Login per POC, Zitadel/Auth0 per producció  
**Estat**: ✅ Implementat i funcionant
