# Cortéa — Country Research Master Prompt Template
**Version:** 1.0 — May 2026
**Purpose:** LangChain agent workflow template for per-country research, content authoring, and data delivery.
**Usage:** This document is the structural scaffold. Every country gets its own generated brief by filling in the `{{PLACEHOLDER}}` variables. The structure is fixed; the content is always country-specific.

---

## How this template works

```
STEP 1 — RESEARCH     → Agent uses Tavily/Exa to populate T3 + T4 per pillar/demographic
STEP 2 — AUTHORING    → Agent writes questions using T4 yield + phase/level/demographic/register/language rules
STEP 3 — DELIVERY     → Agent formats output as JSON matching data-delivery-blueprint.md → ready for seeder
```

Each step produces a mandatory output artefact. No step may be skipped. Steps are sequential — Step 2 depends on Step 1 output; Step 3 depends on Step 2 output.

---

## BLOCK A — Country Identity

> *Agent instruction: Fill all fields below from T1 country classification data before starting research. These fields govern ALL decisions in Steps 1–3.*

| Field | Value |
|---|---|
| **ISO** | `{{COUNTRY_ISO}}` |
| **Country name** | `{{COUNTRY_NAME}}` |
| **Scope tier** | `{{SCOPE_TIER}}` — see Tier definitions below |
| **Elite cluster** | `{{ELITE_CLUSTER}}` (e.g. `E1_NW_EUROPE_ARISTOCRATIC`) — Elite track only; `N/A` if tier E |
| **Mid-class cluster** | `{{MID_CLASS_CLUSTER}}` (e.g. `C3`) |
| **T1 inclusion rationale** | `{{INCLUSION_RATIONALE}}` — verbatim from T1 CSV |
| **Eligible registers** | `{{REGISTERS}}` — one or both of: `middenklasse` · `elite` |

### Tier definitions (determines content depth)

| Tier | Definition | Elite content path | Middenklasse content path |
|---|---|---|---|
| A | Active monarchy / living court culture | L1–L5 all pillars | Full 5 fasen |
| B | Ex-monarchy / surviving aristocratic register | L1–L5 all pillars | Full 5 fasen |
| C | UHNW / business elite, no active aristocracy | L1–L5; aristocratic pillar-blocks may be N/A | Full 5 fasen |
| D | Elite exists but documentation insufficient | L1–L2 only + disclaimer | Full 5 fasen |
| E | No elite layer relevant to Cortéa scope | No elite content | Full 5 fasen |

---

## BLOCK B — Language Dimensions

> *Agent instruction: Language governs TWO separate things: (1) which language(s) the question text is authored in, (2) which register-vocabulary the elite/middenklasse content uses. Both must be resolved before authoring begins.*

### B1 — Authoring languages

List all languages in which questions for this country must be authored. For countries with multiple official languages, author separate question sets per language — do NOT mix languages within a single question.

| Language code | Language name | Register applicability | Priority |
|---|---|---|---|
| `{{LANG_CODE_1}}` | `{{LANG_NAME_1}}` | `{{BOTH / MIDDENKLASSE / ELITE}}` | Primary |
| `{{LANG_CODE_2}}` | `{{LANG_NAME_2}}` | `{{BOTH / MIDDENKLASSE / ELITE}}` | Secondary |
| `en` | English | Both | Fallback / international content |

**Valid language codes** (BCP 47, as accepted by the data-delivery-blueprint):
`en` · `nl` · `fr` · `de` · `es` · `pt` · `it` · `ar` · `ja` · `zh` · `ko` · `ru` · `tr` · `hi` · `sw`

> Rule: `lang` in the JSON output describes the language the question is WRITTEN IN, not the country region. A question about Walloon etiquette written in English → `lang: "en"`.

### B2 — Register vocabulary (country-specific — Tavily task)

Research the country's native vocabulary for the following register concepts. These terms must appear verbatim in question text, motivations, and historical context — never translated into generic English equivalents.

| Concept | Country-specific term to research |
|---|---|
| Formal 2nd-person address | `{{e.g. "U" (NL/BE), "Vous" (FR), "Sie" (DE), "Usted" (ES), "您" (ZH)}}` |
| Informal 2nd-person address | `{{e.g. "jij/je" (NL), "tu" (FR), "du" (DE), "tú" (ES)}}` |
| Title for untitled man | `{{e.g. "Monsieur", "Meneer", "Herr", "Don", "先生 Sensei"}}` |
| Title for untitled woman | `{{e.g. "Madame", "Mevrouw", "Frau", "Doña", "女士 Nǚshì"}}` |
| Elite male address | `{{e.g. "Monsieur le Baron", "Your Grace", "Excellency", "殿下 Heika"}}` |
| Elite female address | `{{e.g. "Madame la Comtesse", "My Lady", "奥様 Okusama"}}` |
| Formal written salutation | `{{e.g. "Geachte heer/mevrouw", "Cher Monsieur", "Sehr geehrte/r"}}` |
| Farewell (formal) | `{{e.g. "Hoogachtend", "Veuillez agréer", "Mit freundlichen Grüßen"}}` |

> Rule: Preserve all terms verbatim in original script/language. Do not anglicise. Japanese terms stay in Japanese; Arabic terms stay in Arabic (with romanisation in parentheses if needed for training context). Non-Latin scripts must include transliteration only as secondary annotation, never replacing the original.

---

## BLOCK C — Register Dimensions

> *Agent instruction: Middenklasse and Elite are SEPARATE content tracks with separate authoring rules. Produce separate output artefacts for each register — never mix them in a single question or JSON batch.*

### C1 — Middenklasse track

**Register value in JSON output:** `"middle-class"` or `"professional"` (see data-delivery-blueprint § 3.1)

**Content architecture — 5 Fasen × 5 Levels:**

| Fase | Focus | Levels | Min. questions per level |
|---|---|---|---|
| I — Social Foundations | Unwritten daily rules; greeting, bearing, formality threshold | 1–5 | 10 |
| II — Professional Arena & Gender Ledger | Workplace dynamics, negotiation, gender-specific trajectories (Professional Woman / Professional Man) | 1–5 | 10 |
| III — Intergenerational Vault & Leadership | Elder/Commander trust transfer, institutional memory, discretion, shadow registry of political favours | 1–5 | 10 |
| IV — State Rituals & National Protocol | Monarchy/government interaction, national ceremonies, diplomatic corps | 1–5 | 10 |
| V — Sovereign Finality & Succession | Dynasty, family office, legacy, structural influence, transcendent regency | 1–5 | Variable |

**Minimum dataset for launch:**

| Fase | Min. questions | Required for launch |
|---|---|---|
| Fase I | 350 | Yes |
| Fase II | 600 | Yes |
| Fase III | 500 | Yes |
| Fase IV | 500 | After launch |
| Fase V | 350 | Optional |

**Level framework (structure universal — content always country-specific):**

| Level | Name | Scope |
|---|---|---|
| 1 | Foundation | Entry-level rules; universally applicable within country |
| 2 | Social Arena | Group dynamics, public behaviour, dining |
| 3 | Material Modesty | Money, possessions, status signals |
| 4 | High-Stakes Diplomacy | Conflict, negotiation, authority |
| 5 | Crisis & Reputation | Scandal, burnout, legacy, high-pressure situations |

**Country-specific adaptation per fase:**
- Fase I examples must use local greeting conventions, local formality thresholds, local physical-contact norms
- Fase II must use local workplace hierarchy, local gender-role conventions, local negotiation styles
- Fase III must use local elder-respect traditions, local succession customs
- Fase IV must use the actual national institutions, state protocols, and ceremonies of `{{COUNTRY_NAME}}`
- Fase V must reflect local dynasty / family-office / legacy conventions where documented

### C2 — Elite track

**Register value in JSON output:** `"aristocracy"`

**Content architecture — 6 Pillars × 5 Levels:**

| Pillar ID | Pillar name | Focus |
|---|---|---|
| P1 | The Voice | Eloquence, address codes, register shifts, U/Vous-equivalent, conversation discipline |
| P2 | Presence | Bearing, spatial discipline, dress, body language, room-entry protocol |
| P3 | Table | Dining protocol, seating hierarchy, cutlery, course progression, toasting |
| P4 | World Within | Institutional knowledge, clubs, networks, hereditary societies, social architecture |
| P5 | Cellar | Wine, gastronomy, gift-giving, cellar knowledge, gastronomic establishments |
| P6 | Vault | Discretion, reputation management, family protection, omerta-equivalents, secrecy rituals |

**Level framework (same structure, Elite naming):**

| Level | Elite name | Middenklasse equivalent |
|---|---|---|
| L1 | The Initiate | Foundation |
| L2 | The Practitioner | Social Arena |
| L3 | The Architect | Material Modesty |
| L4 | The Strategist | High-Stakes Diplomacy |
| L5 | The Sovereign | Crisis & Reputation |

**T2 availability matrix (fill after Step 1 research):**

| | P1 Voice | P2 Presence | P3 Table | P4 World Within | P5 Cellar | P6 Vault |
|---|---|---|---|---|---|---|
| **L1** | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` |
| **L2** | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` |
| **L3** | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` |
| **L4** | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` |
| **L5** | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` | `{{status}}` |

Status values: `rich` · `adequate` · `sparse` · `insufficient` · `needs_tavily_research` · `blocked_tier_d`

---

## BLOCK D — Gender × Age Dimensions

> *Agent instruction: Every question must carry a `demographic` value. Use the mapping table below to convert the research function-key (used in T3/T4 research) to the correct delivery value (used in the JSON output). Never leave `demographic` empty — use `"general"` when no specific group applies.*

### D1 — Function key → delivery value mapping

| Research function_key | JSON `demographic` value | Description |
|---|---|---|
| `COMMON` | `"general"` | All genders, all ages — universal applicability |
| `M_19_30` | `"Men, Age 19-30"` | Young professional men |
| `F_19_30` | `"Women, Age 19-30"` | Young professional women |
| `M_30_50` | `"Men, Age 30-50"` | Mid-career men |
| `F_30_50` | `"Women, Age 30-50"` | Mid-career women |
| `M_50P` | `"Men, Age 50+"` | Senior men |
| `F_50P` | `"Women, Age 50+"` | Senior women |
| `X_M19_FPEER` | `"Men 19-30 vs Women 19-30"` | Cross: young man interacting with female peer |
| `X_F19_MPEER` | `"Women 19-30 vs Men 19-30"` | Cross: young woman interacting with male peer |
| `X_CMD_ELDER` | `"Men 30-50 vs Men 50+"` | Cross: mid-career commander with male elder |
| `X_MCMD_FELDER` | `"Men 30-50 vs Women 50+"` | Cross: male commander with female elder |
| `X_FCMD_MELDER` | `"Women 30-50 vs Men 50+"` | Cross: female commander with male elder |

> Casing and spacing are exact — the database filters on these string values. `"Men, Age 19-30"` ≠ `"men, age 19-30"` ≠ `"Men Age 19-30"`.

### D2 — Local demographic labels (T3 task — country-specific, Tavily to populate)

> *For each of the 12 function-keys, find the culturally-authentic local label used in elite-protocol for this country. Verbatim-preserve in original language/script.*

| function_key | Local elite label | Middenklasse equivalent |
|---|---|---|
| `COMMON` | `{{local term or "Common"}}` | algemeen / general |
| `M_19_30` | `{{e.g. "Cavalier" (BE/FR), "Junker" (DE/AT)}}` | jongeman / young man |
| `F_19_30` | `{{e.g. "Demoiselle" (BE/FR), "Fräulein" (DE/AT)}}` | jonge vrouw / young woman |
| `M_30_50` | `{{e.g. "Commandeur" (BE), "Commandante" (ES)}}` | professional man |
| `F_30_50` | `{{e.g. "Châtelaine" (BE), "Dama" (ES/IT)}}` | professional woman |
| `M_50P` | `{{e.g. "Patriarche" (BE/FR), "Patriarch" (DE)}}` | elder man |
| `F_50P` | `{{e.g. "Grande Dame" (BE/FR), "Grande Signora" (IT)}}` | elder woman |
| `X_M19_FPEER` | `{{local cross-term if exists, else N/A}}` | — |
| `X_F19_MPEER` | `{{local cross-term if exists, else N/A}}` | — |
| `X_CMD_ELDER` | `{{local cross-term if exists, else N/A}}` | — |
| `X_MCMD_FELDER` | `{{local cross-term if exists, else N/A}}` | — |
| `X_FCMD_MELDER` | `{{local cross-term if exists, else N/A}}` | — |

---

## BLOCK E — STEP 1: Research (Tavily/Exa)

> *Agent instruction: Run Tavily research for BOTH tracks (middenklasse + elite, if eligible per tier). Produce T4 output for elite and a phase-research summary for middenklasse. Only publicly-verifiable sources. No speculation. Verbatim-preserve all cultural terms in original language.*

### E1 — Elite pillar research (T4 — per pillar)

For each of the 6 pillars, find and list:

1. **mechanism_names** — named cultural mechanisms, protocols, or concepts (verbatim, original language)
   - Target: ≥15 per pillar for `rich`; 8–14 for `adequate`; 4–7 for `sparse`
2. **institutional_anchors** — specific named places, clubs, organisations, networks, schools, restaurants
   - Target: ≥8 per pillar for `rich`; 4–7 for `adequate`; 2–3 for `sparse`
3. **register_markers** — language/style/protocol identifiers that distinguish this country's elite register
   - Target: ≥5 per pillar for `rich`; 3–4 for `adequate`; 1–2 for `sparse`

**Tavily prompt (fill all placeholders before sending):**

```
Research the elite-protocol layer of {{COUNTRY_NAME}} ({{COUNTRY_ISO}}).
Scope tier: {{SCOPE_TIER}}.
Research direction: {{INCLUSION_RATIONALE}}
Regional cluster: {{ELITE_CLUSTER}} — cluster siblings: {{CLUSTER_SIBLING_ISOS}}.

For each of the 6 pillars (The Voice, Presence, Table, World Within, Cellar, Vault):
- List verified mechanism-names (verbatim cultural terms, original language/script)
- List verified institutional anchors (specific named organisations, places, networks)
- List verified register-markers (language/style/protocol identifiers)

For each of the 12 demographic function-keys (COMMON, M_19_30, F_19_30, M_30_50, F_30_50,
M_50P, F_50P, X_M19_FPEER, X_F19_MPEER, X_CMD_ELDER, X_MCMD_FELDER, X_FCMD_MELDER):
- Find the culturally-authentic local label used in elite-protocol for this demographic role.

Only publicly-verifiable sources.
No regime-internal claims presented as established public protocol.
Verbatim-preserve all cultural terms — do not translate or anglicise.
Non-Latin scripts: include romanisation as secondary annotation only.
```

**T2 status update rule (deterministic — apply after T4 yield):**

| T4 verified yield per pillar | T2 status assigned |
|---|---|
| ≥15 mechanism + ≥8 anchors + ≥5 markers | `rich` |
| 8–14 mechanism + 4–7 anchors + 3–4 markers | `adequate` |
| 4–7 mechanism + 2–3 anchors + 1–2 markers | `sparse` |
| <4 mechanism OR not publicly verifiable | `insufficient` |

**Tier D rule (hard cap):** L3/L4/L5 cells → `blocked_tier_d` regardless of yield. App displays "Limited data available — L1–L2 only" notice. Do not author L3–L5 questions for Tier D countries.

### E2 — Middenklasse phase research (per fase)

For each of the 5 Fasen, research the following for `{{COUNTRY_NAME}}`:

1. **Country-specific examples** — local institutions, named social situations, named practices illustrating each fase focus
2. **Regional nuances** — sub-national variations (linguistic regions, urban/rural, north/south, generational)
3. **Historical context anchors** — 1–3 sentences of verifiable historical/institutional background per level
4. **Tag constraints** — from the cultural tag matrix: which tags for `{{COUNTRY_ISO}}` are `excluded` or `not_recommended`? These constrain authoring in Step 2.

**Tavily prompt:**

```
Research middle-class social etiquette norms in {{COUNTRY_NAME}} ({{COUNTRY_ISO}}).
Focus: unwritten rules of daily interaction, professional etiquette, gender dynamics,
intergenerational protocol, state rituals, and national ceremonies.

Primary language(s) for research: {{LANG_CODE_1}}, {{LANG_CODE_2}}
Mid-class cluster: {{MID_CLASS_CLUSTER}} — regional etiquette family for cross-reference.

For each research area, provide:
- Named local examples (institutions, social situations, named practices)
- Regional variations within the country
- Historical/cultural context (verifiable sources only)
- Sensitive topics or social taboos that require careful framing

Only publicly-verifiable sources. No opinion or speculation.
```

---

## BLOCK F — STEP 2: Content Authoring

> *Agent instruction: Write questions using T4 yield (elite) and phase-research output (middenklasse). Every question must follow the format below exactly. Produce separate batches per register × language × demographic. Cultural terms from T4 must appear verbatim in question text and motivations.*

### F1 — Question format (universal)

Every question follows this structure, regardless of register, language, or country:

```
Question text     → Clear situational scenario; one etiquette decision to make
Option A          → answer_tier: 1 / 2 / 3
Option B          → answer_tier: 1 / 2 / 3
Option C          → answer_tier: 1 / 2 / 3  (optional 4th option D)
Motivation        → Per option: WHY this tier — grounded in T4/research output, verbatim terms
Historical context → 1–3 sentences of verifiable background (optional but strongly recommended)
```

**Mandatory rules:**
- Exactly **one** option must be `answer_tier: 1` — the ideal, distinguished response
- At least **one** option must be `answer_tier: 3` — the clear etiquette mistake
- No question with only tier-2 and tier-3 options is valid
- Use verbatim cultural terms from T4/research — never generic English if a local term is known
- Write in the language specified for this question (`lang` field) — not the language of the country

### F2 — Authoring matrix (what to produce per country)

Produce question batches covering all active combinations for `{{COUNTRY_NAME}}`:

| Dimension | Values to cover |
|---|---|
| Register | `middenklasse` and/or `elite` — per country tier eligibility |
| Language | All `{{LANG_CODES}}` applicable to this country |
| Track (middenklasse) | Fasen I–V × Levels 1–5 |
| Track (elite) | Pillars P1–P6 × Levels L1–L5 (or L1–L2 for Tier D) |
| Demographic | All 12 function_keys — map to `demographic` via Block D1 |

**Output batch naming convention:**
`{{COUNTRY_ISO_LOWER}}-{{register}}-{{lang}}.json`

Examples: `be-middle-class-nl.json` · `be-aristocracy-fr.json` · `jp-middle-class-ja.json` · `jp-aristocracy-ja.json` · `sa-middle-class-ar.json`

### F3 — Country-specific tag constraints (from cultural tag matrix)

> *Agent instruction: Before authoring any question, query the cultural tag matrix for `{{COUNTRY_ISO}}`. Tag status directly constrains which scenarios can appear as valid options.*

| Tag status in matrix | Authoring rule |
|---|---|
| `excluded` | Do NOT write a scenario where this tag appears as a valid, neutral, or positive choice. If the scenario exists for cultural-educational purposes, all options referencing it must be `answer_tier: 3`. |
| `not_recommended` | If the scenario includes this tag, the associated option is always `answer_tier: 3`. Motivation must explain the cultural/legal reason. |
| `recommended` | Positive framing; the option presenting this tag may be `answer_tier: 1`. |
| `free` | No constraint on tier assignment. |

---

## BLOCK G — STEP 3: Data Delivery

> *Agent instruction: Format all authored questions as JSON matching the schema below. Validate every field before output. Run the Block G4 delivery checklist. Submit output file(s) to the seeder pipeline.*

### G1 — JSON schema (per question object)

```jsonc
{
  // ── Required ────────────────────────────────────────────────────────────
  "register":      "{{middle-class | professional | aristocracy}}",
  "phase":         {{1 | 2 | 3 | 4 | 5}},
  "level":         {{1 | 2 | 3 | 4 | 5}},
  "region_code":   "{{COUNTRY_ISO}}",           // uppercase ISO 3166-1 alpha-2
  "demographic":   "{{Block D1 exact value}}",  // casing is significant
  "question_text": "{{question in target language}}",
  "lang":          "{{BCP47 — language the question is WRITTEN IN}}",
  "options": [
    {
      "text":        "{{option text — same language as question_text}}",
      "answer_tier": {{1 | 2 | 3}},
      "motivation":  "{{explanation grounded in local etiquette — verbatim terms from T4}}"
    }
    // minimum 2 options, maximum 4
  ],

  // ── Optional ────────────────────────────────────────────────────────────
  "research_pillar":    "{{snake_case value — see G3 | null}}",
  "historical_context": "{{1–3 sentences verifiable background | null}}"
}
```

### G2 — `register` values

| Register | JSON value | When to use |
|---|---|---|
| Middenklasse — general social norms | `"middle-class"` | Default for Fasen I, III, IV, V |
| Middenklasse — workplace-specific | `"professional"` | Fase II content only |
| Elite / aristocratic | `"aristocracy"` | All Elite track content (all pillars, all levels) |

### G3 — `research_pillar` values

| Pillar | JSON value |
|---|---|
| Adaptive Linguistics (language, address codes, register shifts) | `"adaptive_linguistics"` |
| Professional Branding (reputation, personal brand, digital shadow) | `"professional_branding"` |
| Social Navigation (groups, public behaviour, dining, events) | `"social_navigation"` |
| Material Modesty (money, possessions, status signals) | `"material_modesty"` |
| Elite — The Voice (P1) | `"elite_voice"` |
| Elite — Presence (P2) | `"elite_presence"` |
| Elite — Table (P3) | `"elite_table"` |
| Elite — World Within (P4) | `"elite_world_within"` |
| Elite — Cellar (P5) | `"elite_cellar"` |
| Elite — Vault (P6) | `"elite_vault"` |

### G4 — Delivery checklist (run before every submission)

```
□ Every question has exactly one answer_tier: 1
□ Every question has at least one answer_tier: 3
□ `lang` matches the actual language of question_text and all option texts
□ `region_code` is uppercase ISO 3166-1 alpha-2
□ `register` is exactly one of: middle-class | professional | aristocracy
□ `demographic` matches a Block D1 value exactly — casing and spacing are significant
□ `phase` is integer 1–5; `level` is integer 1–5
□ No `excluded` tag scenario presented as neutral or valid
□ No `not_recommended` tag scenario as answer_tier 1 or 2
□ Cultural terms from T4/research appear verbatim in motivations
□ Non-Latin scripts preserved in original — romanisation is secondary only
□ No `question_hash` field included (computed by the database)
□ File named: {{country_iso_lower}}-{{register}}-{{lang}}.json
□ Each file contains only ONE register and ONE language
```

### G5 — Import commands (after delivery)

```bash
# 1. Add seed script to lib/db/package.json:
"seed:{{cc}}": "tsx src/seed-learning-tracks.ts ../../data/{{cc}}-learning-tracks.json"

# 2. Run seeder:
pnpm --filter @workspace/db seed:{{cc}}

# 3. Verify in admin UI:
/admin/learning-tracks?region_code={{CC}}
```

**Idempotency:** The seeder uses `onConflictDoNothing()` on a computed `question_hash`. Re-running is always safe — no duplicates are inserted. To update an existing question's options or motivation, delete the old record from the database first, then re-run.

---

## BLOCK H — Quality Gates (per step)

| Gate | Step | Condition | Action if failed |
|---|---|---|---|
| T4 minimum yield | 1 | <4 mechanism_names for a pillar | Mark pillar `insufficient`; skip L3–L5 authoring for that pillar |
| Tier D hard cap | 1 | Country is Tier D | Mark L3/L4/L5 cells `blocked_tier_d`; do not author those levels |
| answer_tier 1 present | 2 | No tier-1 option in question | Reject question; revise before moving to Step 3 |
| Excluded tag violation | 2 | Excluded tag in neutral/positive option | Reject question; revise |
| Not-recommended in tier 1 | 2 | Not-recommended tag as tier-1 option | Reject question; flip to tier 3 |
| Language mismatch | 3 | `lang` ≠ actual language of question_text | Reject; correct `lang` field |
| Demographic mismatch | 3 | `demographic` not found in Block D1 table | Reject; use exact mapped value |
| Register mixing | 3 | Multiple registers in one JSON file | Split into separate files |

---

## BLOCK I — Agent Self-Check (LangChain loop instruction)

After completing all three steps for a country, the agent must verify the following before marking the country complete:

```
1. Block A: Is every {{PLACEHOLDER}} field filled? No placeholders remaining?
2. Block B: Are all authoring languages resolved? Is register vocabulary documented?
3. Block D2: Are all 12 local demographic labels researched or explicitly marked N/A with reason?
4. Block C2 T2 matrix: Does T2 availability reflect actual T4 yield per Block E1 quality thresholds?
5. Block F: Is every JSON question compliant with the Block G4 checklist?
6. Block G: Is output split by register × language? No register mixing per file?
7. Block F3: Were cultural tag matrix constraints checked for this country before authoring?
8. Block B2: Do verbatim cultural terms appear in question motivations — not anglicised generic terms?
```

If any check fails → return to the relevant step and correct before submitting.

---

## Reference documents

Always load these before starting a new country:

| Document | Purpose |
|---|---|
| `docs/data-delivery-blueprint.md` | Canonical JSON schema, field rules, seeder workflow |
| `attached_assets/cortea-tags-canonical.md` | 1,415 canonical tags + status semantics |
| `attached_assets/cortea-tags-master_*.csv` | Full tag matrix (86K+ rows) — tag constraint lookup per country |
| `docs/ltq-ai-authoring-prompt.md` | LTQ question authoring rules (levels 1–5, demographics, archetypes) |
| `elite/T1_country_scope.csv` | Country tier classification (A–E) + inclusion rationale |
| `elite/T2_availability.csv` | Current pillar × level availability status per country |
