# ⚠️ Zitadel: Configuració Pendent

## Estat Actual

🟡 **Zitadel està funcionant però NO configurat per la POC**

- ✅ Contenidor Docker: Operatiu
- ✅ OIDC Endpoints: Disponibles
- ❌ Aplicació OIDC: No creada
- ❌ Accés UI: No disponible en aquest entorn

---

## 🔄 Solució Temporal: Demo Login

Mentre Zitadel no estigui completament configurat, la POC usa **Demo Login**:

- Qualsevol email/password funciona
- Mock JWT (no validat contra Zitadel)
- Suficient per testejar la UI i funcionalitat

---

## 🎯 Per Activar Zitadel OIDC (Futur)

### Requisits:
1. Accés a la UI de Zitadel (http://localhost:8080)
2. Crear aplicació OIDC manualment
3. Configurar CLIENT_ID i CLIENT_SECRET

### Passos:
Veure guia completa: `infra/ZITADEL_SETUP.md`

---

## 📊 Comparativa

| Aspecte | Demo Login | Zitadel OIDC |
|---------|-----------|--------------|
| Estat | ✅ Actiu | ⏳ Pendent config |
| Seguretat | ⚠️ Mock | ✅ Real |
| JWT | Mock | Real (validat) |
| Usuaris | Qualsevol | Gestionats |
| Producció | ❌ No | ✅ Sí |

---

## 🚀 Com Usar Ara

1. Ves a http://localhost:3000
2. Clica "Iniciar Sessió"
3. Introdueix qualsevol email/password
4. Gaudeix de la POC! 🎉

---

**Nota**: Zitadel està preparat i funcionant. Només cal configurar l'aplicació OIDC quan tinguis accés a la UI.
