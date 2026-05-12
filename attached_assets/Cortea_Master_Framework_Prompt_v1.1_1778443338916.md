# Cortéa — Master Framework Prompt: Vragen- en Levelsysteem
**Type:** Canonieke implementatie-prompt
**Scope:** Profiel-architectuur · onboarding · placement · selectie-engine · progressie · register-bewustzijn · Refinement Compass · UX
**Status:** Vervangt v1.0 (selection flow memo + interest detection spec) en de Compass-extensie
**Versie:** 1.1
**Datum:** 8 mei 2026
**Voor:** Dev-team, Replit, Claude Code, of welke uitvoerder dan ook werkt aan de Cortéa-codebase
**Sister-document:** Cortéa Content Quality Standard v1.0 (editoriale tucht voor content-team)

---

## 0. Doel van dit document

Dit is de complete framework-specificatie voor hoe Cortéa beslist welke vragen aan welke gebruiker in welke volgorde worden voorgeschoteld, hoe zijn refinement gemeten en getoond wordt, en hoe het profiel-systeem zijn keuzes onderbouwt.

Wie dit document toepast bouwt een leersysteem dat:
- Een gebruiker bij eerste registratie correct plaatst zonder hem te dwingen zich te etiketteren
- Een ervaren gebruiker geen Apprentice-content laat doorworstelen
- Het verschil tussen middenklasse en elite respecteert als **parallelle werelden**, nooit als progressie-pad
- Geen enkele content hard uitsluit, maar wel intelligent stuurt
- De gebruikers zijn refinement vijf-dimensionaal toont via de Refinement Compass
- Doorlopend leert van het werkelijke gedrag van de gebruiker

---

## 1. Kernprincipes (niet onderhandelbaar)

Deze acht principes zijn architecturaal. Een implementatie die er één van breekt is verkeerd, ook als ze technisch werkt.

1. **Register is een leerwereld, geen sociale klasse.** "Middenklasse" en "Elite" zijn interne mechaniek-termen. In de UI gebruiken we neutralere labels zoals "Dagelijkse wereld" en "Formele wereld". Klasse-bewustzijn opwekken is contraproductief in een leer-app.

2. **Middenklasse en Elite zijn parallelle werelden, geen progressie.** Een gebruiker doorloopt nooit "eerst middenklasse, dan elite". Beide zijn op elk moment toegankelijk voor elke gebruiker.

3. **Register is een UX-hint, nooit een hard filter.** Bias stuurt prioriteit en defaults. Bias filtert nooit content uit. WHERE-clauses op `register_relevance` of `applicable_archetypes` zijn verboden in selectie-queries.

4. **De gebruiker plaatst zichzelf nooit expliciet als klasse.** Onboarding vraagt wat hij wil **doen**, nooit wat hij **is**. Detectie van register-bias gebeurt server-side, op basis van gewogen signalen.

5. **Elite-mode = privacy-mode.** Elite-gebruikers krijgen by-default minimaal gamification, geen publieke score, automatisch `profiling_consent = false`. Gedragstracking pas na expliciete opt-in.

6. **Surface knowledge is een legitiem eindpunt.** Niet iedereen wil naar Grandmaster. Een toerist die "P3 op L2 weet te overleven aan een diner" in Italië is **klaar**, niet "opgegeven".

7. **Detectie is gelaagd en evolueert.** Geen enkel signaal alleen bepaalt het beeld van een gebruiker. Combinatie van archetype + kringen + interesses + tier + gedrag, doorlopend bijgesteld.

8. **De gebruiker kan altijd corrigeren.** Elke afgeleide bias is transparant zichtbaar en met één klik te overschrijven of vast te zetten.

---

## 2. De drie axes van het gebruikersprofiel

### Axis 1 — Demographic (auto-afgeleid)

Afgeleid uit `birth_year + gender_identity` op het bestaande `usersTable`.
Resultaat: `men_19_30 | women_19_30 | men_30_50 | women_30_50 | men_50plus | women_50plus | common`. Common voor X / non-binary / "prefer not to say". Cross-demographic mix-in al geïmplementeerd via `siblingDemographics()` in `learning-engine.ts`.

### Axis 2 — Archetype (expliciete keuze in onboarding)

Single-select primary, optionele secondary.

| Archetype-id | Wie | Pillar-bias |
|---|---|---|
| `business_professional` | Werkt in formele werk-context | P1, P2 hoog · P3 medium |
| `cultural_traveler` | Bezoekt landen, wil niet missen wat lokaal correct is | P3, P4 hoog · P1 medium |
| `civic_citizen` | Functioneert in eigen samenleving | Alle pillars gelijkmatig |
| `host_entertainer` | Ontvangt thuis, organiseert sociale samenkomsten | P3 hoog · P5 hoog · P1, P2 medium |
| `cross_cultural_executive` | Internationaal, hoge stakes, multi-cultureel | P1, P3, P4 hoog · alles boven L3 |
| `cultural_apprentice` | Wil het hele systeem doorgronden | Alle pillars, lineair, geen bias |

Universeel voor alle landen. Regio-specifieke uitbreidingen via `country_archetype_extensions` tabel (zie §11), pas wanneer een tweede land bewijst dat ze nodig zijn.

### Axis 3 — Interesses (drie sub-axes, één catalogus)

Eén `interest_catalog` tabel met items getagd op taxonomie + register + regio. Volledige uitwerking in §4.

```
3a. Sociale kringen — waar opereer je typisch
3b. Culturele interesses — waar praat je over
3c. Situational interests — in welke situaties speelt het
```

---

## 3. Register als parallelle werelden

### 3.1 Het principe

Beide registers op elk moment toegankelijk. De `learning_track_progress` tabel ondersteunt dit al via een unique index op (user_id, register, region_code, pillar, phase). Een gebruiker kan parallel voortgang hebben in `middle_class:BE`, `elite:BE`, `middle_class:FR`.

UX-implicaties:
- Geen "tier-upgrade-naar-elite" flow. Atelier toont een register-toggle (zie §10.1).
- Placement-test gebeurt **per (register, regio)-combinatie**.

### 3.2 Subscription-tier ≠ register

| Tier | Toegang |
|---|---|
| **Guest** | 1-2 regio's · beperkt aantal sessies/dag · beide registers tasteable |
| **Traveller** | Onbeperkt regio's · beide registers volledig toegankelijk |
| **Ambassador** | Alles van Traveller + AI-counsel onbeperkt + Compass premium-content + Elite privacy-mode |

Tier en register zijn orthogonaal.

### 3.3 Elite privacy-mode

Voor wie `register_bias = "elite"`, default-gedrag:
- `profiling_consent = false` automatisch (kan opt-in)
- Geen publieke `noble_score`-weergave
- Geen calling card / wardrobe / badges showcase in publieke views
- Geen leaderboards, geen sociale referrals
- Acceleration-badges privé in persoonlijk dossier
- Sessie-telemetrie minimaal: alleen wat nodig voor `learning_track_progress`
- Behavior_profile + Refinement Compass scores worden bijgewerkt maar niet publiek getoond
- Compass radar-chart alleen op privé-profielpagina, niet op publieke views

Technisch: `elite_privacy_mode: boolean` op `users`, default `true` zodra `register_bias = "elite"`.

---

## 4. Interesse-taxonomie & register-detectie

### 4.1 Register-getagde catalogus

Nieuwe tabel `interest_catalog`:

```ts
interest_catalog (
  id: text PRIMARY KEY,
  taxonomy: text NOT NULL,           // "sports" | "gastronomy" | "dress_codes"
                                     // | "cultural_interests" | "social_circles"
                                     // | "situational"
  registers: text[] NOT NULL,
  region_codes: text[],              // NULL = alle regio's
  display_order: integer,
  i18n_key: text NOT NULL
)
```

**Voorbeelden van tagging (illustratief, definitief in seed):**

| Taxonomy | Item-id | Registers |
|---|---|---|
| sports | football_soccer, cycling, fitness_gym | [middle_class] |
| sports | running, tennis, swimming, golf, hiking | [middle_class, elite] |
| sports | polo, equestrian, sailing_yachting, fencing, hunting_field_sports | [elite] |
| gastronomy | frituur, brasserie_bistro, beer_culture | [middle_class] |
| gastronomy | family_dining, regional_specialty, coffee_culture | [middle_class, elite] |
| gastronomy | haute_cuisine, michelin_dining, wine_pairing, caviar_oyster | [elite] |
| dress_codes | business_casual, smart_casual, sunday_best | [middle_class] |
| dress_codes | business_formal, semi_formal | [middle_class, elite] |
| dress_codes | black_tie, white_tie, morning_dress, bespoke_tailoring | [elite] |
| cultural_interests | popular_music, popular_literature, local_history, folk_traditions | [middle_class] |
| cultural_interests | history_general, architecture, theatre, languages | [middle_class, elite] |
| cultural_interests | classical_music, opera, fine_arts, antique_collecting, heraldry | [elite] |
| social_circles | corporate, neighbourhood, sporting_clubs, religious_community | [middle_class] |
| social_circles | academic, artistic_creative, expat_international | [middle_class, elite] |
| social_circles | diplomatic, philanthropic_boards, hereditary_associations, art_patronage | [elite] |

Region-aware items: cricket is `[middle_class]` voor IN/UK/AU/PK maar irrelevant voor BE/FR. Sumo-volgen is een legitieme cultural_interest in JP, niet daarbuiten.

### 4.2 Drielagige detectie

**Laag 1 — Initiële wereld-keuze (impliciet, neutrale taal)**

Onboarding-stap 4, na taal/regio, vóór archetype:

> **"Wat brengt u naar Cortéa?"**
> 
> A) Ik wil mij vlotter bewegen in werk- en sociale situaties van mijn dagelijks leven — vergaderingen, recepties, familiebijeenkomsten, kennismakingen.
> 
> B) Ik wil leren navigeren in formele en hoog-formele kringen — diplomatieke contexten, hogere echelon-evenementen, aristocratische codes.
> 
> C) Beide. Ik beweeg in verschillende werelden en wil in elk gepast zijn.

Mapping intern:
- A → `register_bias = "middle_class"`, `secondary_register = null`
- B → `register_bias = "elite"`, `secondary_register = null`, `elite_privacy_mode = true`
- C → `register_bias = "balanced"`

Wie A kiest behoudt **volledige toegang** tot Elite-content.

**Laag 2 — Register-getagde interesses tonen tijdens onboarding**

Stappen 6-8 tonen standaard alleen catalogus-items waar `registers` overlapt met de bias uit laag 1, plus uitklapbaar "Toon ook opties uit de andere wereld". Geen verstopping, gestuurde aandacht.

**Laag 3 — Server-side `register_bias` inference**

```
INPUT signals (gewicht):
  - Laag-1 keuze (gewicht 5)         → harde initiële richting
  - Archetype (gewicht 3)            → cross_cultural_executive, host_entertainer = +elite
                                        business_professional, civic_citizen = +middle_class
  - Subscription_tier (gewicht 2)    → Ambassador = +elite leunend
  - Geselecteerde interesses (gewicht 2) → telt elite-tagged minus middle_class-tagged items
  - Geselecteerde sociale kringen (gewicht 2) → diplomatic + philanthropic_boards = +elite
  - Country_of_origin (gewicht 1)    → zwak signaal
  - Actieve regio (gewicht 1)        → zwak signaal

OUTPUT:
  bias_score = som(elite_signals) - som(middle_class_signals)
  if bias_score > +6  → register_bias = "elite"
  if bias_score < -6  → register_bias = "middle_class"
  else                → register_bias = "balanced"
```

**Bias-evolutie:** na elke 5e voltooide sessie hercomputeert een sweeper de bias met gedragssignalen toegevoegd. `register_bias_locked = true` zet de evolutie stop. Audit-log in `register_bias_signals` jsonb-veld.

---

## 5. Onboarding-flow (canonieke volgorde)

```
1.  Account aanmaken (email + wachtwoord, of Google OAuth)
2.  Demografie (geboortejaar, gender_identity)
3.  Land van herkomst + actieve regio + voorkeurstaal
4.  ⭐ Wereld-keuze (laag-1 detectie, §4.2)
5.  Archetype-keuze (toont 6 universele + region-specific extensions waar van toepassing)
6.  Sociale kringen (multi-select, register-gefilterd, met "Toon meer")
7.  Culturele interesses (idem, register-gefilterd)
8.  Sport / gastronomie / dresscode interesses (idem, register-gefilterd)
9.  Leer-intentie per pillar (surface | competent | mastery) — optioneel, default = competent
10. Placement-test (binary search per pillar) of skip-with-warning
11. Welkom + eerste sessie aanbevolen
```

**Validatie:** stappen 1-5 verplicht; stappen 6-8 minimum 1 keuze, maximum 4 (focus); stap 9 optioneel; stap 10 skip toegestaan met expliciete waarschuwing.

---

## 6. Placement-test

### 6.1 Wanneer

Eenmalig na onboarding-stap 9, vóór de eerste echte sessie. Optioneel herhaalbaar wanneer de gebruiker:
- Een nieuwe `active_region` activeert
- Voor het eerst de andere register opent

### 6.2 Binary search per pillar

```
Stap 1: Bevraag op L3 (3 vragen)
   ├─ Score ≥ 70%   → bevraag op L4 (3 vragen)
   │    ├─ Score ≥ 70% → bevraag op L5 (3 vragen)
   │    │    ├─ Score ≥ 70%  → placement = L5 (mastered)
   │    │    └─ Score < 70%  → placement = L5 (start hier)
   │    └─ Score < 70% → placement = L4
   ├─ Score 40-69%  → bevraag op L2 (3 vragen)
   │    ├─ Score ≥ 70% → placement = L3
   │    └─ Score < 70% → placement = L2
   └─ Score < 40%   → bevraag op L1 (3 vragen)
        ├─ Score ≥ 70% → placement = L2
        └─ Score < 70% → placement = L1
```

Voor middenklasse met 4 pillars = ~24-36 vragen totaal.

### 6.3 Mechanism in code

Geen aparte placement-engine. Hergebruik `selectQuestions(ctx)` met een nieuwe vlag `is_placement: true` op `learning_track_sessions`. Wanneer true:
- Geen `progress.questions_done` increment
- Geen `progress.correct_streak` accumulatie
- Aparte UI-modus ("Kalibratie")
- Resultaat schrijft direct naar `learning_track_progress.current_level` zonder pass-window trigger
- Geen impact op `daily_streak`

### 6.4 Beloning

1. **Acceleration Badge** — `kind = "placement"` in `badgesTable`. Beeld: kompas/sextant. Voor Elite-gebruikers privé in dossier.
2. **Noble score boost** — `noble_score += 50 × (placement_level - 1)`. Voor Elite met `elite_privacy_mode = true`: toegekend maar nergens publiek.
3. **Skipped-content audit trail** — "U heeft Niveau 1-3 niet gespeeld; beschikbaar in de Bibliotheek." Niet verstoppen, optionele verdieping.

### 6.5 Anti-cheating

- Placement-vragen krijgen `is_placement_question = true` in `learning_track_attempts`. Komen niet meer in normale sessions terug.
- **Soft-recalibration:** als een gebruiker in zijn eerste 3 normale sessions onder 50% scoort, fires een prompt "We hebben uw beginpunt mogelijk te hoog ingeschat — wil u een korte herijking doen?" Vrijwillig, niet dwingend.

### 6.6 Skip-optie

Toegestaan met waarschuwing: "Zonder kalibratie start u op Niveau 1. Dit kan repetitief aanvoelen als u al ervaring heeft."

---

## 7. Selection-engine uitbreidingen

### 7.1 Bestaande cascade (al geïmplementeerd, niet aanpassen)

In `learning-engine.ts`:
1. Full match: register + pillar + phase + level + region + lang + demographic
2. Re-rank op `interest_tags` + origin/contrast boost
3. Common-fill als pool < 60% van sessionSize
4. Cross-demographic verplichte mix-in (van level threshold)
5. Backfill van level-1

Plus `siblingDemographics()`, remediation slots vooraan, pure helpers in `learning-engine-pure.ts`.

**Niet herschrijven.**

### 7.2 Nieuwe re-rank componenten (uitbreiding op tier 2)

```ts
function score(q: RawQuestion, ctx): { score: number; source: ... } {
  let s = 0;
  
  // BESTAANDE LOGICA: interest_tags overlap (×10), origin/contrast boost (+7/+5)
  
  // NIEUWE COMPONENTEN:
  
  // Register match
  if (q.register_relevance === ctx.register_bias) s += 4;
  if (q.register_relevance === "shared") s += 1;
  
  // Archetype match
  if (q.applicable_archetypes?.includes(ctx.archetype)) s += 6;
  if (ctx.secondary_archetype && q.applicable_archetypes?.includes(ctx.secondary_archetype)) s += 3;
  
  // Sociale kringen overlap
  const circleOverlap = q.social_circle_tags?.filter(c => ctx.userCircles.has(c)).length ?? 0;
  s += circleOverlap * 3;
  
  // Culturele interesse overlap
  const cultOverlap = q.cultural_interest_tags?.filter(c => ctx.userCultural.has(c)).length ?? 0;
  s += cultOverlap * 2;
  
  // Refinement Compass dimensie-relevantie (zie §9)
  // Vragen die de gebruiker's zwakkere dimensies trainen krijgen lichte boost
  if (q.primary_dimension && ctx.compass_scores) {
    const dimensionScore = ctx.compass_scores[q.primary_dimension];
    if (dimensionScore < 50) s += 3;       // versterkt zwakke dimensies
    else if (dimensionScore > 85) s -= 1;  // sterke dimensies krijgen iets minder slots
  }
  
  return { score: s, source };
}
```

`SelectionContext` interface uitbreiden met:
```ts
register_bias: "middle_class" | "elite" | "balanced";
archetype: string;
secondary_archetype: string | null;
userCircles: Set<string>;
userCultural: Set<string>;
compass_scores: CompassScores;  // {attentiveness, composure, discernment, diplomacy, presence}
```

### 7.3 Geen harde filters

`register_relevance`, `applicable_archetypes`, `social_circle_tags`, `cultural_interest_tags`, `primary_dimension` worden **nooit** als WHERE-clause gebruikt. Altijd alleen score-boost in re-rank.

---

## 8. Progressie & leer-intentie

### 8.1 Gewogen voortgang per archetype

UI toont **niet** een ongewogen gemiddelde. Voortgang archetype-gewogen:

```
business_professional (P1+P2 = gewicht 0.3, P3+P4 = gewicht 0.2):
P1 op L3 = 60% → 0.6 × 0.3 = 0.18
P2 op L3 = 60% → 0.6 × 0.3 = 0.18
P3 op L1 = 20% → 0.2 × 0.2 = 0.04
P4 op L1 = 20% → 0.2 × 0.2 = 0.04
                          ─────
                          44% (gewogen, niet 35% ongewogen)
```

### 8.2 Surface | Competent | Mastery

Per (register, regio, pillar) een `learning_intent`:

| Intent | Doel-niveau | UI-feedback |
|---|---|---|
| `surface` | L1-L2 | "Klaar — u heeft de basis" als L2 bereikt |
| `competent` | L3-L4 | "Klaar — u bent competent" als L4 bereikt — default |
| `mastery` | L5 | "Klaar — u bent meester" als L5 bereikt |

Bepaalt **geen** content-toegang. Alle vragen blijven beschikbaar. Bepaalt alleen wat als "voltooid" geldt.

---

## 9. Refinement Compass — De graadmeter

De uitwendige feedbacklaag die de gebruiker zijn vijf-dimensionale refinement toont. Geen score-systeem in punten, wel een kompas waarvan de pijl beweegt naarmate iemand sessies voltooit.

### 9.1 De vijf dimensies

| Dimensie | UI-label | Wat het meet |
|---|---|---|
| **Attentiveness** | Aandachtigheid | Het vermogen om de ruimte, de andere, en de subtekst correct te lezen |
| **Composure** | Bedaardheid | Inwendige rust onder sociale druk; niet reactief |
| **Discernment** | Onderscheid | Beoordelingsvermogen: wat is hier passend, voor deze persoon, in deze context |
| **Diplomacy** | Diplomatie | Het navigeren van moeilijke momenten zonder verlies van waardigheid |
| **Presence** | Aanwezigheid | De fysieke en houdings-component: hoe je staat, kijkt, beweegt, spreekt |

Etiquette-termen, niet psychologie-jargon. Onder de motorkap update zich `behavior_profile.eq_dimensions` op `usersTable`. Mapping in §9.4. Inhoudelijke onderbouwing van elke dimensie via canonieke ankers staat in de Cortéa Content Quality Standard §3.

### 9.2 Dimensie-tagging op vragen

Elke vraag oefent primair 1 of 2 dimensies. Niet meer dan 2 — anders verwatert de meetfunctie.

| Vraag-type | Primary | Secondary |
|---|---|---|
| "U leest de stilte van uw gesprekspartner verkeerd; hij is geërgerd." | attentiveness | discernment |
| "U ontvangt onverwacht harde feedback in een vergadering. Reactie?" | composure | diplomacy |
| "U kiest welke begroeting past bij een 65-jarige zakenpartner uit Wallonië." | discernment | — |
| "U ontmijnt een conflict tussen twee gasten aan tafel." | diplomacy | composure |
| "U stapt een receptie binnen waar u niemand kent." | presence | composure |

Tag-discipline: elke vraag krijgt minimum 1 dimensie. Vraag zonder primaire dimensie wordt geweigerd in import-pipeline (zie §11).

### 9.3 Score-mechaniek

Initiële waarde: 50 voor elke dimensie. Geen 0.

Update per voltooide vraag:

```
Bij correct (answer_tier == 1):
  primary_score   += 0.6 × delta_factor(level)
  secondary_score += 0.3 × delta_factor(level)

Bij gedeeltelijk (answer_tier == 2):
  primary_score   += 0.2 × delta_factor(level)
  secondary_score += 0.1 × delta_factor(level)

Bij incorrect (answer_tier == 3):
  primary_score   -= 0.3 × delta_factor(level)
  secondary_score -= 0.15 × delta_factor(level)

delta_factor(level) = level × 0.5     // L1=0.5, L3=1.5, L5=2.5
```

**Bovengrens:** 100 (asymptotisch — een score van 95 stijgt nauwelijks nog, zakt snel bij fouten).
**Decay:** elke 30 dagen zonder activiteit zakt elke dimensie met 2 punten.

### 9.4 Mapping naar bestaande `behavior_profile`

Bestaande Bolton/Goleman/Mehrabian velden blijven bron-van-waarheid. De Compass projecteert er bovenop:

```ts
// pure mapping-functie in learning-engine-pure.ts:

export function projectBehaviorToCompass(profile: BehaviorProfile): CompassScores {
  return {
    attentiveness: weighted({
      listening_score: 0.5,
      nonverbal_awareness: 0.5,
    }),
    composure: profile.eq_dimensions.self_regulation,
    discernment: weighted({
      self_awareness: 0.6,
      empathy: 0.4,
    }),
    diplomacy: weighted({
      social_skill: 0.7,
      conflict_mode_score: 0.3,  // collaborate=80, accommodate=60, avoid=40, compete=30
    }),
    presence: weighted({
      assertiveness_style_score: 0.5,
      nonverbal_awareness: 0.5,
    }),
  };
}
```

Compass-score updates triggeren proportionele `behavior_profile` updates. De twee blijven synchroon.

### 9.5 UI-display

Twee weergave-modi op profielpagina:

**Radar-chart:** vijfhoek met de vijf dimensies. Punten = huidige scores. Schaduw = evolutie laatste 30 dagen (lichter = vroeger, donkerder = nu).

**Bar-list:** dimensie + label + score + horizontale balk. Voor accessibility-modus.

**Tooltip per dimensie:** klik op "Composure 82" → wat de dimensie betekent (één zin), recente sessies die de score beïnvloedden, en de canonieke bron die de meting onderbouwt (uit Quality Standard §3).

### 9.6 Toon — graadmeter, niet trofee

UI-toon moet bij reflectie passen, niet bij gamification:
- ❌ "🎉 Composure +5!"
- ✅ "Composure: 82 (was 79). Reden: u toonde gemeten reactie op de feedback-sessie van vandaag."

Compass is een spiegel, geen badge. Mag niet door elkaar lopen met `noble_score` of `daily_streak` (die zijn motivationele mechaniek).

### 9.7 Regionale kalibratie

Niet elke cultuur weegt de dimensies gelijk. De Compass kalibreert per `active_region`:

| Cultuur-cluster | Hoge weging | Lagere weging |
|---|---|---|
| Noord-Europees (BE, NL, DE, SE, DK) | Discernment, Composure | Presence |
| Anglo (UK, IE, US, AU, CA) | Diplomacy, Composure | — |
| Latijns (FR, IT, ES, PT) | Presence, Diplomacy | — |
| Confucius-oost (JP, KR, CN) | Attentiveness, Discernment | Presence |
| Arabisch (AE, SA, EG) | Diplomacy, Presence | — |
| Zuid-Aziatisch (IN, PK, BD) | Attentiveness, Diplomacy | — |

Implementatie via `region_dimension_weights` config-tabel met 5 multipliers per region_code, default 1.0. Specifieke gewichten per regio vereisen onderbouwing in de regional grounding sheet (Quality Standard §4).

### 9.8 Privacy-mode interactie

Voor `elite_privacy_mode = true`:
- Compass werkt intern (scores updaten)
- Niet publiek getoond
- Alleen in privé-sectie "Mijn dossier"
- Geen radar-chart op publieke pagina's; placeholder "Refinement is een private aangelegenheid"

---

## 10. UI-implicaties

### 10.1 Atelier-toggle

Boven de pillar-grid:

```
[ Dagelijkse wereld ]   [ Formele wereld ]   [ Beide ]
```

Default-selectie op `register_bias`. Handmatige wissel:
- Verandert pillar-pool
- Telt als signaal voor laag-3 bias-evolutie
- Geen toegangsmelding, geen upgrade-prompt

### 10.2 Profiel — "Hoe Cortéa u leest"

Aparte instellingen-sectie. Toont:
- Huidige `register_bias` in neutrale taal
- Audit-log uit `register_bias_signals`
- Knop "Toon mij content uit beide werelden gelijkmatig" → `balanced` + `locked`
- Knop "Aanbevelingen herijken"
- Knop "Doe een nieuwe kalibratie"

### 10.3 Profiel — Refinement Compass

Eigen sectie. Toont:
- Radar-chart (zie §9.5) met 30-daagse evolutie-schaduw
- Bar-list als alternatieve weergave
- Per dimensie tooltip met canonieke bron-onderbouwing
- Voor `elite_privacy_mode = true`: alleen op privé-profielpagina, niet op publieke views

### 10.4 Onboarding-validatie

- Stap 4 (wereld-keuze): radio, één verplicht
- Stap 5 (archetype): radio, één verplicht; secondary toonbaar via "Mijn rol verschilt"
- Stappen 6-8 (interesses): minimum 1, maximum 4
- Stap 9 (intentie): optioneel
- Stap 10 (placement): default = doen, skip via secondary button met waarschuwing

---

## 11. Schema-aanpassingen (consolidatie)

### 11.1 Nieuwe tabel: `interest_catalog`

Zoals in §4.1.

### 11.2 Nieuwe tabel: `country_archetype_extensions`

```ts
export const countryArchetypeExtensionsTable = pgTable("country_archetype_extensions", {
  region_code: text("region_code").notNull(),
  archetype_id: text("archetype_id").notNull(),
  i18n_key: text("i18n_key").notNull(),
  pillar_weights: jsonb("pillar_weights").$type<Record<string, number>>().notNull(),
}, (t) => [primaryKey({ columns: [t.region_code, t.archetype_id] })]);
```

Leeg bij start. Vullen wanneer tweede land bewijst dat extra archetype nodig is.

### 11.3 Nieuwe tabel: `region_dimension_weights`

```ts
export const regionDimensionWeightsTable = pgTable("region_dimension_weights", {
  region_code: text("region_code").primaryKey(),
  attentiveness: numeric("attentiveness", { precision: 3, scale: 2 }).notNull().default("1.00"),
  composure: numeric("composure", { precision: 3, scale: 2 }).notNull().default("1.00"),
  discernment: numeric("discernment", { precision: 3, scale: 2 }).notNull().default("1.00"),
  diplomacy: numeric("diplomacy", { precision: 3, scale: 2 }).notNull().default("1.00"),
  presence: numeric("presence", { precision: 3, scale: 2 }).notNull().default("1.00"),
  source_anchor: text("source_anchor")
});
```

### 11.4 Nieuwe tabel: `compass_history`

```ts
export const compassHistoryTable = pgTable("compass_history", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  recorded_at: timestamp("recorded_at").notNull().defaultNow(),
  attentiveness: integer("attentiveness").notNull(),
  composure: integer("composure").notNull(),
  discernment: integer("discernment").notNull(),
  diplomacy: integer("diplomacy").notNull(),
  presence: integer("presence").notNull(),
}, (t) => [index("ch_user_time_idx").on(t.user_id, t.recorded_at)]);
```

Snapshot per dag via cron. Voor 30-daagse evolutie-overlay op radar.

### 11.5 Toevoegingen aan `users`

```ts
// Profiel-axes
archetype: text("archetype"),
secondary_archetype: text("secondary_archetype"),
social_circles: jsonb("social_circles").$type<string[]>().notNull().default([]),
cultural_interests: jsonb("cultural_interests").$type<string[]>().notNull().default([]),
selected_interests: jsonb("selected_interests").$type<string[]>().notNull().default([]),
// situational_interests bestaat al — behouden

// Register-bias
register_bias: text("register_bias")
  .$type<"middle_class" | "elite" | "balanced">()
  .notNull().default("balanced"),
secondary_register: text("secondary_register").$type<"middle_class" | "elite" | null>(),
register_bias_signals: jsonb("register_bias_signals")
  .$type<Array<{signal: string, value: string, weight: number, applied_at: string}>>()
  .notNull().default([]),
register_bias_locked: boolean("register_bias_locked").notNull().default(false),
elite_privacy_mode: boolean("elite_privacy_mode").notNull().default(false)

// Legacy — read-only 90 dagen, dan droppen:
// interests_sports, interests_cuisine, interests_dress_code
```

### 11.6 Toevoegingen aan `learning_track_questions`

```ts
register_relevance: text("register_relevance")
  .$type<"middle_class" | "elite" | "shared">()
  .notNull().default("shared"),
applicable_archetypes: jsonb("applicable_archetypes").$type<string[]>().notNull().default([]),
social_circle_tags: jsonb("social_circle_tags").$type<string[]>().notNull().default([]),
cultural_interest_tags: jsonb("cultural_interest_tags").$type<string[]>().notNull().default([]),
primary_dimension: text("primary_dimension")
  .$type<"attentiveness" | "composure" | "discernment" | "diplomacy" | "presence">()
  .notNull(),
secondary_dimension: text("secondary_dimension")
  .$type<"attentiveness" | "composure" | "discernment" | "diplomacy" | "presence" | null>()
```

`interest_tags` (bestaand) blijft voor backwards compat.

### 11.7 Toevoegingen aan `learning_track_sessions` / `_attempts` / `_progress`

```ts
// learning_track_sessions:
is_placement: boolean("is_placement").notNull().default(false)

// learning_track_attempts:
is_placement_question: boolean("is_placement_question").notNull().default(false)

// learning_track_progress:
learning_intent: text("learning_intent")
  .$type<"surface" | "competent" | "mastery">()
  .notNull().default("competent")
```

### 11.8 Nieuwe badge-types

In `badges`: `kind = "placement"` (één per register × pillar × level). Bij placement-resultaat fired automatic toekenning via `badge-service.ts`.

---

## 12. Wat NIET doen

1. "Middenklasse" of "Elite" als zichtbaar label gebruiken
2. De gebruiker dwingen één wereld te kiezen voor altijd
3. Harde filters in selectie-queries (geen `WHERE register_relevance = ...` ooit)
4. De bias permanent vastzetten na onboarding
5. Alle interesses-categorieën als geheel klassificeren ("Sport" is geen klasse; *polo* is)
6. Placement verplicht maken
7. "Tier-upgrade-naar-elite" in de UI suggereren
8. `noble_score`, `daily_streak`, `wardrobe_unlocks`, Compass radar-chart publiek tonen voor `elite_privacy_mode = true`
9. Alle 206 landen in één keer de catalogus + tagging laten doen (BE eerst als master template)
10. De bestaande `selectQuestions` cascade herschrijven (uitbreiden in re-rank, niet vervangen)
11. **Compass-toon als gamification framen.** Geen "🎉 +5!" celebrations. Reflectief, niet motivationeel
12. **Compass-dimensies oefenen wat ze niet zeggen te oefenen.** Een vraag getagd `composure` moet werkelijk composure-mechaniek bevatten — anders verontreinigt ze de meting (zie Quality Standard §3, §11)

---

## 13. Implementatie-volgorde

| # | Actie | Type | Dep. | Effort |
|---|---|---|---|---|
| 1 | `interest_catalog` tabel + BE seed | Schema + content | Geen | 0.5 dag |
| 2 | `country_archetype_extensions` (leeg) | Schema | Geen | 0.25 dag |
| 3 | `region_dimension_weights` + BE seed | Schema + content | Geen | 0.25 dag |
| 4 | `compass_history` tabel + cron-job | Schema + job | 5 | 0.5 dag |
| 5 | `users` velden uit §11.5 | Schema migratie | Geen | 0.25 dag |
| 6 | `learning_track_questions` velden uit §11.6 | Schema migratie | Geen | 0.25 dag |
| 7 | `learning_track_sessions/attempts/progress` velden uit §11.7 | Schema migratie | Geen | 0.25 dag |
| 8 | Backfill: legacy interests → selected_interests | Migratie | 1, 5 | 0.5 dag |
| 9 | `projectBehaviorToCompass` mapping-functie + tests | Pure logica | 5 | 0.5 dag |
| 10 | Onboarding-flow (stappen 4-9) volgens §5 | UI | 1, 5 | 2 dagen |
| 11 | Register-bias inference functie + tests | Pure logica | 5 | 1 dag |
| 12 | Selection-engine re-rank uitbreiding | Backend | 6, 11 | 1 dag |
| 13 | Placement-test endpoint + UI flow | Backend + UI | 7, 11, 12 | 3 dagen |
| 14 | Acceleration badges seed + toekenning | Backend | 7, 13 | 0.5 dag |
| 15 | Atelier register-toggle | UI | 11 | 0.5 dag |
| 16 | Profiel "Hoe Cortéa u leest" pagina | UI | 11 | 1 dag |
| 17 | Profiel Refinement Compass sectie (radar + bars) | UI | 4, 9 | 1.5 dagen |
| 18 | Bias-evolutie sweeper (na elke 5e sessie) | Background job | 11 | 0.5 dag |
| 19 | Compass score-update logica in session completion | Backend | 6, 9 | 0.5 dag |
| 20 | Soft-recalibration trigger | Backend | 13 | 0.5 dag |
| 21 | Gewogen progressie-display | UI | 5, 10 | 0.5 dag |
| 22 | Elite privacy-mode enforcement audit | Frontend audit | 5 | 1 dag |
| 23 | Deprecate legacy interest fields | Cleanup | 8 | 0.25 dag |

**Totaal:** ~16 dagen voor één ervaren full-stack dev die de codebase kent.

---

## 14. Acceptatie-criteria

Het framework werkt correct wanneer **alle** onderstaande tests slagen:

1. **Polo-test:** een 35-jarige Belgische bouwvakker die kiest voor "vlotter bewegen in werk- en sociale situaties" + archetype `civic_citizen` ziet **nergens** "polo" of "fox hunting" als sport-suggestie zonder eerst expliciet "Toon meer opties" te klikken.

2. **Cross-world test:** dezelfde gebruiker kan met één klik in de Atelier "Formele wereld" openen en een volledige sessie van 8 vragen krijgen — geen toegangsmelding, geen lege pool.

3. **Elite recognition test:** een vermogende erfgenaam die `host_entertainer` + `philanthropic_boards` + Ambassador-tier + "Formele wereld" kiest krijgt automatisch `register_bias = elite` zonder ooit dat label te zien, en zijn onboarding-interesses tonen "polo, sailing_yachting, fencing" prominent met "voetbal" onder "Toon meer".

4. **Privacy test:** dezelfde Elite-gebruiker heeft `elite_privacy_mode = true`, zijn `noble_score` en zijn Refinement Compass radar-chart zijn nergens publiek zichtbaar, geen badges-showcase, en `behavior_profile` wordt niet bijgewerkt zonder opt-in.

5. **No hard filter test:** SQL-audit op `learning-engine.ts` toont **geen** WHERE-clause op `register_relevance`, `applicable_archetypes`, `social_circle_tags`, `cultural_interest_tags`, of `primary_dimension`.

6. **Placement reward test:** een gebruiker die op L4 placement scoort krijgt: een "Acceleration"-badge per pillar + 150 noble_score (bij `elite_privacy_mode = false`) + Bibliotheek-link naar overgeslagen content + `current_level = 4` zonder pass-window trigger.

7. **Soft recalibration test:** een gebruiker die in zijn eerste 3 normale sessions onder 50% scoort krijgt een prompt voor herijking, vrijwillig.

8. **Surface intent test:** een gebruiker met `learning_intent = "surface"` op P3-IT die L2 bereikt krijgt UI-feedback "Klaar — u heeft de basis", niet "33% voltooid".

9. **Bias transparantie test:** elke gebruiker kan in zijn profiel zien welke signalen zijn `register_bias` hebben bepaald, en kan met één klik resetten of vastzetten.

10. **Legacy compat test:** bestaande gebruikers met data in `interests_sports/cuisine/dress_code` zien hun keuzes correct gemigreerd naar `selected_interests` na de backfill, zonder data-verlies.

11. **Compass coherence test:** een gebruiker die uitsluitend `composure`-getagde vragen correct beantwoordt mag binnen 30 dagen niet zien dat zijn `presence` of `attentiveness` significant verbeterd is. Dimensie-isolatie moet werken.

12. **Privacy-compass test:** een Elite-gebruiker met `elite_privacy_mode = true` ziet zijn radar-chart op zijn privé-profielpagina, maar **niet** op publieke calling card en **niet** in eventuele referral-share views.

13. **Regional weight test:** dezelfde vraag met `primary_dimension = attentiveness` levert een grotere score-toename op voor een gebruiker met `active_region = JP` dan voor dezelfde dimensie met `active_region = BE`. Asymmetrie moet meetbaar zijn.

14. **Compass-tone test:** UI-strings audit toont **geen** "🎉" of "+5!" cele­brations bij Compass-updates. Alle Compass-feedback in reflectieve toon.

---

## 15. Wijzigingsgeschiedenis

| Versie | Datum | Wijziging |
|---|---|---|
| 1.0 | 8 mei 2026 | Initiële canonieke prompt: profiel-architectuur, onboarding, placement, selection-engine, progressie, register-bewustzijn |
| 1.1 | 8 mei 2026 | Refinement Compass geïntegreerd als §9. Sister-document Cortéa Content Quality Standard (canonieke bronnen, editoriaal review-protocol) als aparte deliverable. Schema-toevoegingen voor Compass (region_dimension_weights, compass_history, primary_dimension, secondary_dimension). Drie extra acceptatie-criteria (11, 12, 13, 14). UI-tone regel voor Compass-feedback toegevoegd. |

---

*Einde Master Framework Prompt v1.1. Implementation-ready voor doorgifte aan dev-team. Lees in combinatie met Cortéa Content Quality Standard v1.0 voor de inhoudelijke kwaliteits-discipline.*
