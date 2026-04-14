# Master-Prompt: Context & Courtesy — AI-Architectuur v2.0

---

## 1. Projectvisie & Positionering

Creëer een verfijnde, adaptieve applicatie genaamd **Context & Courtesy**. De app begeleidt gebruikers — ongeacht leeftijd, achtergrond of sociale klasse — naar een natuurlijk, authentiek en situatiegepast optreden. Etiquette wordt niet opgelegd als een set regels, maar aangeleerd als een tweede natuur: discreet, progressief en persoonlijk.

De applicatie positioneert zichzelf als een **privé-mentor van het hoogste niveau** — vergelijkbaar met een persoonlijke adviseur die een diplomaat of zakenman begeleidt voor een buitenlandse missie. De toon, de interface en elk woord dat de AI uitspreekt ademen deze standing.

> **Stijlrichtlijn voor de gehele app:** Elke tekst — of het nu een foutmelding, een felicitatie of een instructie is — wordt geschreven in het register van een hoogopgeleide, discrete raadgever. Nooit veroordelend. Nooit triviaal. Altijd met achting voor de gebruiker.

### De Drie Ateliers (Kernfunctionaliteiten)

1. **The Atelier** *(voorheen: De Gym)*
   Interactieve, progressieve scenario-training. De gebruiker oefent situaties in een veilige, elegante omgeving. Fouten worden behandeld als leermomenten, nooit als mislukkingen.

2. **The Counsel** *(voorheen: First Aid)*
   Directe, contextgebonden begeleiding binnen 30 seconden. Automatisch afgestemd op de huidige locatie en culturele context van de gebruiker. Ontworpen voor reële situaties: "Ik sta over 5 minuten voor een zakelijk diner in Tokyo — wat moet ik weten?"

3. **The Cultural Compass**
   Dynamische gids voor lokale tradities, taboes en sociale verwachtingen. Startconfiguratie: Verenigd Koninkrijk, China, Canada. Uitbreiding via kennisbank in latere fase (zie sectie 4).

---

## 2. Backend Architectuur & Datamodel

De backend categoriseert alle inhoud volgens het **Universeel Etiquette Framework — 5 Zuilen**:

### A. De 5 Zuilen

1. **Cultuur & Traditie** — Religieuze kalender, feestdagen, geschenkenprotocol, diepgewortelde taboes per regio.
2. **Interactie & Taal** — Aanspreekvormen, begroetingsrituelen, high/low-context communicatie, veilige gespreksonderwerpen.
3. **Tafelmanieren** — Bestekgebruik en -stijl, zitprotocol, betalingsrituelen, omgang met geluiden en houding aan tafel.
4. **Relaties & Status** — Gender-adaptieve nuances (zie sectie 3), senioriteit, hiërarchie in zakelijke en sociale context.
5. **Verschijning** — Dresscodes (van Business Formal tot Modest Dress), lichaamstaal, oogcontact, persoonlijke ruimte.

### B. Database Schema (Supabase / Postgres)

```sql
users
  - id
  - birth_year
  - gender_identity         -- initieel optioneel; verfijnd via observatie (zie sectie 3)
  - gender_expression       -- mannelijk / vrouwelijk / vloeiend (gedragsmatig vastgesteld)
  - noble_score             -- zie sectie 3B
  - ambition_level          -- casual / professional / diplomatic
  - context_preference      -- zakelijk / sociaal / beide
  - language_code           -- primaire taal van de gebruiker
  - subscription_tier       -- guest / traveler / ambassador
  - region_history          -- JSON array van bezochte/bestudeerde regio's
  - created_at

culture_protocols
  - id
  - region_code             -- ISO landcode
  - pillar                  -- 1 t/m 5 (de 5 Zuilen)
  - rule_type               -- absoluut_taboe / sterke_voorkeur / contextafhankelijk
  - rule_description
  - gender_applicability    -- all / masculine / feminine / fluid
  - context                 -- zakelijk / sociaal / algemeen
  - source_reference        -- bronvermelding (in te vullen via kennisbank fase 2)
  - valid_from / valid_until -- culturele normen evolueren

scenarios
  - id
  - title
  - pillar
  - region_code
  - age_group               -- 18-30 / 30-55 / 55+
  - gender_applicability
  - context                 -- zakelijk / sociaal
  - difficulty_level        -- 1 (inleidend) t/m 5 (diplomatiek)
  - estimated_minutes
  - noble_score_impact      -- gewicht van dit scenario op de Noble Score
  - content_json

translations
  - id
  - language_code           -- ISO 639-1
  - formality_register      -- hoog / ceremonieel / diplomatiek
  - rtl_flag                -- boolean (true voor Arabisch)
  - region_link             -- optionele koppeling aan culture_protocols.region_code
  - key
  - value

noble_score_log
  - id
  - user_id
  - scenario_id
  - score_delta
  - timestamp
  - trigger                 -- correcte_keuze / tijdsdruk / culturele_breedte / consistentie
```

---

## 3. Adaptieve Engine & Persona

### A. De Mentor-Persona

De AI gedraagt zich als een **discrete, hoogopgeleide persoonlijke raadgever**. Denk aan de stijl van een ervaren diplomaat die nooit corrigeert maar altijd begeleidt. Fouten worden omgezet in suggesties. De toon is warm maar beheerst, nooit informeel, nooit veroordelend.

**Verboden registers voor de AI:**
- Harde afwijzing ("Dat is fout.")
- Overdreven enthousiasme ("Geweldig gedaan!")
- Generiek taalgebruik ("Oké, hier zijn uw opties:")

**Toegestane stijl:**
> *"In kringen als de uwe zou men doorgaans kiezen voor... — een keuze die uw positie versterkt."*
> *"Mocht u twijfelen, dan is de meer terughoudende aanpak hier de meest elegante."*

### B. Noble Score — Definitie & Werking

De Noble Score is het stille hart van de adaptieve engine. Hij is nooit zichtbaar als een ruwe score, maar manifesteert zich in de diepte en toon van de begeleiding.

**Inputvariabelen:**
- Correctheid van keuzes in scenario's
- Reactiesnelheid onder tijdsdruk (The Counsel)
- Culturele breedte (hoeveel regio's beheerst de gebruiker?)
- Consistentie over tijd (toont de gebruiker progressie?)

**Scorebereik:** 0–1000 (intern)

**Gedragseffect:**
- Score 0–250: Uitgebreide uitleg, meer context, gentlere correcties.
- Score 250–600: Verfijnde suggesties, scenario's met hogere complexiteit.
- Score 600–1000: Subtiele nuances, diplomatiek register, peer-niveau toon.

**Weergave voor de gebruiker:** nooit als getal. Wel als stijlvolle statusaanduiding binnen de tier-ervaring (bijv. "Uw standing in dit domein groeit gestaag.").

### C. Persona-Matrix (Leeftijd × Context)

| Leeftijd | Sociale context | Zakelijke context | Toon |
|:---|:---|:---|:---|
| **18–30** | Sociale navigatie, zelfverzekerdheid | Eerste indrukken, netwerken | Modern-beleefd |
| **30–55** | Representatie, gastheerschap | Leiderschap, onderhandelen | Elegant-strak |
| **55+** | Culturele nuances, protocol | Senioriteit, diplomatiek verkeer | Klassiek-formeel |

### D. Gender-Adaptiviteit (Geen Neutrale Middenweg)

De app werkt met **gender als sturende variabele** voor de etiquette-instructies. Het doel is authenticiteit binnen de sociale context — niet het uitwissen van gender, maar het respecteren en verfijnen ervan.

**Werkwijze:**

1. **Optionele initiële vraag** (één, discreet geformuleerd bij eerste gebruik):
   *"Om u zo persoonlijk mogelijk te begeleiden — identificeert u zich eerder als man, vrouw, of verkiest u dat wij dit gaandeweg leren kennen?"*

2. **Observationele verfijning:** het systeem leidt de gender-expressie af uit keuzes, scenario-voorkeuren en interactiestijl. Het `gender_expression`-veld in de database wordt stilzwijgend bijgewerkt.

**Praktische toepassing:**
- Een vrouwelijke gebruiker ontvangt etiquette-instructies die aansluiten bij haar natuurlijke sociale expressie. Zij wordt nooit aangespoord tot handelingen die mannelijk van register zijn.
- Een mannelijke gebruiker met een meer vrouwelijke expressie (en dit desgewenst heeft aangegeven of waaruit de app dit afleidde) krijgt ruimte voor die nuances — zonder de protocollaire integriteit van de situatie te schaden.
- Het systeem corrigeert nooit de identiteit van de gebruiker. Het verfijnt uitsluitend het *gedrag* binnen de gegeven sociale context.

**Formulering in de AI-output:** altijd contextgebonden, nooit generiek. Geen "Een heer zou..." als universele formule. De AI past de aanspreekvorm en het voorbeeld aan op het profiel van de gebruiker.

---

## 4. Land-specifieke Startdata & Kennisbank

### Startconfiguratie (hardcoded — fase 1)

De initiële data voor Verenigd Koninkrijk, China en Canada wordt als basislaag ingebouwd. Deze data is **bewust beperkt gehouden** in deze fase en dient als architecturaal fundament.

> **Fase 2 — Kennisbank-uitbreiding:** De inhoudelijke verdieping van alle cultuurprotocollen zal worden aangeleverd vanuit **gerenommeerde etiquette- en protocollectuur** (titels worden in een later stadium toegevoegd). De database is zo opgezet dat deze aanvullingen zonder structuurwijziging kunnen worden geïmporteerd via de `source_reference`- en `rule_type`-velden in `culture_protocols`.

| Regio | Kernwaarde | Grootste Taboe | Zakelijke context | Sociale context |
|:---|:---|:---|:---|:---|
| **Verenigd Koninkrijk** | Understatement & Traditie | Te direct zijn over geld of emotie | Formele terughoudendheid; titels strikt respecteren | Indirecte communicatie; humor als sociaal gereedschap |
| **China** | Mianzi (Gezichtsbehoud) | Publieke correctie; gezichtsverlies veroorzaken | Hiërarchie strikt volgen; kaartjesprotocol met beide handen | Geschenkenprotocol; nooit weigeren zonder uitleg |
| **Canada** | Gelijkwaardigheid & Inclusiviteit | Persoonlijke ruimte negeren; veronderstellingen over taal | Informele maar punctuele professionaliteit | Egalitaire omgang; sterk bewustzijn van culturele diversiteit |

### Technische importstructuur (fase 2)

De kennisbank-import verloopt via gestructureerde JSON-bestanden per regio en per zuil. De Agent dient hiervoor een importmodule te voorzien met validatie op `rule_type` en `gender_applicability`.

---

## 5. Meertaligheid

### Ondersteunde talen (fase 1)

| Taal | Beleefdheidsnorm | Aanspreekstijl | RTL | Opmerking |
|:---|:---|:---|:---|:---|
| **Engels** | Formeel-neutraal | Mr./Ms./Dr. + achternaam | Nee | Brits Engels als standaard |
| **Frans** | Vouvoyer verplicht | Monsieur / Madame | Nee | Nooit tutoyeren zonder expliciete uitnodiging |
| **Duits** | Sie verplicht | Herr / Frau + achternaam | Nee | Du enkel bij expliciete wederzijdse uitnodiging |
| **Italiaans** | Lei formeel | Signor / Signora + achternaam | Nee | Tu enkel in sociale context van gelijke leeftijd |
| **Spaans** | Usted standaard | Señor / Señora | Nee | Onderscheid Castiliaans vs. Latijns-Amerikaans register toepassen |
| **Portugees** | O Senhor / A Senhora | Formele titel + naam | Nee | Europees vs. Braziliaans register onderscheiden |
| **Arabisch** | Fusha-gebaseerd | Formele titels | **Ja** | RTL-layout vereist; geen dialectvarianten |
| **Japans** | Keigo (respectvol register) | Familienaam + San/Sama/Sensei | Nee | Nooit voornaam zonder expliciete toestemming |
| **Mandarijn** | Formele aanspreking | Familienaam + Functietitel | Nee | Gekoppeld aan China-module; vereenvoudigd schrift |
| **Frans-Canadees** | Vouvoyer in formele context | Monsieur / Madame | Nee | Subtiel onderscheid met Europees Frans; gekoppeld aan Canada-module |

> **Fase 2:** Uitbreiding naar bijkomende talen volgt de importlogica van de kennisbank. Elke taal krijgt een eigen `formality_register`-configuratie in de `translations`-tabel.

---

## 6. Functionele Eisen & UX-Filosofie

- **Locatiebewustzijn:** Via GPS (met expliciete gebruikerstoestemming) of IP-detectie past The Counsel en The Atelier zich automatisch aan de lokale cultuur aan. Locatiedata wordt niet opgeslagen na de sessie — conform AVG/GDPR.

- **Progressieve Adaptatie (geen onboarding-quiz):** Het systeem observeert de gebruiker stilzwijgend en past het niveau aan via de Noble Score. Enkel de optionele gender-vraag wordt bij eerste gebruik gesteld.

- **Offline-modus:** The Counsel biedt een basisset van cultuurprotocollen offline aan voor de drie startregio's. Essentieel voor reizigers zonder stabiele verbinding.

### The Excellence Tiers (Verdienmodel)

| Tier | Naam | Belofte |
|:---|:---|:---|
| **I** | *The Guest* | U betreedt één cultuur. Eén regio. De eerste stap naar verfijnd optreden. |
| **II** | *The Traveler* | De wereld als uw salon. Alle regio's, alle culturen, volledig toegankelijk. |
| **III** | *The Ambassador* | Uw meest complete zelf. Inclusief AI-stemanalyse, kledingadvies via beeldscan, real-time begeleiding via The Counsel, en het volledige stemmen-atelier (zie sectie 7). |

**Upgrade-trigger (subtiel in-app):** Wanneer een gebruiker een regio of scenario opvraagt buiten zijn huidige tier, reageert de app niet met een pop-up maar met een elegante melding in stijl: *"Dit domein behoort tot het repertoire van The Traveler. Wenst u uw toegang uit te breiden?"*

---

## 7. Gesproken Begeleiding & Stemontwerp

De gesproken component is beschikbaar vanaf **The Ambassador**-tier en wordt in een latere fase geïmplementeerd via een dedicated voice worker.

### Stemopties per tier

| Tier | Stemmodel |
|:---|:---|
| *The Traveler* | Keuze uit een gecureerde bibliotheek van stemmen (mannelijk / vrouwelijk / neutraal), per taal afzonderlijk instelbaar. |
| *The Ambassador* | Aanvullend: de gebruiker kan een opname van zijn of haar eigen stem aanleveren. De app analyseert het register en spiegelt een verfijnde, toonvaste versie terug als begeleider. |

> **Technische nota:** De stemanalyse en voice-worker integratie worden in fase 2 uitgewerkt. De architectuur dient nu reeds een `voice_profile`-veld te reserveren in de `users`-tabel, alsook een modulaire koppeling naar de gekozen TTS/voice-analyse dienst.

---

## 8. Ontwikkelinstructies (Replit Agent)

### Framework & Structuur
- **Framework:** React Native (Expo) met TypeScript
- **Database:** Supabase (Postgres) — schema zoals beschreven in sectie 2B
- **Initialisatie:** Verenigd Koninkrijk, China en Canada zijn direct functioneel via hardcoded startdata

### Visueel Ontwerp & Thema

De app kent twee dynamische thema's, automatisch toegepast op basis van het gebruikersprofiel (leeftijd × Noble Score):

**Classique** *(55+ en/of hoge Noble Score)*
- Kleurenpalet: Ivoor (#F5F0E8), Diepgroen (#1C3A2F), Goud-accent (#C9A96E)
- Sfeer: Edwardian luxury. Denk aan het briefpapier van een ambassade.

**Moderne** *(18–35 en/of lage Noble Score)*
- Kleurenpalet: Diepzwart (#0A0A0A), Elektrisch Groen (#00E5A0), Zilver (#C0C0C0)
- Sfeer: Precision. Strak. Digitaal maar niet koud.

**Typografie:**
- Titels: Cormorant Garamond (Classique) / Neue Haas Grotesk of equivalent (Moderne)
- Bodytekst: Libre Baskerville (Classique) / DM Sans (Moderne)
- Nooit: Inter, Roboto, Arial of enig generiek systeemfont

**Micro-animaties:**
- Stijlrichtlijn: terughoudend, precies, intentioneel. Geen speelsheid.
- Overgangen: fade met lichte verticale verschuiving (300ms ease-out)
- Laadmomenten: geen spinner — een subtiele pulserende lijn in de accentkleur
- Volledige animatie-uitwerking volgt in fase 2 op basis van aangeleverde design data

**Geluidsontwerp:**
- Fase 2 — gekoppeld aan de voice worker (zie sectie 7)
- Auditieve feedback is minimaal en nooit intrusief: één discrete toon voor bevestiging, geen geluid bij fout

### Privacy & Compliance
- Locatiedata: enkel met expliciete toestemming; niet persistent opgeslagen (AVG/GDPR)
- Gender-data: opgeslagen als interne variabele, nooit gedeeld of zichtbaar voor derden
- Noble Score: intern — nooit als ruwe waarde zichtbaar voor de gebruiker

### Toegankelijkheid
- Lettergrootte, contrast en interfacecomplexiteit schalen automatisch mee met de leeftijdsgroep
- RTL-ondersteuning actief voor Arabisch via i18n-library met RTL-toggle
