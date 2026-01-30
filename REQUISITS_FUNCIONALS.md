# Requisits Funcionals - Real Estate Platform

> **Última actualització**: 2026-01-27
> 
> **Estat**: Especificació completa rebuda

---

## 0. Objectiu i Abast

### Plataforma d'Anuncis d'Immobles

Plataforma multi-canal per a la compra-venda d'immobles amb:

- **Web** (primera fase - prioritat alta)
- **App Mòbil** (Android i iOS en fases posteriors)

### Arquitectura Unificada

✅ **Un únic backend i API** per suportar tots els fluxos:
- Mateixa lògica de negoci
- Mateixos permisos
- Mateixos contractes (versionat si cal)

---

## 1. Rols i Permisos

### 1.1 Usuari (Rol Únic)

**No hi ha separació entre "comprador" i "venedor"**. Tots els usuaris poden:

- ✅ Navegar i cercar immobles
- ✅ Contactar (segons permisos)
- ✅ Publicar immobles a la venda
- ✅ Gestionar els seus immobles (CRUD, estat, fotos, verificacions)

### 1.2 Admin

Rol especial per a **moderació i gestió**:

- Gestió de fotos (revisar/validar/retirar)
- Gestió de verificacions (identitat i propietat)
- Accions administratives sobre immobles i usuaris

---

## 2. Autenticació i Control d'Accés

### 2.1 Mètodes de Login

El sistema permet login amb:

1. **Google** (OAuth)
2. **Facebook** (OAuth)
3. **Compte propi** (email/password)

### 2.2 Restriccions per Contingut Sensible

#### Fotos
- ❌ **Sense login**: No es poden veure fotos
- ✅ **Amb login**: Es poden veure fotos (segons tipus d'immoble)

#### Dades de Contacte
- ❌ **Sense login**: No es pot accedir al contacte
- ✅ **Amb login**: Es pot accedir al contacte (segons requisits d'accés de l'immoble)

### 2.3 Comportament Sense Login

Els usuaris **no autenticats** poden:

- ✅ Veure llistats d'immobles
- ✅ Veure informació bàsica (títol, preu, ubicació, característiques)
- ❌ NO poden veure fotos
- ❌ NO poden accedir al contacte

---

## 3. Tipus d'Immobles i Visibilitat

### 3.1 Immobles Públics

**Característiques**:
- Visibles en navegació i cerca
- Fotos visibles per usuaris autenticats
- Contacte accessible per usuaris autenticats

### 3.2 Immobles Privats

**Característiques**:
- Visibles en navegació i cerca (informació bàsica)
- L'usuari que publica pot definir **requisits d'accés** per:
  - Accés a fotos
  - Accés al contacte

> [!WARNING]
> **Decisió Pendent**: Definir regles exactes d'accés per immobles privats (què veu un usuari loguejat i sota quines condicions)

---

## 4. Publicació i Gestió d'Immobles

### 4.1 Crear / Editar Immoble

Qualsevol usuari autenticat pot:

- ✅ Crear un immoble
- ✅ Editar-lo
- ✅ Afegir/treure fotos
- ✅ Definir si és públic o privat
- ✅ Configurar requisits d'accés (si és privat)

### 4.2 Gestió de "Les Meves Propietats"

L'usuari té un espai personal per:

- Veure els seus anuncis
- Canviar estat (actiu / pausat / tancat)
- Consultar estat de verificacions
- Gestionar contacte i requisits d'accés

---

## 5. Dades Requerides per a un Immoble

### 5.1 Informació Bàsica

| Camp | Tipus | Obligatori |
|------|-------|------------|
| Tipus d'immoble | Enum | ✅ Sí |
| Habitacions | Number | ✅ Sí |
| Metres quadrats | Number | ✅ Sí |
| Preu | Number | ✅ Sí |

**Tipus d'immoble** (mínim):
- Casa o xalet
- Pis
- Àtic
- Estudi
- Altres (extensible)

### 5.2 Ubicació

**Opció Preferent**:
- 📍 Ubicació via mapa (coordenades GPS)

**Alternativa/Suport**:
- Comunitat autònoma
- Província
- Municipi

### 5.3 Característiques

| Camp | Tipus | Obligatori |
|------|-------|------------|
| Número de plantes | Number | ⚪ Opcional |
| Orientació | Enum (Nord, Sud, Est, Oest) | ⚪ Opcional |
| Estat | Enum (Nou, Casi nou, Bon estat, A reformar) | ⚪ Opcional |
| Antiguitat | Range (ex: 1-5 anys) | ⚪ Opcional |
| Ascensor | Boolean | ⚪ Opcional |
| Amoblat | Boolean | ⚪ Opcional |

### 5.4 Eficiència Energètica

| Camp | Tipus | Obligatori |
|------|-------|------------|
| Etiqueta energètica | Enum (A, B, C, D, E, F, G) | ⚪ Opcional |
| Emissions CO₂ | Number (kg CO₂/m²/any) | ⚪ Opcional |

### 5.5 Etiquetes (Tags)

Sistema d'etiquetes **extensible**. Exemples:

- Terrassa
- Aire condicionat (A/C)
- Piscina
- Garatge
- Traster
- Jardí
- Balcó
- Calefacció
- Parquet
- Armaris encastats

### 5.6 Altres

| Camp | Tipus | Obligatori |
|------|-------|------------|
| Renda vitalícia | Boolean | ⚪ Opcional |

### 5.7 Descripcions

- **Descripció**: Text lliure (opcional)
- Permet a l'usuari afegir informació addicional

---

## 6. Valoracions (Reputació)

### Sistema de Valoració Usuari ↔ Usuari

**Característiques**:
- Valoració associada a una **interacció** (contacte, visita, transacció)
- No hi ha rols: és usuari ↔ usuari
- Permet construir reputació

> [!WARNING]
> **Decisió Pendent**: Definir quan es pot valorar, què es valora, i escales (1-5 estrelles, etc.)

---

## 7. Serveis Addicionals

El sistema pot oferir **serveis premium**:

### 7.1 Fotos Professionals

- Sol·licitat per l'usuari
- Queda reflectit a l'anunci (badge)

### 7.2 Verificació de Propietat

- Sol·licitat per l'usuari
- Queda reflectit a l'anunci (badge de verificat)

---

## 8. Verificacions i Confiança

### 8.1 Verificació d'Identitat

**Mètode**: Verificació de DNI via **Stripe Identity**

**Flux**:
1. Captura/foto del DNI
2. Validació automàtica
3. Estat: Pendent / Validat / Rebutjat

### 8.2 Verificació de Propietat

**Documentació requerida**:
- DNI del propietari
- IBI (Impost sobre Béns Immobles) o equivalent

**Associació**:
- Verificació associada a un **usuari**
- I/o a un **immoble concret** (segons disseny)

---

## 9. Admin Panel

### 9.1 Funcionalitat Mínima

#### Gestió de Fotos
- Revisar fotos pujades
- Validar fotos
- Rebutjar/retirar fotos inadequades

#### Gestió de Verificacions
- Revisar casos pendents
- Aprovar/rebutjar verificacions
- Traça d'estat (audit log)

#### Accions Administratives
- Gestió d'usuaris (suspendre, eliminar)
- Gestió d'immobles (retirar, destacar)

---

## 10. Mètriques i Analítica

### 10.1 Mètriques Generals

| Mètrica | Descripció |
|---------|------------|
| Visites per immoble | Comptador de visualitzacions |
| Interaccions de contacte | Clics / intents de contacte |
| Conversió anònim → login | Taxa de registre |
| Conversió login → contacte | Taxa d'engagement |
| Ús de filtres i cerques | Patrons de cerca |

### 10.2 Mètriques Específiques de Login

| Mètrica | Descripció |
|---------|------------|
| Taxa d'èxit de login | % logins exitosos |
| Taxa d'abandonament | % usuaris que abandonen el flux |
| Mètode de login | Google / Facebook / Compte propi |

---

## 11. Requisits Tècnics Clau

### 11.1 API Única per Web i Mòbil

✅ **Un sol backend i API** per:
- Web
- Android
- iOS

**Garanties**:
- Mateixos permisos i lògica de negoci
- Contractes estables
- Versionat d'API si cal

### 11.2 Seguretat i Permisos

Control d'accés centralitzat per:
- Fotos
- Contacte
- Immobles privats i requisits d'accés

### 11.3 Emmagatzematge de Dades

#### PostgreSQL
Dades estructurades:
- Usuaris
- Autenticació
- Transaccions
- Verificacions
- Valoracions

#### Elasticsearch
Dades d'immobles:
- Informació completa de propietats
- Cerca avançada
- Filtres i agregacions
- **Preparació per RAG** (Retrieval-Augmented Generation)
  - Embeddings vectorials
  - Cerca semàntica

---

## 12. Decisions Pendents

> [!CAUTION]
> Les següents decisions requereixen clarificació abans de la implementació:

### 12.1 Immobles Privats
**Pregunta**: Quines són les regles finals d'accés per immobles privats?
- Què veu un usuari loguejat?
- Sota quines condicions pot accedir a fotos i contacte?

### 12.2 Sistema de Valoracions
**Pregunta**: Definició exacta del sistema de valoracions:
- Quan s'activa la valoració? (després de contacte, visita, transacció?)
- Amb quins criteris? (1-5 estrelles, comentaris, categories?)
- És bidireccional obligatori?

### 12.3 Informació Bàsica Sense Login
**Pregunta**: Quin és el mínim viable d'informació mostrada sense login?
- Només títol i preu?
- Inclou ubicació aproximada?
- Inclou característiques bàsiques?

---

## 📊 Resum de Complexitat

| Àrea | Complexitat | Prioritat |
|------|-------------|-----------|
| Autenticació multi-proveïdor | Alta | Crítica |
| Sistema de permisos | Alta | Crítica |
| Gestió d'immobles | Mitjana | Crítica |
| Cerca amb Elasticsearch | Alta | Alta |
| Verificacions (Stripe) | Mitjana | Alta |
| Sistema de valoracions | Mitjana | Mitjana |
| Admin panel | Baixa | Mitjana |
| Mètriques i analítica | Baixa | Baixa |

---

## 📝 Pròxims Passos

1. ✅ **Documentar requisits** (aquest document)
2. ⏳ **Crear User Stories** amb criteris d'acceptació (Gherkin)
3. ⏳ **Definir Model de Dades** (entitats i camps)
4. ⏳ **Crear MVP Checklist** (prioritzat)
5. ⏳ **Planificar implementació** per fases

---

**Document viu**: Aquest fitxer s'actualitzarà a mesura que es clarifiquin decisions pendents i s'implementin funcionalitats.
