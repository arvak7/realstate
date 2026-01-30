# User Stories - Real Estate Platform

> **Última actualització**: 2026-01-27

---

## 🎯 Épica 1: Autenticació i Gestió d'Usuaris

### US-001: Registre amb Compte Propi
**Com a** visitant  
**Vull** registrar-me amb email i contrasenya  
**Per tal de** crear un compte a la plataforma

**Criteris d'Acceptació**:
```gherkin
Given sóc un visitant no autenticat
When accedeixo a la pàgina de registre
And introdueixo un email vàlid i una contrasenya segura
And confirmo la contrasenya
And accepto els termes i condicions
Then el sistema crea el meu compte
And rebo un email de confirmació
And sóc redirigit al dashboard
```

**Prioritat**: 🔴 Crítica  
**Estimació**: 5 punts

---

### US-002: Login amb Google
**Com a** usuari  
**Vull** iniciar sessió amb el meu compte de Google  
**Per tal de** accedir ràpidament sense crear una contrasenya

**Criteris d'Acceptació**:
```gherkin
Given sóc un visitant no autenticat
When clico "Iniciar sessió amb Google"
And autoritzo l'aplicació a accedir al meu perfil de Google
Then el sistema crea o actualitza el meu compte
And sóc autenticat a la plataforma
And sóc redirigit al dashboard
```

**Prioritat**: 🔴 Crítica  
**Estimació**: 3 punts

---

### US-003: Login amb Facebook
**Com a** usuari  
**Vull** iniciar sessió amb el meu compte de Facebook  
**Per tal de** accedir ràpidament sense crear una contrasenya

**Criteris d'Acceptació**:
```gherkin
Given sóc un visitant no autenticat
When clico "Iniciar sessió amb Facebook"
And autoritzo l'aplicació a accedir al meu perfil de Facebook
Then el sistema crea o actualitza el meu compte
And sóc autenticat a la plataforma
And sóc redirigit al dashboard
```

**Prioritat**: 🟡 Alta  
**Estimació**: 3 punts

---

## 🏠 Épica 2: Navegació i Cerca d'Immobles

### US-004: Veure Llistat d'Immobles (Sense Login)
**Com a** visitant no autenticat  
**Vull** veure un llistat d'immobles disponibles  
**Per tal de** explorar les opcions sense haver de registrar-me

**Criteris d'Acceptació**:
```gherkin
Given sóc un visitant no autenticat
When accedeixo a la pàgina principal
Then veig un llistat d'immobles
And cada immoble mostra: títol, preu, ubicació, m², habitacions
And NO veig fotos dels immobles
And NO veig dades de contacte
And veig un missatge indicant que cal login per veure més detalls
```

**Prioritat**: 🔴 Crítica  
**Estimació**: 3 punts

---

### US-005: Veure Fotos d'Immobles (Amb Login)
**Com a** usuari autenticat  
**Vull** veure les fotos dels immobles  
**Per tal de** avaluar visualment les propietats

**Criteris d'Acceptació**:
```gherkin
Given sóc un usuari autenticat
When accedeixo al detall d'un immoble públic
Then veig totes les fotos de l'immoble
And puc navegar per la galeria d'imatges
And les imatges es carreguen en alta qualitat

Given sóc un usuari autenticat
When accedeixo al detall d'un immoble privat
And NO compleixo els requisits d'accés
Then NO veig les fotos
And veig un missatge indicant els requisits necessaris
```

**Prioritat**: 🔴 Crítica  
**Estimació**: 5 punts

---

### US-006: Cercar Immobles per Filtres
**Com a** usuari (autenticat o no)  
**Vull** filtrar immobles per preu, ubicació, m², habitacions  
**Per tal de** trobar propietats que s'ajustin a les meves necessitats

**Criteris d'Acceptació**:
```gherkin
Given sóc a la pàgina de cerca
When aplico filtres de:
  | Camp | Valor |
  | Preu mínim | 100000 |
  | Preu màxim | 300000 |
  | Habitacions | 3 |
  | Ubicació | Barcelona |
Then veig només immobles que compleixen tots els filtres
And el comptador mostra el nombre de resultats
And puc netejar els filtres amb un botó
```

**Prioritat**: 🔴 Crítica  
**Estimació**: 8 punts

---

### US-007: Cercar Immobles per Text
**Com a** usuari (autenticat o no)  
**Vull** cercar immobles per paraules clau  
**Per tal de** trobar propietats específiques ràpidament

**Criteris d'Acceptació**:
```gherkin
Given sóc a la pàgina de cerca
When introdueixo "terrassa Barcelona" a la barra de cerca
Then veig immobles que contenen aquestes paraules al títol o descripció
And els resultats estan ordenats per relevància
And puc combinar cerca de text amb filtres
```

**Prioritat**: 🟡 Alta  
**Estimació**: 5 punts

---

## 📝 Épica 3: Publicació i Gestió d'Immobles

### US-008: Crear Anunci d'Immoble
**Com a** usuari autenticat  
**Vull** crear un anunci per vendre el meu immoble  
**Per tal de** arribar a potencials compradors

**Criteris d'Acceptació**:
```gherkin
Given sóc un usuari autenticat
When accedeixo a "Publicar Immoble"
And omplo els camps obligatoris:
  | Camp | Valor |
  | Tipus | Pis |
  | Habitacions | 3 |
  | Metres quadrats | 85 |
  | Preu | 250000 |
  | Ubicació | Barcelona, Eixample |
And pujo almenys 1 foto
And clico "Publicar"
Then l'anunci es crea amb estat "Actiu"
And apareix al llistat públic
And rebo una confirmació
```

**Prioritat**: 🔴 Crítica  
**Estimació**: 13 punts

---

### US-009: Editar el Meu Immoble
**Com a** usuari autenticat propietari d'un anunci  
**Vull** editar la informació del meu immoble  
**Per tal de** mantenir l'anunci actualitzat

**Criteris d'Acceptació**:
```gherkin
Given sóc el propietari d'un anunci
When accedeixo a "Les Meves Propietats"
And selecciono un immoble
And clico "Editar"
And modifico el preu de 250000 a 240000
And clico "Guardar"
Then els canvis es guarden
And l'anunci mostra el nou preu
And la data d'actualització es reflecteix
```

**Prioritat**: 🟡 Alta  
**Estimació**: 5 punts

---

### US-010: Gestionar Fotos del Meu Immoble
**Com a** usuari autenticat propietari d'un anunci  
**Vull** afegir, reordenar i eliminar fotos  
**Per tal de** mostrar el meu immoble de la millor manera

**Criteris d'Acceptació**:
```gherkin
Given sóc el propietari d'un anunci
When accedeixo a la gestió de fotos
And pujo 3 noves fotos
Then les fotos es processen i es mostren a l'anunci
And puc arrossegar per reordenar-les
And puc eliminar fotos individuals
And la primera foto és la imatge principal
```

**Prioritat**: 🟡 Alta  
**Estimació**: 8 punts

---

### US-011: Marcar Immoble com a Privat
**Com a** usuari autenticat propietari d'un anunci  
**Vull** marcar el meu immoble com a privat  
**Per tal de** controlar qui pot veure fotos i contacte

**Criteris d'Acceptació**:
```gherkin
Given sóc el propietari d'un anunci públic
When accedeixo a la configuració de l'anunci
And marco "Immoble privat"
And defineixo requisits d'accés (ex: verificació d'identitat)
And guardo els canvis
Then l'immoble es marca com a privat
And només usuaris que compleixen els requisits poden veure fotos i contacte
And altres usuaris veuen un missatge informatiu
```

**Prioritat**: 🟢 Mitjana  
**Estimació**: 8 punts

---

### US-012: Canviar Estat de l'Anunci
**Com a** usuari autenticat propietari d'un anunci  
**Vull** pausar o tancar el meu anunci  
**Per tal de** gestionar la visibilitat quan l'immoble no està disponible

**Criteris d'Acceptació**:
```gherkin
Given sóc el propietari d'un anunci actiu
When accedeixo a "Les Meves Propietats"
And selecciono un immoble
And canvio l'estat a "Pausat"
Then l'anunci deixa d'aparèixer al llistat públic
And puc reactivar-lo en qualsevol moment

When canvio l'estat a "Tancat"
Then l'anunci es marca com a venut/llogat
And no es pot reactivar (només duplicar)
```

**Prioritat**: 🟡 Alta  
**Estimació**: 5 punts

---

## 📞 Épica 4: Contacte i Interacció

### US-013: Contactar amb el Propietari
**Com a** usuari autenticat  
**Vull** contactar amb el propietari d'un immoble  
**Per tal de** obtenir més informació o concertar una visita

**Criteris d'Acceptació**:
```gherkin
Given sóc un usuari autenticat
When accedeixo al detall d'un immoble públic
And clico "Contactar"
Then veig les dades de contacte del propietari (telèfon, email)
And puc enviar un missatge directe
And el propietari rep una notificació

Given l'immoble és privat i NO compleixo els requisits
Then NO puc veure les dades de contacte
And veig un missatge indicant els requisits necessaris
```

**Prioritat**: 🔴 Crítica  
**Estimació**: 8 punts

---

## ✅ Épica 5: Verificacions i Confiança

### US-014: Verificar la Meva Identitat
**Com a** usuari autenticat  
**Vull** verificar la meva identitat amb el DNI  
**Per tal de** generar confiança amb altres usuaris

**Criteris d'Acceptació**:
```gherkin
Given sóc un usuari autenticat no verificat
When accedeixo a "Verificar Identitat"
And pujo una foto del meu DNI (anvers i revers)
And envio la sol·licitud
Then el sistema processa la verificació via Stripe Identity
And rebo una notificació amb el resultat (Validat/Rebutjat)
And si és validat, el meu perfil mostra un badge de "Identitat Verificada"
```

**Prioritat**: 🟡 Alta  
**Estimació**: 13 punts

---

### US-015: Verificar la Propietat d'un Immoble
**Com a** usuari autenticat propietari d'un anunci  
**Vull** verificar que sóc el propietari legal  
**Per tal de** augmentar la confiança dels compradors

**Criteris d'Acceptació**:
```gherkin
Given sóc el propietari d'un anunci
When accedeixo a "Verificar Propietat"
And pujo el meu DNI i el rebut de l'IBI
And envio la sol·licitud
Then un administrador revisa la documentació
And rebo una notificació amb el resultat
And si és validat, l'anunci mostra un badge de "Propietat Verificada"
```

**Prioritat**: 🟡 Alta  
**Estimació**: 13 punts

---

## ⭐ Épica 6: Valoracions i Reputació

### US-016: Valorar un Usuari
**Com a** usuari autenticat  
**Vull** valorar un altre usuari després d'una interacció  
**Per tal de** contribuir al sistema de reputació

**Criteris d'Acceptació**:
```gherkin
Given he contactat amb un propietari
And hem tingut una interacció (visita, negociació)
When accedeixo a "Valorar Usuari"
And selecciono l'usuari
And dono una puntuació (1-5 estrelles)
And afegeixo un comentari opcional
And envio la valoració
Then la valoració es registra
And la mitjana de l'usuari s'actualitza
And l'usuari valorat rep una notificació
```

**Prioritat**: 🟢 Mitjana  
**Estimació**: 8 punts

---

### US-017: Veure Reputació d'un Usuari
**Com a** usuari (autenticat o no)  
**Vull** veure la reputació d'un propietari  
**Per tal de** avaluar la seva fiabilitat abans de contactar

**Criteris d'Acceptació**:
```gherkin
Given accedeixo al perfil d'un usuari
Then veig la seva puntuació mitjana (ex: 4.5/5)
And veig el nombre total de valoracions
And puc llegir els comentaris de les valoracions
And les valoracions estan ordenades per data (més recents primer)
```

**Prioritat**: 🟢 Mitjana  
**Estimació**: 5 punts

---

## 🛠️ Épica 7: Administració

### US-018: Revisar Fotos com a Admin
**Com a** administrador  
**Vull** revisar les fotos pujades pels usuaris  
**Per tal de** assegurar que compleixen les normes de la plataforma

**Criteris d'Acceptació**:
```gherkin
Given sóc un administrador
When accedeixo al panel d'administració
And selecciono "Fotos Pendents de Revisió"
Then veig una llista de fotos no validades
And puc veure cada foto en detall
And puc aprovar o rebutjar cada foto
And si rebutjo, puc afegir un motiu
And l'usuari rep una notificació del resultat
```

**Prioritat**: 🟢 Mitjana  
**Estimació**: 8 punts

---

### US-019: Gestionar Verificacions com a Admin
**Com a** administrador  
**Vull** revisar les sol·licituds de verificació de propietat  
**Per tal de** validar la documentació aportada

**Criteris d'Acceptació**:
```gherkin
Given sóc un administrador
When accedeixo a "Verificacions Pendents"
Then veig una llista de sol·licituds
And puc veure la documentació aportada (DNI, IBI)
And puc aprovar o rebutjar la verificació
And si rebutjo, puc afegir un motiu
And l'usuari rep una notificació del resultat
And queda registrat un audit log de l'acció
```

**Prioritat**: 🟢 Mitjana  
**Estimació**: 8 punts

---

## 📊 Épica 8: Mètriques i Analítica

### US-020: Veure Estadístiques del Meu Immoble
**Com a** usuari autenticat propietari d'un anunci  
**Vull** veure estadístiques del meu anunci  
**Per tal de** entendre l'interès que genera

**Criteris d'Acceptació**:
```gherkin
Given sóc el propietari d'un anunci
When accedeixo a "Les Meves Propietats"
And selecciono un immoble
And clico "Estadístiques"
Then veig:
  | Mètrica | Exemple |
  | Visites totals | 245 |
  | Visites últims 7 dies | 32 |
  | Clics a contacte | 12 |
  | Favorits | 8 |
And veig un gràfic d'evolució de visites
```

**Prioritat**: ⚪ Baixa  
**Estimació**: 5 punts

---

## 📱 Épica 9: Experiència Mòbil

### US-021: Accedir des de l'App Mòbil
**Com a** usuari  
**Vull** accedir a la plataforma des de l'app mòbil  
**Per tal de** gestionar immobles des del meu telèfon

**Criteris d'Acceptació**:
```gherkin
Given tinc l'app instal·lada al meu dispositiu
When obro l'app
Then veig la mateixa informació que a la web
And puc fer login amb els mateixos mètodes
And puc navegar, cercar i contactar
And la interfície està optimitzada per mòbil
```

**Prioritat**: 🟡 Alta (Fase 2)  
**Estimació**: 21 punts

---

## 📋 Resum de Prioritats

| Prioritat | Nombre d'Històries | Punts Totals |
|-----------|-------------------|--------------|
| 🔴 Crítica | 7 | 50 |
| 🟡 Alta | 7 | 52 |
| 🟢 Mitjana | 5 | 37 |
| ⚪ Baixa | 1 | 5 |

**Total**: 21 històries, 144 punts

---

## 🎯 MVP (Mínim Producte Viable)

Per a la primera versió, prioritzem:

### Fase 1: Core (50 punts)
- US-001: Registre amb compte propi
- US-002: Login amb Google
- US-004: Veure llistat sense login
- US-005: Veure fotos amb login
- US-006: Cercar per filtres
- US-008: Crear anunci
- US-013: Contactar propietari

### Fase 2: Gestió (52 punts)
- US-003: Login amb Facebook
- US-007: Cercar per text
- US-009: Editar immoble
- US-010: Gestionar fotos
- US-012: Canviar estat anunci
- US-014: Verificar identitat
- US-015: Verificar propietat

### Fase 3: Confiança i Admin (37 punts)
- US-011: Immobles privats
- US-016: Valorar usuari
- US-017: Veure reputació
- US-018: Admin - Revisar fotos
- US-019: Admin - Gestionar verificacions

### Fase 4: Analítica i Mòbil (26 punts)
- US-020: Estadístiques
- US-021: App mòbil

---

**Document viu**: Aquestes històries s'actualitzaran a mesura que es clarifiquin requisits i es rebin feedbacks.
