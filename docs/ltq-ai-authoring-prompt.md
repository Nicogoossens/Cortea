# LTQ AI Authoring Prompt — Cortéa Content Team

> Interne richtlijn voor auteurs en AI-tools die learning-track-vragen schrijven of importeren.
> Zorg dat elk YAML-blok voldoet aan de onderstaande veldspecificaties.

---

## YAML-veldoverzicht

```yaml
question_text:       "..."          # verplicht
options:
  - text: "..."
    answer_tier: 1                  # 1 = correct / 2 = neutraal / 3 = fout
    motivation: "..."
historical_context:  "..."          # optioneel — extra achtergrond voor de uitleg
register:            middle_class   # middle_class | elite
research_pillar:     P1             # P1–P4 (verplicht voor middle_class, null voor elite)
phase:               1              # 1–5
level:               1              # 1–5
region_code:         BE             # ISO-3166-1 alpha-2
demographic:         common         # common | men | women | men_19_30 | ...
lang:                nl             # en | nl | fr | de | es | it | pt | ja | zh | ar
primary_dimension:   attentiveness  # attentiveness | composure | discernment | diplomacy | presence
secondary_dimension: diplomacy      # optioneel
interest_tags:       []             # situationele interesse-codes
applicable_archetypes: []           # archetype-slugs
social_circle_tags:  []             # social_circles taxonomy slugs
cultural_interest_tags: []          # cultural_interests taxonomy slugs
register_relevance:  []             # ["middle_class"] | ["elite"] | ["middle_class","elite"]
cultural_tags:       []             # ← zie sectie hieronder
```

---

## Het `cultural_tags` veld

```yaml
cultural_tags:
  - pda-couples-public
  - alcohol-consumption-social-norm
```

**Wat het is:** Een array van canonieke `tag_id`-strings uit de `cultural_tags`-tabel (1.415 tags).
Elke tag beschrijft een cultureel gevoelig gedragspatroon of norm dat de vraag raakt.

**Waarom het belangrijk is:** De learning engine gebruikt dit veld voor twee onafhankelijke lagen:

| Laag | Naam | Effect |
|------|------|--------|
| A | Landfilter | Vraag met `excluded` tag → **nooit getoond** in dat land (hard remove vóór re-ranking) |
| A | Cultuurboost | `recommended` → score **+6**; `not_recommended` → score **−5** (geclamped ±20) |
| B | Profielboost | Overlap met gebruikersinstellingen → **+8 per overlap**, max +24 (3 overlaps) |

**Wanneer invullen:**
- Vul `cultural_tags` in als de vraag betrekking heeft op gedrag dat in sommige landen gevoelig, verboden of juist gewaardeerd kan zijn.
- Laat het veld leeg (`[]`) als de vraag volledig universeel is — de auto-tagger verwerkt ongetagde vragen.
- Maximaal **5 tags** per vraag; kies de meest directe.

---

## Status-semantiek

De `status` van een tag in `cultural_tag_matrix` bepaalt het engine-effect **per land**:

| status | betekenis | engine-effect |
|--------|-----------|---------------|
| `excluded` | Gedrag verboden, strafbaar of cultureel onaanvaardbaar | Hard filter: vraag **nooit** getoond |
| `free` | Geen bijzondere culturele lading; neutraal | Geen re-ranking effect |
| `recommended` | Cultureel passend, gewaardeerd of aanbevolen | Score **+6** per tag |
| `not_recommended` | Cultureel ongepast (niet illegaal) | Score **−5** per tag |

> Een vraag over het brengen van wijn als gastengeschenk kan `recommended` zijn voor België maar `excluded` voor Saudi-Arabië — de engine handelt dit automatisch af op basis van de `cultural_tag_matrix`.

---

## `explicit` vs `inherited` — wat betekent dit voor auteurs?

De `country_review_status` kolom geeft aan hoe betrouwbaar de tag-status voor een land is:

| waarde | betekenis | actie voor auteur |
|--------|-----------|-------------------|
| `explicit` | Land is expliciet onderzocht; status is bevestigd | Veilig gebruiken als referentie |
| `inherited` | Afgeleid van clusterbaseline; niet land-specifiek geverifieerd | Vangnet, maar wees voorzichtig met randgevallen |

Als een tag `inherited` is voor een land en je twijfelt of de status klopt, markeer dan de matrixrij voor review (via het admin-panel) zodat het content-team kan verifiëren.

---

## 25 meest gebruikte tag_ids (voorbeeldbank)

Gebruik deze tag_ids als startpunt bij het taggen van nieuwe vragen:

| tag_id | scope | typisch gebruik |
|--------|-------|-----------------|
| `pda-couples-public` | global | Koppels die affectie tonen in het openbaar |
| `alcohol-consumption-social-norm` | regional | Alcohol als sociaal-culturele norm |
| `gift-bringing-to-host` | global | Cadeaus meebrengen naar een gastheer |
| `pork-consumption-or-serving` | global | Varkensvlees serveren of consumeren |
| `same-sex-romantic-mm` | global | Zichtbare relaties tussen mannen |
| `same-sex-romantic-ff` | global | Zichtbare relaties tussen vrouwen |
| `modest-everyday-dress-cover-shoulders-knees` | global | Bescheiden kleding (schouders + knieën bedekt) |
| `personal-finances-or-salary-discussion` | global | Praten over salaris of financiën |
| `religious-festival-respectful-observance` | global | Respectvolle omgang met religieuze feesten |
| `right-hand-only-for-eating-and-passing-food` | global | Rechterhandgebruik bij eten |
| `alcohol-consumption-with-business-counterpart` | regional | Alcohol bij zakelijke ontmoetingen |
| `agenda-driven-meeting-time-boxed` | regional | Vergaderingen met strikte agenda en tijdsboxen |
| `appointment-scheduling-in-advance` | regional | Afspraken ver op voorhand plannen |
| `bringing-gift-or-bottle-to-host` | regional | Fles of cadeau meebrengen |
| `punctuality-strict-business-context` | regional | Stiptheid in zakelijke context |
| `direct-feedback-blunt-honesty-valued` | regional | Directe, eerlijke feedback als culturele norm |
| `eye-contact-sustained-sign-of-respect` | regional | Oogcontact als teken van respect |
| `handshake-cross-gender-standard` | regional | Handdruk tussen mannen en vrouwen als standaard |
| `small-talk-weather-sport-before-business` | regional | Koetjes en kalfjes voor zakelijke gesprekken |
| `age-and-position-respect-extended-greeting-protocol` | regional | Uitgebreid begroetingsprotocol voor ouderen/hoger geplaatsten |
| `bella-figura-personal-presentation-attention` | regional | Italiaansgezind belang aan persoonlijke presentatie |
| `binge-drinking-weekend-cultural-pattern` | regional | Weekend-drinkgedrag als cultureel patroon |
| `bread-and-salt-traditional-welcome` | regional | Brood-en-zoutwelkomsttraditie |
| `holocaust-shoah-denial-or-trivialisation` | global | Holocaust-ontkenning (strafbaar in meerdere EU-landen) |
| `cohabitation-without-marriage` | global | Samenwonen buiten het huwelijk |

---

## Auto-tagger

Vragen met `cultural_tags: []` worden automatisch verwerkt door het auto-tagger script:

```bash
pnpm --filter @workspace/api-server auto-tag-questions
```

Het script:
1. Haalt alle ongetagde vragen op (`cultural_tags = '[]'`)
2. Stuurt ze in batches van 20 naar Claude met de volledige tagcatalogus
3. Valideert de response (geen hallucinations — onbekende tag_ids worden verwijderd)
4. Slaat max. 5 tags per vraag op — uitsluitend bij vragen die nog geen tags hebben

Getagde vragen worden **nooit** overschreven door de auto-tagger.

---

## Volatility sweeper

Volatile tags worden periodiek geflagged voor review door het content-team:

- Sweeper draait elk uur (configureerbaar via `VOLATILE_SWEEP_INTERVAL_MS`)
- Rijen ouder dan `VOLATILE_REVIEW_MONTHS` maanden (default: 6) krijgen `needs_review = true`
- De teller is zichtbaar in het admin-panel

---

*Versie: world-v2 · 1.415 canonieke tags · 199 landen · ~293.000 matrix-rijen*
