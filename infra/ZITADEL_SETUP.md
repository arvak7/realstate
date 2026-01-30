# Configuració de Zitadel per Real Estate POC

## ✅ Estat: Zitadel Funcionant

Zitadel està funcionant a: **http://localhost:8080**

### Credencials d'Administrador
- **Username**: `admin`
- **Password**: `Admin123!`

---

## 📋 Passos per Configurar OIDC

### 1. Accedir a Zitadel
Obre el navegador a: http://localhost:8080

### 2. Iniciar Sessió
- Username: `admin`
- Password: `Admin123!`

### 3. Crear un Projecte
1. Ves a **Organization** (menú lateral)
2. Clica **Projects**
3. Clica **Create New Project**
4. Nom: `RealEstate POC`
5. Clica **Continue**

### 4. Crear una Aplicació Web
1. Dins del projecte, clica **New**
2. Selecciona **WEB**
3. Configura:
   - **Name**: `RealEstate Web`
   - **Authentication Method**: `CODE` (Authorization Code Flow)

### 5. Configurar Redirect URIs
Afegeix els següents URIs:

**Redirect URIs**:
```
http://localhost:3000/api/auth/callback/zitadel
```

**Post Logout Redirect URIs**:
```
http://localhost:3000
```

### 6. Activar Dev Mode
- Marca **Dev Mode** com a **ENABLED**
  (Això permet usar HTTP en lloc de HTTPS per localhost)

### 7. Guardar i Copiar Credencials
1. Clica **Create**
2. **IMPORTANT**: Copia el **Client ID** i **Client Secret** que es mostren
3. Guarda'ls en un lloc segur (només es mostren una vegada)

### 8. Actualitzar .env.local
Edita el fitxer `/home/manel/dev/realState/web/.env.local`:

```bash
ZITADEL_ISSUER=http://localhost:8080
ZITADEL_CLIENT_ID=<el_teu_client_id_aqui>
ZITADEL_CLIENT_SECRET=<el_teu_client_secret_aqui>
```

### 9. Reiniciar el Servidor Web
```bash
cd /home/manel/dev/realState/web
# Atura el servidor actual (Ctrl+C)
npm run dev
```

---

## 🧪 Verificar que Funciona

1. Obre http://localhost:3000
2. Clica **Iniciar Sessió**
3. Clica **🔐 Iniciar Sessió amb Zitadel**
4. Hauries de ser redirigit a Zitadel
5. Inicia sessió amb `admin` / `Admin123!`
6. Autoritza l'aplicació
7. Hauries de tornar a la web autenticat

---

## 🔧 Troubleshooting

### Error: redirect_uri_mismatch
- Verifica que el Redirect URI a Zitadel sigui exactament:
  `http://localhost:3000/api/auth/callback/zitadel`

### Error: invalid_client
- Verifica que CLIENT_ID i CLIENT_SECRET siguin correctes a `.env.local`
- Reinicia el servidor web després de canviar `.env.local`

### Error: HTTPS required
- Assegura't que **Dev Mode** estigui **ENABLED** a Zitadel

---

## 📝 Opcions de Login Disponibles

Actualment tens **2 opcions** per iniciar sessió:

1. **Zitadel OIDC** (recomanat per producció)
   - Requereix configuració prèvia
   - Autenticació real amb JWT
   
2. **Demo Login** (només per testing)
   - Qualsevol email/password funciona
   - Mock JWT (no real)

---

## 🎯 Pròxims Passos

Després de configurar Zitadel:

1. **Crear usuaris de prova** a Zitadel
2. **Testejar el flux complet** web + mobile
3. **Configurar roles i permisos** (opcional)
4. **Desactivar Demo Login** en producció

---

**Data**: 2026-01-25  
**Versió Zitadel**: latest (ghcr.io/zitadel/zitadel:latest)
