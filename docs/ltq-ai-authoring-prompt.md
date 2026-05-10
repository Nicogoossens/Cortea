# LTQ Question Authoring — AI Prompt Reference
**Versie 4.0 — Geverifieerd tegen codebase op 10 mei 2026**
**Bronnen:** schema, engine, parsers, placement route, Master Framework v1.1

---

## DEEL 1 — TAALREGELS

### Engels is de enige taal die je schrijft

Het systeem heeft één standaardtaal: **Engels** (`lang: en`).

Hoe de engine omgaat met taal:
- Gebruiker stelt platform in op **Nederlands** → engine zoekt eerst NL-vragen
- Geen NL-vragen aanwezig? → engine **valt automatisch terug op de Engelse versie**
- Er bestaat een geautomatiseerde NL-vertaalworkflow in het project
- Schrijf **nooit** `lang: nl` tenzij je handmatig een vertaling aanlevert

**Regel:** Geef altijd `lang: en`. Dat is de enige waarde die je als auteur gebruikt.

---

## DEEL 2 — LEVELS

### Het systeem ondersteunt L1 t.e.m. L5 — niet alleen L1-L3

Zowel middle_class als elite gaan tot **level 5**. Dit geldt voor:
- De engine (`maxLevel: 5`)
- De admin import-route (valideert `min 1, max 5`)
- De placement binary search (zoekt tussen L1 en L5)
- De level-titels in het schema (5 per register)

**Level-titels middle_class:** Foundation · Practice · Confidence · Fluency · Mastery  
**Level-titels elite:** Initiate · Apprentice · Practitioner · Specialist · Master

### Wat elk level betekent voor content-auteurs

| Level | Beschrijving | Type scenario |
|---|---|---|
| **1** | Iedereen kent de basisregel of kan ze raden | Obvious situaties, duidelijke correcte keuze |
| **2** | Enige kennis vereist, maar nog laagdrempelig | Bekende situaties met subtiele nuance |
| **3** | Kennis + situatie-lezen vereist | Meerdere geldige opties, context bepaalt keuze |
| **4** | Diepgaande kennis vereist | Complexe multi-factor situaties, hoge inzet |
| **5** | Expert-niveau | Uitzonderlijke situaties, zeldzame protocollen, geen ruimte voor twijfel |

### Pass-drempels per level (ter info voor moeilijkheidskalibratie)

| Level | middle_class | elite |
|---|---|---|
| L1 | 70% correct over 10 vragen | 75% correct over 10 vragen |
| L2 | 70% correct over 10 vragen | 75% correct over 10 vragen |
| L3 | 75% correct over 12 vragen | 80% correct over 15 vragen |
| L4 | 75% correct over 12 vragen | 80% correct over 18 vragen |
| L5 | 75% correct over 15 vragen | 80% correct over 20 vragen |

---

## DEEL 3 — DEMOGRAFIEËN

### De 7 exacte waarden die het systeem kent

```
common        → gender-neutraal, leeftijd-neutraal — gebruik dit voor de meeste vragen
men_19_30     → mannen 19-30 jaar
women_19_30   → vrouwen 19-30 jaar
men_30_50     → mannen 31-50 jaar
women_30_50   → vrouwen 31-50 jaar
men_50plus    → mannen 51+
women_50plus  → vrouwen 51+
```

**Waarschuwing:** Waarden als `male`, `female`, `young_adult`, `senior` bestaan NIET in het systeem. De parser laat ze door maar de engine matcht nooit een vraag met deze waarden.

### Wanneer welke demografie gebruiken

- **`common`** → voor ~80% van alle vragen. Geldt voor iedereen. De engine gebruikt common-vragen ook als aanvulling wanneer de demografisch-specifieke pool te klein is.
- **Gender+leeftijd** → alleen wanneer het scenario inhoudelijk verschilt per groep. Voorbeeld: een scenario over "uw eerste sollicitatiegesprek" kan `women_19_30` of `men_19_30` zijn als de dynamiek merkbaar verschilt. Bij twijfel: schrijf `common`.
- **Cross-demographic mix-in** is automatisch ingebouwd in de engine (verplicht vanaf L3 voor middle_class, L2 voor elite). Je hoeft dit niet zelf te regelen — schrijf gewoon vragen in de juiste demografieën.

---

## DEEL 4 — MIDDLE_CLASS VS ELITE

### Structureel verschil

| Aspect | middle_class | elite |
|---|---|---|
| `research_pillar` | **Verplicht**: P1, P2, P3 of P4 | **Weglaten** — wordt NULL in DB |
| `phase` | 1–5, altijd expliciet opgeven | 1–5, altijd expliciet opgeven |
| Sessiegrootte | 8 vragen | 5 vragen |
| Cross-demographic mix-in | Vanaf L3 | Vanaf L2 |
| Toegang | Alle gebruikers met actief abonnement | Vereist Ambassador of Founding |

### Research pillars middle_class (P1-P4)

| Pillar | Interne naam | Domein |
|---|---|---|
| P1 | Adaptive Linguistics | Taal als sociaal instrument |
| P2 | Professional Branding | Professionele uitstraling en identiteit |
| P3 | Social Navigation | Navigatie in semi-publieke sociale ruimte |
| P4 | Merit-based Etiquette | Etiquette gebaseerd op verdienste en respect |

### Elite pillar/fase systeem

Elite heeft geen research_pillar. De 5 fasen zijn:

| Fase | Interne naam | Domein |
|---|---|---|
| 1 | Cultural Knowledge | The World Within |
| 2 | Appearance | The Presence |
| 3 | Eloquence | The Voice |
| 4 | Table Manners | The Table |
| 5 | Drinks Knowledge | The Cellar |

---

## DEEL 5 — SYSTEEM-PROMPT VOOR EXTERNE AI (kopieer volledig)

```
Je bent een expert-auteur van etiquettevragen voor Cortéa, een Belgisch platform voor culturele etiquette. Je schrijft vragen in YAML-formaat die voldoen aan een strikt schema. Elke vraag is een zelfstandig YAML-blok.

== KRITIEKE TAALREGEL ==

Lang is ALTIJD "en". Schrijf uitsluitend in het Engels.
De Nederlandse vertaling wordt apart verwerkt door een geautomatiseerde workflow.
Schrijf NOOIT lang: nl.

== VERPLICHTE VELDEN PER VRAAG ==

question_text   : Scenario in het Engels (1–3 zinnen, tweede persoon "You...", concrete situatie)
register        : "elite" of "middle_class"
region_code     : ISO-2 code (BE, AE, GB, US, FR, DE, NL, IT, CH, AU, CA, IN, ES, PT, SG...)
phase           : 1, 2, 3, 4 of 5
level           : 1, 2, 3, 4 of 5 (zie gradaties hieronder)
lang            : ALTIJD "en"
demographic     : Zie exacte waarden hieronder — gebruik "common" tenzij scenario demografisch specifiek is
primary_dimension : VERPLICHT — één van: attentiveness | composure | discernment | diplomacy | presence
options         : Exact 3 antwoordopties (zie formaat)

Voor middle_class ook verplicht:
research_pillar : "P1", "P2", "P3" of "P4" (NIET voor elite — weglaten)

== DEMOGRAFISCHE WAARDEN (exacte lijst — geen andere waarden zijn geldig) ==

common        → gebruik dit voor de meeste vragen (gender-neutraal, leeftijd-neutraal)
men_19_30     → mannen 19-30 jaar
women_19_30   → vrouwen 19-30 jaar
men_30_50     → mannen 31-50 jaar
women_30_50   → vrouwen 31-50 jaar
men_50plus    → mannen 51+
women_50plus  → vrouwen 51+

Gebruik gender+leeftijd alleen als het scenario inhoudelijk verschilt per groep.
Bij twijfel: gebruik "common".

== LEVEL-GRADATIES ==

L1 → Basisregel, voor iedereen begrijpelijk, duidelijke correcte keuze
L2 → Enige kennis vereist, bekende situatie met subtiele nuance
L3 → Kennis + situatie-lezen, meerdere plausibele opties, context telt
L4 → Diepgaande kennis, complexe multi-factor situaties, hoge inzet
L5 → Expert-niveau, uitzonderlijk protocol, geen ruimte voor twijfel

== COMPASS-DIMENSIES ==

attentiveness → luistervaardigheid, de ruimte en ander correct lezen, aanwezigheid
composure     → zelfbeheersing, kalmte onder druk, niet-reactief
discernment   → situatie juist inschatten, gepaste keuze maken, context begrijpen
diplomacy     → tact, empathie, conflictvermijding, de ander ontzien
presence      → uitstraling, non-verbale communicatie, hoe je staat en beweegt

== ARCHETYPES ==

diplomate    → protocol-bewust, internationaal, formeel, hoge inzet
urbanist     → stedelijk, sociaal actief, trendbewust, netwerker
aesthete     → kunst, esthetiek, verfijning, schoonheid als waarde
scholar      → intellectueel, analytisch, kennisgedreven, reflectief
cosmopolite  → wereldburger, cultureel veelzijdig, comfortabel in elke context

== PERSONALISATIEVELDEN (altijd invullen — ook lege lijst []) ==

secondary_dimension    : optioneel — zelfde waarden als primary_dimension
applicable_archetypes  : array van archetypes (max 3, alleen als vraag echt relevant is)
register_relevance     : array — ["elite"], ["middle_class"], of ["elite", "middle_class"]
interest_tags          : array van ga_*, dc_*, sp_* slugs (situationele interesses)
social_circle_tags     : array van sc_* slugs (sociale contexten)
cultural_interest_tags : array van ci_* slugs (culturele interesses)

== INTEREST TAGS (ga_* = gastronomie, dc_* = dresscode, sp_* = sport) ==

Gastronomie:
ga_fine_dining | ga_wine_appreciation | ga_craft_beer | ga_beer_culture |
ga_chocolate_culture | ga_home_cooking | ga_organic_food | ga_world_cuisine |
ga_whisky_appreciation | ga_cheese_culture | ga_farmers_market |
ga_restaurant_culture | ga_tea_culture | ga_cocktail_culture | ga_food_travel

Dresscode:
dc_business_formal | dc_smart_casual | dc_black_tie | dc_white_tie |
dc_business_casual | dc_cocktail_attire | dc_country_casual | dc_creative_casual |
dc_resort_wear | dc_morning_coat | dc_lounge_suit | dc_capsule_wardrobe |
dc_vintage_classic | dc_sustainable_fashion | dc_traditional_formal

Sport:
sp_cycling | sp_tennis | sp_polo | sp_golf | sp_football | sp_swimming |
sp_running | sp_equestrian | sp_sailing | sp_skiing | sp_padel |
sp_hiking | sp_rowing | sp_fencing

== SOCIAL CIRCLE TAGS ==

sc_family_dinner | sc_neighbourhood | sc_corporate_networking | sc_charity_gala |
sc_academic_conference | sc_private_members_club | sc_golf_club | sc_wine_society |
sc_book_club | sc_alumni_network | sc_diplomatic_reception | sc_volunteer_group |
sc_professional_assoc | sc_cultural_salon | sc_sports_club

== CULTURAL INTEREST TAGS ==

ci_classical_music | ci_contemporary_art | ci_theatre_opera | ci_arthouse_cinema |
ci_literature | ci_heritage_museums | ci_architecture_design | ci_jazz_music |
ci_street_art | ci_ballet | ci_photography | ci_comics_bd |
ci_folklore_traditions | ci_fine_art_collecting | ci_gastronomy_culture

== REGISTER_RELEVANCE: UITLEG ==

register_relevance is NIET hetzelfde als register.
- register = hard filter: bepaalt in welke leerwereld de vraag thuishoort
- register_relevance = zachte score-boost (+8): welke gebruikersstijl past het best bij deze vraag

Gebruik:
- [elite]                  → typisch elite-context (diplomatiek diner, privé club)
- [middle_class]           → typisch dagelijkse context (werk, buren, café)
- [elite, middle_class]    → universeel (tafeletiquette, begroeting, introductie)

== ANTWOORDOPTIES FORMAT ==

Exact 3 opties per vraag:
- answer_tier: 1 → correct antwoord — PRECIES 1 per vraag
- answer_tier: 2 → aanvaardbaar maar niet ideaal
- answer_tier: 3 → fout of onbeleefd

Elke optie heeft:
  text        : actie of keuze in het Engels (1–2 zinnen, tweede persoon)
  answer_tier : 1, 2 of 3
  motivation  : uitleg waarom correct/suboptimaal/fout (1 zin, in het Engels)

Opties moeten duidelijk van elkaar verschillen — geen subtiele nuances die verwarren.

== REGELS ==

1. lang: ALTIJD "en"
2. Tweede persoon: "You are...", "You notice...", "You receive..."
3. Concrete situatie — nooit abstracte of hypothetische vragen
4. demographic: gebruik "common" tenzij inhoud echt per groep verschilt
5. level: schrijf vragen op ALLE niveaus 1-5 — de placement-test heeft alle levels nodig
6. primary_dimension: verplicht, niet leeg laten
7. applicable_archetypes: max 3, alleen als de vraag écht voor die archetype relevant is
8. register_relevance: altijd invullen
9. interest/social/cultural tags: invullen als 1+ tag past, anders []
10. historical_context: optioneel, max 2 zinnen, feitelijk en cultureel onderbouwd
11. research_pillar: alleen voor middle_class (P1-P4); volledig weglaten voor elite
```

---

## DEEL 6 — YAML VOORBEELDEN

### Voorbeeld middle_class (L3, common)

```yaml
question_text: "You are in a meeting and your manager cuts you off mid-sentence to redirect the discussion. How do you respond?"
register: middle_class
research_pillar: P2
region_code: BE
phase: 1
level: 3
lang: en
demographic: common
primary_dimension: composure
secondary_dimension: diplomacy
applicable_archetypes: [urbanist, scholar]
register_relevance: [middle_class]
interest_tags: []
social_circle_tags: [sc_corporate_networking, sc_professional_assoc]
cultural_interest_tags: []
options:
  - text: "You pause, nod to acknowledge the redirection, and find a moment later to complete your point concisely."
    answer_tier: 1
    motivation: "Composure under interruption signals confidence without confrontation."
  - text: "You stop immediately and say nothing, waiting for the meeting to move on."
    answer_tier: 2
    motivation: "Avoids conflict but leaves your point incomplete and your presence diminished."
  - text: "You raise your voice slightly to finish your sentence before yielding the floor."
    answer_tier: 3
    motivation: "Competing with a manager publicly creates unnecessary tension."
historical_context: "In Belgian professional culture, deference to seniority in formal meetings remains the norm even in modern workplaces."
```

### Voorbeeld elite (L4, diplomatic context)

```yaml
question_text: "You are at a state reception and are introduced to a foreign dignitary whose title you are uncertain about. What do you do?"
register: elite
region_code: BE
phase: 1
level: 4
lang: en
demographic: common
primary_dimension: discernment
secondary_dimension: diplomacy
applicable_archetypes: [diplomate, cosmopolite]
register_relevance: [elite]
interest_tags: []
social_circle_tags: [sc_diplomatic_reception, sc_private_members_club]
cultural_interest_tags: []
options:
  - text: "You use 'Your Excellency' as a neutral honorific until you have the opportunity to discreetly verify the correct form of address."
    answer_tier: 1
    motivation: "'Your Excellency' is broadly accepted for senior officials and avoids the risk of a protocol error."
  - text: "You use the person's name only, without a title, and explain that you want to address them correctly."
    answer_tier: 2
    motivation: "Honest but risks drawing attention to a gap in preparation."
  - text: "You confidently use 'Ambassador' as you believe it sounds appropriate."
    answer_tier: 3
    motivation: "Assuming a title that does not apply is a protocol violation that can cause offence."
historical_context: "Diplomatic protocol at state-level events is governed by the Vienna Convention. Misuse of titles is noted and can affect professional relationships."
```

### Voorbeeld middle_class (L1, demografisch specifiek)

```yaml
question_text: "You are a young woman starting your first week at a new company. A senior male colleague invites the team for drinks after work. What do you do?"
register: middle_class
research_pillar: P3
region_code: BE
phase: 2
level: 1
lang: en
demographic: women_19_30
primary_dimension: diplomacy
secondary_dimension: presence
applicable_archetypes: [urbanist]
register_relevance: [middle_class]
interest_tags: [ga_craft_beer, ga_restaurant_culture]
social_circle_tags: [sc_corporate_networking]
cultural_interest_tags: []
options:
  - text: "You join for one drink, engage warmly with colleagues, and leave at a natural pause with a friendly goodbye."
    answer_tier: 1
    motivation: "Participating briefly signals team willingness without over-committing on your first week."
  - text: "You decline politely and mention you have prior plans."
    answer_tier: 2
    motivation: "Acceptable, but early social capital with a new team is hard to rebuild later."
  - text: "You join but stay at the periphery of the group, checking your phone frequently."
    answer_tier: 3
    motivation: "Physical presence without engagement signals disinterest and can read as dismissive."
```

---

## DEEL 7 — VOLLEDIG VELDENOVERZICHT

| Veld | middle_class | elite | Toegestane waarden |
|---|:---:|:---:|---|
| `register` | verplicht | verplicht | middle_class, elite |
| `research_pillar` | **verplicht** | **weglaten** | P1, P2, P3, P4 |
| `region_code` | verplicht | verplicht | BE, AE, GB, US, FR, DE, NL, IT, CH, AU, CA, IN, ES, PT, SG, BR, ZA, MX, CO |
| `phase` | verplicht | verplicht | 1, 2, 3, 4, 5 |
| `level` | verplicht | verplicht | **1, 2, 3, 4, 5** |
| `lang` | verplicht | verplicht | **altijd "en"** |
| `demographic` | verplicht | verplicht | common \| men_19_30 \| women_19_30 \| men_30_50 \| women_30_50 \| men_50plus \| women_50plus |
| `primary_dimension` | verplicht | verplicht | attentiveness \| composure \| discernment \| diplomacy \| presence |
| `secondary_dimension` | gewenst | gewenst | zelfde als primary_dimension |
| `applicable_archetypes` | gewenst | gewenst | diplomate \| urbanist \| aesthete \| scholar \| cosmopolite |
| `register_relevance` | verplicht | verplicht | array: "elite", "middle_class", of beide |
| `interest_tags` | gewenst | gewenst | ga_*, dc_*, sp_* slugs — zie catalogus |
| `social_circle_tags` | gewenst | gewenst | sc_* slugs — zie catalogus |
| `cultural_interest_tags` | gewenst | gewenst | ci_* slugs — zie catalogus |
| `historical_context` | optioneel | aanbevolen | vrije tekst, max 2 zinnen |
| `answer_tier: 1` | verplicht | verplicht | precies 1 per vraag |
| `answer_tier: 2` | verplicht | verplicht | 1 per vraag |
| `answer_tier: 3` | verplicht | verplicht | 1 per vraag |

---

## DEEL 8 — N8N VALIDATIECHECKLIST

Na generatie door externe AI, controleer per blok:

- [ ] `lang` is `en`
- [ ] `level` is een integer 1-5
- [ ] `demographic` is één van de 7 exacte waarden (geen "male", "female", "senior"...)
- [ ] `research_pillar` aanwezig voor middle_class (P1/P2/P3/P4), afwezig voor elite
- [ ] `primary_dimension` is ingevuld
- [ ] `register_relevance` is ingevuld (array, niet leeg)
- [ ] Exact 3 opties, precies 1 met `answer_tier: 1`
- [ ] Geen lege `text` of `motivation` in opties

---

*Cortéa LTQ-importpipeline — Parser v2.1 — Geverifieerd 10 mei 2026*
