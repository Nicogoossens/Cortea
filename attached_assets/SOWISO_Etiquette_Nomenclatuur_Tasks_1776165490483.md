# SOWISO Etiquette — Nomenclatuur & Ontwikkelplan

> **Versie:** 1.0 — Initieel ontwerp  
> **Status:** Klaar voor Replit implementatie  
> **Taal UI:** Engels (universeel, cultureel neutraal)  
> **Doelgroep:** Sociaal-algemeen, met discreet geïntegreerde companion/escort, zakelijk en evenementen profielen

---

## 1. De Appnaam

### Primaire naam
**SOWISO Etiquette**

- *So Wise* — universeel leesbaar, geen culturele frictie
- Ondertitel "Etiquette" verankert het domein onmiddellijk in elke taal
- Werkt in Lagos, Tokio, Brussel én São Paulo

### Alternatieve varianten (ter beslissing)
| Variant | Karakter |
|---|---|
| SOWISO Society | Exclusiever, club-gevoel |
| The Sowiso | Meest premium, lidmaatschapsgevoel |
| SOWISO & Co. | Lichtjes klassiek-Brits |
| SOWISO — The Art of Presence | Volledigste positionering |

---

## 2. De Vijf Progressieniveaus

Bewust in het Engels: universeel leesbaar, beschrijven een *houding*, geen rang.  
Geen adellijke of religieuze connotaties. Cultureel neutraal.

| Niveau | Naam | Kleur | Betekenis |
|---|---|---|---|
| I | **The Aware** | Grijs | Bewust van de basisregels. De eerste stap is altijd bewustzijn. |
| II | **The Composed** | Groen (teal) | Handelt met rust en gratie in vertrouwde situaties. |
| III | **The Refined** | Paars | Verfijnd in elke omgeving, elk gezelschap. |
| IV | **The Distinguished** | Amber/goud | Onderscheidt zich — van nature, zonder inspanning. |
| V | **The Sovereign** | Roze/bordeaux | Meesterschap. Aanwezig als autoriteit zonder het te claimen. |

### Noble Score
De Noble Score is de onzichtbare motor achter het niveau. De gebruiker ziet enkel zijn titel — het systeem observeert en past aan zonder quiz of expliciete meting.

---

## 3. De Vijf Zuilen — Met Titels Per Niveau

Elke zuil heeft een eigen naam ("The World Within", etc.) en een reeks van vijf titels die de progressie beschrijven.

### Zuil 1 — Cultuurkennis
**The World Within**

| Niveau | Titel |
|---|---|
| I | The Observer |
| II | The Reader |
| III | The Traveller |
| IV | The Diplomat |
| V | The Luminary |

### Zuil 2 — Verschijning / Klederdracht
**The Presence**

| Niveau | Titel |
|---|---|
| I | The Conscious |
| II | The Poised |
| III | The Curated |
| IV | The Impeccable |
| V | The Icon |

### Zuil 3 — Welbespraaktheid / Taal
**The Voice**

| Niveau | Titel |
|---|---|
| I | The Listener |
| II | The Conversant |
| III | The Eloquent |
| IV | The Orator |
| V | The Sage |

### Zuil 4 — Tafelmanieren / Voedingsgewoonten
**The Table**

| Niveau | Titel |
|---|---|
| I | The Guest |
| II | The Diner |
| III | The Connoisseur |
| IV | The Host |
| V | The Maître |

### Zuil 5 — Drankenkennis
**The Cellar**

| Niveau | Titel |
|---|---|
| I | The Sipper |
| II | The Taster |
| III | The Selector |
| IV | The Sommelier |
| V | The Cellar Master |

---

## 4. Domeinen & Positionering

| Domein | Positionering in app |
|---|---|
| Sociaal algemeen | Primair, altijd zichtbaar |
| Companion / escort | Discreet geïntegreerd via contextdetectie — nooit expliciet gelabeld |
| Zakelijk / corporate | Via contextprofiel activeerbaar |
| Evenementen / galas | Via contextprofiel activeerbaar |

De zuilen Verschijning, Welbespraaktheid en Cultuurkennis dragen het companion-domein vanzelf — zonder het ooit te benoemen. Dit is de elegantste vorm van bescherming en discretie.

---

## 5. Ontwikkeltaken voor Replit

> De onderstaande taken zijn geformatteerd als Replit Agent Tasks.  
> Elke taak is zelfstandig uitvoerbaar en bouwt op de vorige.  
> Kopieer elk **Task**-blok rechtstreeks in Replit om de taak aan te maken.

---

### TASK 01 — Projectsetup & Basisstructuur

```
Task: SOWISO-01 — Project Setup
Description:
Initialiseer het React Native (Expo) project met TypeScript.
- Mapstructuur aanmaken: /screens, /components, /data, /hooks, /theme
- Thema instellen: twee modes (Ivory/Emerald klassiek + Deep Black/Electric jonger)
- Navigatie opzetten (Expo Router of React Navigation)
- Basis app.json configureren met naam "SOWISO Etiquette"
- Startscherm met appnaam en tagline renderen
Acceptatiecriterium: App start op, toont "SOWISO Etiquette" op het scherm.
```

---

### TASK 02 — Datamodel & Supabase Schema

```
Task: SOWISO-02 — Database Schema Implementatie
Description:
Implementeer het volledige Supabase/Postgres schema.
Tabellen:
- users: id, geboortejaar, gender, noble_score (int), huidig_niveau (1-5), aangemaakt_op
- culture_protocols: id, land_code, zuil (1-5), categorie, inhoud, taal_code
- scenarios: id, zuil (1-5), niveau (1-5), domein (sociaal/zakelijk/evenement), land_code, omschrijving, correct_antwoord
- zuil_voortgang: user_id, zuil (1-5), behaalde_score, huidige_titel
- translations: id, sleutel, taal_code, vertaling
Seed data: UK, China en Canada voor alle 5 zuilen invullen als startdata.
Acceptatiecriterium: Alle tabellen bestaan, seeddata is aanwezig en opvraagbaar.
```

---

### TASK 03 — Noble Score Engine

```
Task: SOWISO-03 — Noble Score Systeem
Description:
Bouw de adaptieve Noble Score engine die het gebruikersniveau stilzwijgend bepaalt.
- Geen onboarding quiz
- Score wordt opgebouwd via interacties, scenario-antwoorden en tijd in app
- Per zuil een aparte score (0-100)
- Totale Noble Score = gewogen gemiddelde van de 5 zuilen
- Niveau bepaling: 0-19 = The Aware, 20-39 = The Composed, 40-59 = The Refined, 60-79 = The Distinguished, 80-100 = The Sovereign
- Hook: useNobleScore() — geeft huidige niveau, titels per zuil, en totaalscore terug
Acceptatiecriterium: Score past zich aan op basis van gebruikersacties. Titel verandert bij bereiken van drempelwaarde.
```

---

### TASK 04 — De Vijf Zuilen UI

```
Task: SOWISO-04 — Zuilen Scherm (Five Pillars)
Description:
Bouw het hoofdscherm dat de vijf zuilen toont.
Per zuil:
- Icoon + naam (The World Within / The Presence / The Voice / The Table / The Cellar)
- Huidige titel van de gebruiker voor die zuil
- Voortgangsindicator (cirkel of balk)
- Tap om naar detailscherm van die zuil te gaan
Niveaunamen:
- Cultuurkennis: Observer → Reader → Traveller → Diplomat → Luminary
- Verschijning: Conscious → Poised → Curated → Impeccable → Icon
- Welbespraaktheid: Listener → Conversant → Eloquent → Orator → Sage
- Tafelmanieren: Guest → Diner → Connoisseur → Host → Maître
- Drankenkennis: Sipper → Taster → Selector → Sommelier → Cellar Master
Acceptatiecriterium: Alle 5 zuilen zichtbaar, correcte titel per zuil op basis van Noble Score.
```

---

### TASK 05 — The Gym (Leerscenario's)

```
Task: SOWISO-05 — The Gym Module
Description:
Bouw de interactieve leermodule "The Gym".
- Scenario's ophalen uit de scenarios tabel op basis van gebruikersniveau en zuil
- Scenario tonen als situatieschets + meerkeuze of open antwoord
- Na antwoord: elegante feedback in etiquette-stijl ("A person of your distinction would...")
- Noble Score bijwerken na elk scenario
- Locatie-bewustzijn: scenarios filteren op actief land (UK / China / Canada als start)
- Persona-toon aanpassen op leeftijdsprofiel:
  - 18-30: Modern-beleefd
  - 30-55: Elegant-strak
  - 55+: Klassiek-formeel
Acceptatiecriterium: Gebruiker kan een volledig scenario doorlopen en Noble Score past zich aan.
```

---

### TASK 06 — First Aid Module

```
Task: SOWISO-06 — First Aid (30-seconden hulp)
Description:
Bouw de "First Aid" module voor directe, situationele hulp.
- Gebruiker beschrijft kort de situatie (vrij tekstveld of snelkeuze)
- AI geeft binnen 30 seconden een bruikbaar etiquette-advies
- Locatiedetectie via GPS of IP → automatisch land instellen
- Antwoord altijd in etiquette-toon (nooit hard corrigerend)
- Koppeling aan Anthropic Claude API voor dynamische antwoorden
- Categorieën: Tafel / Begroeting / Kleding / Gesprek / Cadeau / Overig
Acceptatiecriterium: Gebruiker kan een situatie invoeren en ontvangt binnen 30 seconden relevant advies.
```

---

### TASK 07 — Cultural Compass

```
Task: SOWISO-07 — Cultural Compass Module
Description:
Bouw de "Cultural Compass" met startdata voor VK, China en Canada.
Per land tonen:
- Kernwaarde (bv. Understatement & Traditie)
- Grootste taboe
- Dineretiquette
- Taal & aanspreekvorm
- Gift-giving protocol
- Dresscode verwachtingen
Interactie:
- Land selecteren via kaart of lijst
- Swipe-kaarten per categorie
- "Quick brief" voor reizende gebruiker (top 5 do's & don'ts)
Startdata verplicht aanwezig: UK, China, Canada (hardcoded als fallback)
Acceptatiecriterium: Alle drie landen tonen volledige data. Kaartnavigatie werkt.
```

---

### TASK 08 — Meertaligheid

```
Task: SOWISO-08 — Meertalige Interface
Description:
Implementeer meertalige ondersteuning voor 8 talen.
Talen: Engels, Frans, Duits, Italiaans, Arabisch, Japans, Spaans, Portugees.
Regels per taal:
- Frans: altijd vouvoyer (vous)
- Japans: Keigo (丁寧語) als minimumregister
- Arabisch: RTL layout ondersteuning
- Alle overige: hoogste beleefdheidsregister
Implementatie:
- i18n bibliotheek (react-i18next of expo-localization)
- Vertalingen opslaan in Supabase translations tabel
- Automatische taaldetectie op basis van apparaatinstellingen
- Handmatige override mogelijk in profiel
Acceptatiecriterium: App volledig bruikbaar in minimaal Engels en Frans. RTL werkt voor Arabisch.
```

---

### TASK 09 — Profielpagina & Titeldisplay

```
Task: SOWISO-09 — Gebruikersprofiel & Erkenningspagina
Description:
Bouw de profielpagina die de gebruiker zijn behaalde erkenningen toont.
Elementen:
- Huidig globaal niveau (The Aware t/m The Sovereign) prominent weergegeven
- Per zuil: behaalde titel + voortgang naar volgende titel
- Noble Score visualisatie (per zuil en totaal)
- Behaalde mijlpalen (eerste scenario afgerond, eerste land ontsloten, etc.)
- Geen gamification-clichés (geen confetti, geen puntentellers zichtbaar)
- Toon is altijd waardig: "You have been recognised as The Refined"
Acceptatiecriterium: Gebruiker ziet alle 5 zuiltitels correct weergegeven op basis van Noble Score.
```

---

### TASK 10 — Excellence Tiers (Verdienmodel)

```
Task: SOWISO-10 — Abonnementslagen & Toegangscontrole
Description:
Implementeer de drie toegangslagen met feature-gates.
Tiers:
- The Guest (gratis): 1 regio, basisscenario's, geen First Aid AI
- The Traveller (betaald): alle landen, volledige Cultural Compass, First Aid AI
- The Ambassador (premium): AI-stemanalyse, kledingscan, real-time SOS-hulp
Implementatie:
- Stripe of RevenueCat integreren voor in-app aankopen
- Feature flags per tier in Supabase (users tabel: tier_level)
- Upgrade-scherm met elegante positionering (geen agressieve upsell)
- Tekst: "Expand your world" — nooit "Upgrade now" of "Buy"
Acceptatiecriterium: The Guest ziet beperkte content. The Traveller heeft toegang tot alle landen. Feature-gates werken correct.
```

---

### TASK 11 — Companion/Escort Domein (Discreet Geïntegreerd)

```
Task: SOWISO-11 — Companion Profiel (Stille Integratie)
Description:
Integreer het companion/escort domein volledig discreet in de bestaande zuilen.
Geen aparte sectie, geen expliciet label.
Aanpak:
- Contextdetectie: als gebruiker interacties toont rond sociale begeleiding, formele diners, 
  internationale settings → activeer companion-relevante scenario's binnen de zuilen
- Zuil Verschijning: scenarios rond dresscode voor formele gelegenheden, presentatie
- Zuil Welbespraaktheid: scenarios rond conversatietechnieken, discretie, smalltalk op hoog niveau
- Zuil Cultuurkennis: scenarios rond internationale sociale protocollen
- Toon: altijd "high-society social companion" — nooit explicieter
- In de AI-prompt voor First Aid: companion-context wordt herkend maar nooit benoemd
Acceptatiecriterium: Gebruiker met companion-profiel ontvangt relevante scenarios zonder ooit een label te zien.
```

---

### TASK 12 — Toegankelijkheid & Adaptieve UI

```
Task: SOWISO-12 — Toegankelijkheid & Leeftijdsadaptatie
Description:
Zorg dat de interface meegroeit met de gebruiker.
Schaalfactoren:
- Lettergrootte: automatisch groter voor 55+ (via Noble Score leeftijdsinschatting)
- Contrast: hogere contrastmodus beschikbaar
- Complexiteit: minder opties zichtbaar voor nieuwe gebruikers (The Aware)
- Thema: Ivory/Emerald voor klassiek profiel, Deep Black/Electric voor jonger profiel
Standaarden:
- WCAG 2.1 AA minimaal
- VoiceOver (iOS) en TalkBack (Android) ondersteuning
- Minimale tapzone: 44x44pt
Acceptatiecriterium: App slaagt voor automatische toegankelijkheidstest. Thema schakelt correct op basis van gebruikersprofiel.
```

---

## 6. Volgorde van Implementatie (Aanbevolen)

```
Sprint 1 (Fundament):     TASK 01 → TASK 02 → TASK 03
Sprint 2 (Kernmodules):   TASK 04 → TASK 05 → TASK 06
Sprint 3 (Verrijking):    TASK 07 → TASK 08 → TASK 09
Sprint 4 (Monetisatie):   TASK 10 → TASK 11 → TASK 12
```

---

## 7. Technische Stack Samenvatting

| Component | Keuze |
|---|---|
| Framework | React Native met Expo + TypeScript |
| Database | Supabase (Postgres) |
| AI | Anthropic Claude API |
| Betalingen | Stripe of RevenueCat |
| Vertalingen | react-i18next |
| Navigatie | Expo Router |
| Thema | Dynamisch (Ivory/Emerald ↔ Deep Black/Electric) |

---

*SOWISO Etiquette — The Art of Presence*  
*Nomenclatuur v1.0 — Gereed voor ontwikkeling*
