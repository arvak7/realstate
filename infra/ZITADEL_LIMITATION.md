# ⚠️ Limitació de Zitadel en Aquest Entorn

## Problema Identificat

Zitadel **NO és accessible** en aquest entorn per les següents raons:

1. **La UI de Zitadel també usa OIDC** - La consola web està protegida per OAuth
2. **Requereix HTTPS per defecte** - Fins i tot amb `--tlsMode disabled`
3. **Dev Mode només es pot activar des de la UI** - Problema circular
4. **No hi ha accés directe al navegador** - Entorn remot/contenidor

### Error Persistent:
```
"This client's redirect_uri is http and is not allowed"
```

Aquest error apareix perquè:
- La consola de Zitadel intenta redirigir amb HTTP
- Però la seva pròpia aplicació OIDC interna no té Dev Mode activat
- No podem activar Dev Mode sense accedir a la UI
- No podem accedir a la UI sense Dev Mode

---

## ✅ Solució Adoptada: Demo Login

Per aquesta POC, hem optat per **Demo Login** com a solució d'autenticació:

### Avantatges:
- ✅ Funciona immediatament
- ✅ No requereix configuració externa
- ✅ Suficient per validar la POC
- ✅ Fàcil de testejar

### Limitacions:
- ⚠️ No és autenticació real
- ⚠️ JWT mock (no validat)
- ⚠️ No apte per producció

---

## 🔄 Alternatives per Producció

Quan es desplegui en un entorn real, es pot usar:

### 1. **Zitadel amb HTTPS**
- Desplegar amb certificat SSL real
- Accés directe a la UI
- Configuració OIDC completa

### 2. **Auth0 / Okta**
- Serveis SaaS gestionats
- Configuració via UI web accessible
- Més fàcil de configurar

### 3. **Keycloak**
- Alternativa open-source
- UI més accessible
- Menys restrictiu amb HTTP en dev

### 4. **NextAuth amb altres providers**
- Google OAuth
- GitHub OAuth
- Credentials amb BD real

---

## 📊 Estat Actual del Projecte

| Component | Estat | Notes |
|-----------|-------|-------|
| Backend API | ✅ Funcionant | Port 3001 |
| Web Frontend | ✅ Funcionant | Port 3000 |
| Demo Login | ✅ Actiu | Qualsevol email/pass |
| Zitadel Container | ✅ Running | Port 8080 |
| Zitadel UI | ❌ No accessible | Limitació entorn |
| Zitadel OIDC | ❌ No configurat | Requereix UI |

---

## 🎯 Recomanació

Per aquesta **POC**, mantenir **Demo Login** és la millor opció:

1. Permet validar tota la funcionalitat
2. No bloqueja el desenvolupament
3. Es pot substituir fàcilment en futur
4. Compleix els objectius de la POC

**Conclusió**: Zitadel està preparat i funcionant, però la seva configuració requereix un entorn amb accés directe al navegador i idealment HTTPS.

---

## 📝 Documentació Actualitzada

- `README.md` - Reflecteix Demo Login com a opció principal
- `REQUISITS_FUNCIONALS.md` - RF-002 marcat com implementat amb Demo
- Aquest document - Explica la limitació i solució

---

**Data**: 2026-01-25  
**Decisió**: Usar Demo Login per la POC, Zitadel per producció futura
