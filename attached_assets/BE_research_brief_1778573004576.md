# Country Research Brief — BE Belgium

*This brief consolidates T1 + T3 + T4 context for Tavily research. Tavily uses this as primary prompt-context to populate T4 mechanism-names, institutional anchors, and register-markers per pillar, and T3 block-labels per demographic-function.*

## 1. Country identity

- **ISO**: `BE`
- **Country**: Belgium
- **Scope tier**: `A` — Active monarchy / living elite-court culture
- **Regional elite cluster**: `E1_NW_EUROPE_ARISTOCRATIC`
- **Mid-class cluster** (for cross-reference): C3
- **Inclusion rationale** (Tavily direction from T1): Active constitutional monarchy + documented aristocratic society; PILOT PROJECT source (v5 of research baseline)

## 2. Cluster context — sibling countries with shared elite-tradition

This country belongs to `E1_NW_EUROPE_ARISTOCRATIC`. Tavily can leverage cluster-shared label-family research:

**Cluster label-family hint**: Continental aristocratic terms (French/Dutch/German registers): Cavalier/Cavalier-equivalent, Comtesse, Junker, Edelman, Adelijke titles

**Sibling countries in same cluster** (8): AT, CH, DE, FR, LI, LU, MC, NL

If Tavily research for sibling countries has yielded verified label-patterns, those can be cross-referenced for BE as starting hypotheses (but must be verified country-specifically; cluster ≠ identical practice).

## 3. Demographic blocks (T3 task: find local label per function-key)

Tavily task: for each of the 12 universal demographic function-keys below, find the **culturally-authentic local label** used in elite-protocol for that demographic role in this country. Verbatim-preserve the term in original script/language where applicable (transliterate if non-Latin).

| function_key | demographic | age | local label to research |
|---|---|---|---|
| `COMMON` | all | all | `Common` (pilot) |
| `M_19_30` | M | 19-30 | `Cavalier` (pilot) |
| `F_19_30` | F | 19-30 | `Demoiselle` (pilot) |
| `M_30_50` | M | 30-50 | `Commandeur` (pilot) |
| `F_30_50` | F | 30-50 | `Châtelaine` (pilot) |
| `M_50P` | M | 50+ | `Patriarche` (pilot) |
| `F_50P` | F | 50+ | `Grande Dame` (pilot) |
| `X_M19_FPEER` | M 19-30 × F peer | 19-30 | `Cross Cavalier × Demoiselle` (pilot) |
| `X_F19_MPEER` | F 19-30 × M peer | 19-30 | `Cross Demoiselle × Cavalier` (pilot) |
| `X_CMD_ELDER` | Cmd × Elder | 30-50→50+ | `Cross Commandeur × Patriarche/Grande Dame` (pilot) |
| `X_MCMD_FELDER` | M Cmd × F Elder | 30-50→50+ | `Cross Commandeur × Grande Dame` (pilot) |
| `X_FCMD_MELDER` | F Cmd × M Elder | 30-50→50+ | `Cross Châtelaine × Patriarche` (pilot) |

## 4. Pillar research (T4 task: find mechanism-names + institutional anchors + register-markers per pillar)

For each pillar, Tavily produces three lists. Verbatim cultural terms preserved (no translation): if a term is `Tenue` in Belgium or `Botchan` in Japan, it stays in that form in the output.

### P1 — The Voice

- **Pillar focus**: eloquence, address codes, U/Vous-equivalent, register, conversation discipline
- **Tavily research direction**: Address codes (formal vs informal pronouns), eloquence-mechanisms, register-shift signals, conversation-discipline names, hierarchy-of-address terms
- **Current status**: `pilot`

**PILOT-FILLED — verbatim preserved from Belgium master-prompt:**

- **mechanism_names** (20 items): Tenue | Vloeiendheid | Bescheidenheid | Opvoeding | Wandelgang | Lichaamsbeheersing | Belgische Voornaamheid | Nieuwe Zakelijkheid | Discretie | Omerta of the Elite | Asymmetrische U | Burgundian | Geweten van het Huis | Diplomatie van de Gangen | Ritueel van de Erkenning | Persoonlijke Brief | Gezamenlijke Verdediging | U/Vous discipline | Strategic Distance | Boundary Recognition
- **institutional_anchors** (12 items): Cercle Royal Gaulois | Cercle de Lorraine | Avenue Louise | Laeken | Brussels (francophone) | Antwerp (Flemish) | La Villa Lorraine | Comme Chez Soi | foundation networks | senior law firms | Belgian Upper Ten | Belgische Adel
- **register_markers** (7 items): composed sentence-rhythm | architectural vocabulary (architecture/register/calibration/formation) | francophone vs Flemish parallel rhythms | no Anglo-Saxon directness | third-person elite register | Belgian context-anchoring | Cross-community fluency

### P2 — Presence

- **Pillar focus**: body language, spatial discipline, bearing, dress
- **Tavily research direction**: Bearing-discipline names, spatial-protocol terms (room entry, distance), dress-register markers, posture-mechanisms
- **Current status**: `needs_tavily`

**Tavily to populate**:
- `mechanism_names`: needs_tavily_research
- `institutional_anchors`: needs_tavily_research
- `register_markers`: needs_tavily_research

### P3 — Table

- **Pillar focus**: dining protocol, seating hierarchy, cutlery, course progression
- **Tavily research direction**: Dining-protocol mechanism-names, seating-hierarchy terms, course-progression rituals, cutlery-conventions, named institutions (restaurants, dining clubs)
- **Current status**: `needs_tavily`

**Tavily to populate**:
- `mechanism_names`: needs_tavily_research
- `institutional_anchors`: needs_tavily_research
- `register_markers`: needs_tavily_research

### P4 — World Within

- **Pillar focus**: institutional knowledge, clubs, networks, social architecture
- **Tavily research direction**: Named institutions: clubs, foundations, networks, schools, hereditary societies, professional-elite circles; cultural reference-points
- **Current status**: `needs_tavily`

**Tavily to populate**:
- `mechanism_names`: needs_tavily_research
- `institutional_anchors`: needs_tavily_research
- `register_markers`: needs_tavily_research

### P5 — Cellar

- **Pillar focus**: wine, gastronomy, gift-giving, cellar-knowledge
- **Tavily research direction**: Wine/spirit conventions, gift-giving rituals, cellar-protocol terms, gastronomic-establishment names (named restaurants, hôtels particuliers)
- **Current status**: `needs_tavily`

**Tavily to populate**:
- `mechanism_names`: needs_tavily_research
- `institutional_anchors`: needs_tavily_research
- `register_markers`: needs_tavily_research

### P6 — Vault

- **Pillar focus**: discretion, reputation, family protection, secrecy-rituals
- **Tavily research direction**: Discretion-mechanism names, reputation-management protocols, family-protection conventions, omerta-equivalents, secrecy-rituals
- **Current status**: `needs_tavily`

**Tavily to populate**:
- `mechanism_names`: needs_tavily_research
- `institutional_anchors`: needs_tavily_research
- `register_markers`: needs_tavily_research

## 5. Level × pillar availability (T2 — current status)

| | P1 The Voice | P2 Presence | P3 Table | P4 World Within | P5 Cellar | P6 Vault |
|---|---|---|---|---|---|---|
| **L1** The Initiate | ✅ rich (pilot) | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research |
| **L2** The Practitioner | ✅ rich (pilot) | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research |
| **L3** The Architect | ✅ rich (pilot) | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research |
| **L4** The Strategist | ✅ rich (pilot) | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research |
| **L5** The Sovereign | ✅ rich (pilot) | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research | ⏳ needs_research |

## 6. Tier-specific research guidance

**Tier `A` — Active monarchy / living elite-court culture**

Target `rich` for all pillars. Court protocol literature, official royal household sources, aristocratic registers (peerage/almanach), institutional documentation.

## 7. Quality thresholds (deterministic T2 update after T4 yield)

T4 yield → T2 status (per pillar, applied to all relevant levels):

| T4 verified yield (per pillar) | T2 status assigned |
|---|---|
| ≥15 mechanism + ≥8 anchors + ≥5 markers | `rich` |
| 8-14 mechanism + 4-7 anchors + 3-4 markers | `adequate` |
| 4-7 mechanism + 2-3 anchors + 1-2 markers | `sparse` |
| <4 mechanism OR not publicly-verifiable | `insufficient` |

## 8. Tavily prompt template (suggested)

```
Research the elite-protocol layer of Belgium (BE).
Scope tier: A.
Direction: Active constitutional monarchy + documented aristocratic society; PILOT PROJECT source (v5 of research baseline)
Regional cluster context: E1_NW_EUROPE_ARISTOCRATIC (siblings: AT, CH, DE, FR, LI...).

For each of the 6 pillars (The Voice, Presence, Table, World Within, Cellar, Vault):
  - List verified mechanism-names (verbatim cultural terms)
  - List verified institutional anchors (specific named places, organizations, networks)
  - List verified register-markers (language/style/protocol identifiers)

For each of the 12 demographic function-keys (M_19_30, F_19_30, M_30_50, F_30_50, M_50P, F_50P, COMMON, X_M19_FPEER, X_F19_MPEER, X_CMD_ELDER, X_MCMD_FELDER, X_FCMD_MELDER):
  - Find the culturally-authentic local label used in elite-protocol for this demographic role.

Only publicly-verifiable sources. No regime-internal claims as established protocol.
Verbatim-preserve cultural terms — no translation.
```
