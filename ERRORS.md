# Errors i Bugs Detectats - Real Estate POC

Documentació dels bugs detectats durant les proves amb Playwright i les correccions aplicades.

## Bugs Arreglats

### 1. Pàgina de Detall de Propietat - Paràmetres no resolts

**Fitxer:** `web/app/properties/[id]/page.tsx`

**Problema:** En Next.js 15+, el paràmetre `params` de les pàgines dinàmiques és una Promise i s'ha d'esperar. El codi accedia directament a `params.id` sense esperar, causant l'error:
```
A param property was accessed directly
api/properties/undefined - 404
```

**Solució:** Utilitzar el hook `use()` de React per desempaquetar la Promise:
```tsx
import { use } from "react";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    // ...
}
```

---

### 2. Botó "View Details" sense funcionalitat

**Fitxer:** `web/app/components/PropertyGrid.tsx`

**Problema:** El botó "View Details" a les targetes de propietats no tenia cap handler `onClick` ni navegació, fent que no passés res al fer clic.

**Solució:** Reemplaçar el `<button>` per un `<Link>` de Next.js que navega a `/properties/{id}`:
```tsx
<Link
    href={`/properties/${property.id}`}
    className="block w-full mt-2 ..."
>
    View Details
</Link>
```

---

### 3. Camps de Ubicació sense valors per defecte

**Fitxer:** `web/app/properties/new/page.tsx`

**Problema:** Els camps de municipi, província i comunitat autònoma mostraven text de placeholder ("Barcelona", "Catalunya") però tenien valors buits per defecte. Això confonia els usuaris que pensaven que estaven omplerts.

**Solució:** Afegir valors per defecte al formulari:
```tsx
const [formData, setFormData] = useState({
    // ...
    municipality: "Barcelona",
    province: "Barcelona",
    autonomous_community: "Catalunya",
    // ...
});
```

---

### 4. Mixed Content - URLs d'Imatges amb HTTP

**Fitxer:** `backend/src/controllers/propertyController.ts`

**Problema:** Les URLs de les imatges pujades a MinIO utilitzaven sempre `http://`, causant advertències de Mixed Content quan el frontend es serveix per HTTPS.

**Solució:** Afegir suport per protocol configurable via variable d'entorn:
```typescript
const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
const viewUrl = `${protocol}://${endpoint}:${port}/${MINIO_BUCKET}/${filename}`;
```

**Configuració necessària:** Afegir `MINIO_USE_SSL=true` al `.env` del backend quan s'utilitzi HTTPS.

---

### 5. IDs inconsistents entre Elasticsearch i PostgreSQL

**Fitxer:** `backend/src/controllers/propertyController.ts`

**Problema:** El llistat de propietats (`getProperties`) retorna l'ID d'Elasticsearch, però el detall (`getPropertyById`) buscava només per l'ID de PostgreSQL, causant errors 404.

**Solució:** Modificar `getPropertyById` per buscar primer per ID de PostgreSQL i, si no es troba, buscar per `elasticsearchId`. També corregir l'ús de l'ID correcte per crear PropertyView:
```typescript
// Try to find by PostgreSQL ID first, then by Elasticsearch ID
let property = await prisma.property.findUnique({
    where: { id },
    // ...
});

if (!property) {
    property = await prisma.property.findFirst({
        where: { elasticsearchId: id },
        // ...
    });
}

// Use property.id (PostgreSQL) not the param id (could be ES ID)
await prisma.propertyView.create({
    data: { propertyId: property.id, ... }
});
```

---

### 6. Estructura de dades inconsistent entre backend i frontend

**Fitxer:** `web/app/properties/[id]/page.tsx`

**Problema:** El frontend esperava les dades dins d'un objecte `data` (`property.data.basic_info`), però el backend retorna les dades a l'arrel (`property.basic_info`).

**Solució:** Actualitzar la interfície i les referències:
```typescript
// Abans
interface PropertyDetail {
    data: { basic_info: {...}, ... };
}
property.data.basic_info.title

// Després
interface PropertyDetail {
    basic_info: {...};
    // ...
}
property.basic_info.title
```

---

## Bugs Pendents / A Revisar

### 7. Sessió perduda al navegar

**Problema:** Durant les proves amb Playwright, la sessió de l'usuari es perdia al navegar amb `page.goto()`. Això pot ser degut a:
- Configuració de cookies de sessió (SameSite, Secure)
- Certificat SSL self-signed no acceptat
- NEXTAUTH_SECRET no configurat correctament

**Recomanacions:**
1. Verificar que `NEXTAUTH_SECRET` està configurat
2. Revisar la configuració de cookies a `authOptions`
3. Considerar afegir `secure: false` en desenvolupament

---

### 8. Certificat SSL Self-Signed

**Problema:** L'aplicació utilitza un certificat SSL self-signed que requereix acceptació manual al navegador. Playwright rebutja la connexió per defecte.

**Recomanacions:**
1. Utilitzar `mkcert` per generar certificats locals de confiança
2. O configurar Playwright per ignorar errors de certificat (només per testing)

---

### 9. Validació de Formularis sense Feedback Visual

**Problema:** El formulari de nova propietat utilitza validació HTML5 nativa (`required`), però no hi ha feedback visual clar quan un camp és invàlid.

**Recomanacions:**
1. Afegir estils CSS per camps invàlids (`:invalid`)
2. Mostrar missatges d'error sota cada camp
3. Considerar una llibreria de formularis com React Hook Form

---

## Variables d'Entorn Recomanades

### Backend (.env)
```env
MINIO_USE_SSL=true  # Per produir URLs HTTPS per les imatges
```

### Frontend (.env.local)
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://localhost
```

---

## Proves Realitzades

- [x] Navegació a la pàgina principal
- [x] Llistat de propietats
- [x] Cercador de propietats
- [x] Login Demo
- [x] Navegació autenticada
- [x] Formulari de nova propietat (valors per defecte verificats)
- [x] Detall de propietat (arreglat i verificat!)
- [x] Botó View Details (ara és un Link funcional)
- [ ] Creació de propietat (requereix imatges)
- [ ] Logout

---

*Document generat: 2026-01-30*
