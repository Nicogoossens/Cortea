# Master Blueprint — Format & Principles
*Universal instructions for building Phase 1 etiquette datasets for any country.*
*Version 3 — adds Pillar 6 (Private Life Navigation). Total dataset per country: ~4,350-4,550 questions across 6 Pillars.*
*Read this first. Then read the relevant Pillar blueprint (P1, P2, P3, P4, P5, or P6).*

---

## 0. Purpose of this Document

This master blueprint defines the **universal rules** that apply to every Pillar and every country:

- The Cowork worker import format (mandatory technical requirements)
- The structure of sections, levels, questions, answers, and motivations
- The progressive language register (Apprentice → Grandmaster across the 5 Levels)
- The localisation gradient (which Pillars are universal, which are country-specific)
- The hierarchy topic cluster (employee → manager dynamics — universal in every Pillar)
- The audit/validation checklist before import
- The workflow for building a Pillar from scratch

Pillar-specific content (themes, level names, demographic dynamics, scenarios) is defined in the matching Pillar blueprint.

> **Read this document first, then read the relevant Pillar blueprint, then start building.**

---

## 1. The 6 Pillars — Universal vs. Localised

The 6 Pillars are **not equally universal**. P1, P2, P3, and P6 share the same 17-section structure across all countries. P4 and P5 have **different structures** (modules, not sections) because their content is fundamentally country-specific.

| Pillar | Theme | Structure | Localisation |
|---|---|---|---|
| **P1** | Adaptive Linguistics | 17 sections × 50 Q = 850 Q | ~90% universal — only Historical Context + a few language-specific scenarios change |
| **P2** | Professional Branding | 17 sections × 50 Q = 850 Q | ~90% universal — Historical Context + dress code regional examples |
| **P3** | Social Navigation | 17 sections × 50 Q = 850 Q | Universal skeleton, **local examples** — café/restaurant/networking codes are written per country using the same 17-section frame |
| **P4** | Country Layer | **Module-based** (5 modules with own volumes) | **Fully country-specific** — built from scratch per country |
| **P5** | Contemporary Context | **Module-based** (3 modules) | Mostly local — digital thresholds, multicultural mosaic, class transitions vary per country |
| **P6** | Private Life Navigation | 17 sections × 50 Q = 850 Q | Universal skeleton with country-specific calibration — dating, friendship, health, conflict, mantelzorg vary per culture |

> **What this means**: P1, P2, P3, and P6 share the same 17-section template across all countries. P4 and P5 use **module structures** specific to each country. See dedicated Pillar blueprints for module details.

---

## 2. Universal Dataset Structure (P1, P2, P3, P6)

P1, P2, P3, and P6 each produce exactly **850 questions** distributed as follows:

| Section type | Count | Questions per section | Total |
|---|---|---|---|
| Demographic (individual) | 7 | 50 | 350 |
| Cross-demographic same-age | 6 | 50 | 300 |
| Cross-demographic cross-age | 4 | 50 | 200 |
| **Total per Pillar** | **17 sections** | **50** | **850** |

### The 7 Demographic sections

1. Common (Age-Neutral Baseline)
2. Men 19-30
3. Women 19-30
4. Men 30-50
5. Women 30-50
6. Men 50+
7. Women 50+

### The 6 Cross-demographic same-age sections

Each pair appears in both directions because perspective matters:

1. Men 19-30 vs. Women 19-30
2. Women 19-30 vs. Men 19-30
3. Men 30-50 vs. Women 30-50
4. Women 30-50 vs. Men 30-50
5. Men 50+ vs. Women 50+
6. Women 50+ vs. Men 50+

### The 4 Cross-demographic cross-age sections

Asymmetric pairs (younger × older) only — the dominant cross-generation interactions:

1. Men 19-30 vs. Women 30-50
2. Women 19-30 vs. Men 30-50
3. Men 30-50 vs. Women 50+
4. Women 30-50 vs. Men 50+

### The 5 Levels per section

Each section contains 5 Levels with 10 questions each. Level **names** differ per Pillar, but the **Stage progression** (Apprentice → Grandmaster) is universal — see Section 5.

---

## 3. Phase 4 & Phase 5 Structure — Module-Based

P4 and P5 do **not** use the 17-section template. They use modules instead, because their content is structurally different from the universal Pillars 1-3.

### 3.1 Phase 4 — Country Layer (residents)

5 Modules, each with its own volume. Total target: ~600-700 questions per country.

| Module | Theme | Volume | Universal? |
|---|---|---|---|
| A | The Linguistic Map | ~150 Q | Only for multilingual countries (BE, CH, CA, IN, ES, ZA) |
| B | Regional Registers | ~200 Q | All countries (3-4 regions) |
| C | Institutional Protocol | ~150 Q | All countries (3 institutions) |
| D | Life Milestones | ~150 Q | All countries (3 milestones) |
| **E** | **Familial & Social Roles** | **~150 Q** | **All countries** — added in v2 (parent ↔ adult child, in-law, sibling, extended family hierarchy) |

> Module E is new in v2 — added based on feedback that family hierarchy is essential and culturally specific (Belgian "tante-cultuur" differs from Italian, Japanese, etc.). Children under 19 are excluded from this module — they will be covered in a separate future expansion.

### 3.2 Phase 5 — Contemporary Context (visitors / newcomers)

3 Modules. Total target: ~350 questions per country.

| Module | Theme | Volume |
|---|---|---|
| E | Digital Etiquette | ~100 Q |
| F | Multicultural Mosaic | ~150 Q |
| G | Class Transitions | ~100 Q |

> Module letter conflict: Phase 4 Module E (Familial & Social Roles) and Phase 5 Module E (Digital Etiquette) share a letter. Use the full prefix `Phase 4 — Module E` or `Phase 5 — Module E` in metadata to disambiguate. See Pillar 4 and Pillar 5 blueprints for details.

---

## 4. Cowork Worker Import Format (MANDATORY for all Pillars)

The output `.md` file must follow this exact format. The worker rejects files that deviate.

### 4.1 File-level metadata header

```markdown
**Region:** XX
**Pillar:** PN
**Phase:** 1
```

Where:
- `XX` = 2-letter country code (BE, FR, DE, UK, NL, ES, IT, PL, etc.)
- `PN` = `P1`, `P2`, `P3`, `P4`, `P5`, or `P6` (short form, NOT "Pillar 1")
- Phase is always `1` for the startup dataset

### 4.2 Section header (P1, P2, P3 — one per section, 17 times)

```markdown
Belgium — Phase 1 — Pillar 1: Adaptive Linguistics — Demographic: Common (Age-Neutral Baseline)
[One short paragraph introducing this section's focus — 60-130 words]
```

For cross-demographic sections:

```markdown
Belgium — Phase 1 (Cross-Demographic) — Pillar 1: Adaptive Linguistics — Men 19-30 vs. Women 19-30
[Short intro paragraph]
```

For Phase 4 modules:

```markdown
Belgium — Phase 1 — Pillar 4: Country Layer — Module B: Regional Registers — Antwerp
[Short intro paragraph]
```

### 4.3 Level header (5 per section)

```markdown
## Level 1: The Foundation
*Focus: [1-sentence description, 15-40 words depending on Stage]*
```

### 4.4 Question structure (10 per Level)

```markdown
### Q1: [Title, 3-7 words]
**Scenario:** [Setup, 15-50 words depending on Stage]

**A) ✅ Good**

> [Content, 20-80 words depending on Stage]

*[Motivation, 25-90 words depending on Stage]*

**B) 🟡 Slightly different**

> [Content]

*[Motivation]*

**C) ❌ Would not do that**

> [Content]

*[Motivation]*

**Historical Context:** [Country-specific anchoring, 50-200 words depending on Stage]
```

### 4.5 Required formatting elements

| Element | Format | Example |
|---|---|---|
| File metadata | Bold with colon | `**Region:** BE` |
| Level header | H2 markdown | `## Level 1: The Foundation` |
| Focus line | Italic wrapped | `*Focus: Entry-level rules...*` |
| Question header | H3 markdown | `### Q1: The Initial Contact` |
| Scenario | Bold prefix | `**Scenario:** You are...` |
| Option label | Bold wrapped | `**A) ✅ Good**` |
| Option content | Blockquote prefix | `> "Dear [Name]..."` |
| Option motivation | Italic wrapped | `*This shows reliability...*` |
| Historical Context | Bold prefix | `**Historical Context:** Reflects...` |

### 4.6 Required emoji usage

- `✅ Good` — proper response
- `🟡 Slightly different` — close but slightly miscalibrated
- `❌ Would not do that` — clear violation

---

## 5. Language Progression — Apprentice to Grandmaster

**The most important principle of the curriculum.** The language register **rises progressively** through the 5 Levels but never leaves the **middle-class register**. Elite-class language belongs to a separate dossier.

### 5.1 The 5 Stage names (universal across Pillars)

| Level | Stage | Voice character |
|---|---|---|
| 1 | The Apprentice | Practical, concrete, accessible. Direct cause-effect explanations. |
| 2 | The Practitioner | More polished. Subtle distinctions. Modest specialised vocabulary. |
| 3 | The Architect | Reflective. Names underlying social mechanisms. Recognises competing principles. |
| 4 | The Strategist | Considers second-order consequences. Authority calibration, reputation arcs. |
| 5 | The Grandmaster | Sovereign register. Legacy, principle, the long view. Composed, confident, never theatrical. |

Each Pillar uses these stages but **gives them Pillar-specific Level names** in the headers. For example:

- Pillar 1 Level 1 = "The Foundation" (Apprentice voice)
- Pillar 1 Level 5 = "Crisis & Reputation Management" (Grandmaster voice)
- Pillar 4 Module B Level 1 = "First Contact" (Apprentice voice)
- Pillar 4 Module B Level 5 = "Regional Mastery" (Grandmaster voice)

The **Stage** is universal. The **Level name** is Pillar/Module-specific.

### 5.2 Stage 1 — The Apprentice (Level 1)

**Voice character**: Practical, concrete, accessible. The reader is just learning the rules.

**Motivation length**: 25-50 words. **Historical Context length**: 50-100 words.

**Vocabulary**: Common professional vocabulary. Concrete cause-effect.

**Example motivation (Apprentice)**:
> *"This shows reliability. Admitting a small mistake immediately builds trust and shows attention to detail. Belgian middle-class professional culture reads quick correction as a sign of inner discipline."*

**Forbidden in Apprentice voice**: Abstract concepts ("the merit signal", "sovereign register"), philosophical framing, references to long arcs of professional life.

### 5.3 Stage 2 — The Practitioner (Level 2)

**Voice character**: More polished. Introduces subtle distinctions between similar options.

**Motivation length**: 35-60 words. **Historical Context length**: 70-120 words.

**Vocabulary**: Begins to use professional concepts ("register calibration", "social signal", "professional standing").

**Example motivation (Practitioner)**:
> *"The early arrival communicates discipline without imposing presence — the five-minute window is the calibration that reads as professional rather than over-eager. Belgian professional culture values the quiet signal that the deadline is not the standard; the standard is the quality of the arrival itself."*

### 5.4 Stage 3 — The Architect (Level 3)

**Voice character**: Reflective. Names underlying social mechanisms. Recognises competing principles in tension.

**Motivation length**: 45-70 words. **Historical Context length**: 90-150 words.

**Vocabulary**: Names mechanisms ("Status Transfer", "Borrowed Status", "Conservative Luxury principle", "the merit signal"). Light italics for concept-tags.

**Example motivation (Architect)**:
> *"The introduction with a specific intellectual achievement applies Status Transfer — you lend your social capital so she enters the conversation as a recognised peer. Belgian professional culture's network logic depends on the introducer's guarantee; an unsupported peer in an elite room is at a disadvantage that the Architect-stage professional knows how to dissolve."*

### 5.5 Stage 4 — The Strategist (Level 4)

**Voice character**: Considers second-order consequences. Authority calibration, reputation arcs, long-term cost of short-term wins.

**Motivation length**: 55-80 words. **Historical Context length**: 110-170 words.

**Vocabulary**: Strategic terms ("authority calibration", "reputation arc", "the long view", "the institutional reading", "second-order signal").

**Example motivation (Strategist)**:
> *"Negotiating the salary increase through the documented quality of the work — rather than through immediate market comparison — communicates the Strategist-stage understanding that mid-career reputation is built through cumulative reading of consistent quality. The market argument wins the negotiation; the quality argument wins the next three negotiations and the institutional reputation that makes them possible."*

### 5.6 Stage 5 — The Grandmaster (Level 5)

**Voice character**: Sovereign register. Legacy, principle, the long view. Composed, confident, never theatrical.

**Motivation length**: 60-90 words. **Historical Context length**: 130-200 words.

**Vocabulary**: Final-stage terms ("the sovereign register", "the legacy signal", "the immortal anchor", "the final standard"). Used **sparingly** — Grandmaster voice is measured, not ornate.

**Example motivation (Grandmaster)**:
> *"The composed withdrawal from the public dispute — without explanation or defence — is the Grandmaster register. The reputation built across thirty years cannot be defended through short-arc argument; it is preserved through the silence that allows the institutional memory to do the work the explanation cannot. The principle: at this stage, the absence of the response is the response."*

### 5.7 What stays the same across all 5 Stages

These are constant — never deviate:

- **Second person voice**: always "you"
- **Middle-class register**: never elite vocabulary, never working-class slang
- **No moralising**: explain the social mechanism, never "this is wrong"
- **No first person**: never "I would..."
- **No imperative**: never "Arrive on time"
- **No real public figures, brands, or specific monetary amounts**

### 5.8 Cross-section consistency

A Level 3 question in **Common** uses Architect voice. A Level 3 question in **Men 50+** also uses Architect voice — but the **scenario** is calibrated to the senior demographic. The voice progression is per-Level, not per-demographic.

> The senior demographics (50+) carry their own additional dimension on top of the Level voice — see each Pillar blueprint's demographic guidance.

---

## 6. The Hierarchy Topic Cluster — Universal Across All Pillars

**Employee → Manager dynamics are universal in every country.** This is treated as an **explicit topic cluster** within every Pillar's 5 Levels.

### 6.1 Why this is universal

Workplace hierarchy exists in every country with a middle class. The specific institutional forms vary (German *Mitbestimmung*, French *concertation*, Anglo direct-report culture, Japanese *senpai-kohai*) but the dynamic — junior professional managing the social interface with their manager — is constant.

This dynamic is **not** a separate Pillar or a separate section. It is a **topic cluster** woven through all 5 Levels of every Pillar.

### 6.2 The cluster: 1-2 hierarchy questions per Level per section

Every section's 10 questions per Level should include **at least 1 question** addressing employee → manager dynamics. Exact distribution:

| Level | Hierarchy questions per Level (out of 10) |
|---|---|
| Level 1 (Apprentice) | 1-2 questions on basic deference, registering authority, first interaction |
| Level 2 (Practitioner) | 1-2 questions on managing day-to-day reporting, request handling |
| Level 3 (Architect) | 2-3 questions on disagreement, feedback exchange, peer-to-manager translation |
| Level 4 (Strategist) | 2-3 questions on negotiation, advocating for resources, high-stakes manager interface |
| Level 5 (Grandmaster) | 1-2 questions on departure protocols, succession, reverse mentorship (50+ guiding manager younger than themselves) |

> **In total**: roughly 7-12 of the 50 questions per section deal with hierarchy — 14-24% of the dataset. Not enough to dominate, enough to consistently address.

### 6.3 The cluster across Pillars

Each Pillar approaches hierarchy through its own lens:

- **P1 (Adaptive Linguistics)**: How to phrase upward/downward — register choice with managers, the "I advise" vs. "I think" calibration
- **P2 (Professional Branding)**: How to dress, present, signal reliability to a manager — appearance hierarchy
- **P3 (Social Navigation)**: How to behave in mixed-rank social settings — team dinners, manager networking
- **P4 (Country Layer)**: How regional culture shapes manager dynamics (Antwerp direct vs. Brussels formal vs. Liège warm)
- **P5 (Contemporary Context)**: Digital hierarchy — when to message a manager on WhatsApp, the right-to-disconnect
- **P6 (Private Life Navigation)**: Hierarchy intersection with private life — sick leave, caring leave, private conflict visible at work (smaller cluster than P1-P5)

### 6.4 Cross-demo intersection with hierarchy

When the demographic asymmetry maps to a hierarchy asymmetry (cross-age sections), the hierarchy cluster gains weight:

- **Men 19-30 vs. Women 30-50**: junior male professional with female manager — common modern pattern
- **Women 19-30 vs. Men 30-50**: junior female professional with male manager — historically the most-studied dynamic
- **Men 30-50 vs. Women 50+**: peer-rank male engaging senior female authority — boardroom-equivalent
- **Women 30-50 vs. Men 50+**: peer-rank female engaging senior male authority — institutional dynamics

In these 4 cross-age sections, **2-3 of the 10 questions per Level** can explicitly use the manager-employee framing.

### 6.5 Pure peer hierarchy (without age asymmetry)

Same-age cross-demographic sections (M19-W19, M30-W30, M50-W50) usually do not involve hierarchy — these are **peer interactions**. But edge cases exist: the 30-year-old manager who has a 30-year-old direct report. These can appear as **1-2 questions per Level** to keep the cluster alive in same-age cross-demo too.

---

## 7. Localisation Layers (3-Layer Model)

When building for a new country, distinguish three layers:

### Layer 1 — Universal (all countries identical)

- The 17-section structure for P1/P2/P3
- The 5 Levels per section, 10 questions per Level
- The Apprentice → Grandmaster Stage progression
- The A/B/C option format with ✅/🟡/❌ emojis
- The "Conservative Luxury" voice principle
- The hierarchy topic cluster

### Layer 2 — Regional cluster (e.g. Western Europe, East Asia, Latin America)

Some content can be written **once per regional cluster** rather than per country:

- EU institutional navigation register (relevant for FR, DE, NL, BE, IT, ES, etc.)
- Anglo professional culture (UK, IE, plus partial US/CA)
- Confucian senior register (CN, JP, KR — partial)
- Latin warmth-and-formality balance (ES, IT, PT, parts of LATAM)

Use this layer to avoid rewriting the same Historical Context 20 times. Build the regional baseline once, then vary specific examples per country.

### Layer 3 — Country-specific

The deeply local elements that cannot be generalised:

- Country-specific traditions (Belgian *koffietafel*, Dutch *poldermodel*, Japanese *nemawashi*, French *tutoiement* protocol)
- Regional registers within the country (Antwerp/Ghent/Brussels/Liège for BE)
- Specific institutional names (Stadhuis vs. Mairie vs. Town Hall)
- Local public figures of historical significance (avoid named, but periods are fine)
- Specific minority-majority dynamics (Belgian linguistic divide ≠ Swiss linguistic divide)

> **Build order recommendation**: Layer 1 first (universal skeleton), Layer 3 for the home country (deep local research), Layer 2 as you build subsequent countries in the same cluster.

---

## 8. Tone & Style Constants

### 8.1 The "Conservative Luxury" principle

Across all Pillars, all Stages, and all 17 sections / modules:

- **Quality without ostentation** — say it well, never show off the saying
- **Authority without claim** — competence shows through precision
- **Composed presence** — calm, measured, deliberate
- **Material modesty** — never reference brands, prices, status markers as virtues
- **Steady character** — same voice within a Stage

### 8.2 Voice & person

- Always **second person**: "You arrive at..."
- Never first person, never imperative
- Never name the reader, never assume identity beyond the demographic

### 8.3 Vocabulary register

**Use freely**:
- "professional", "register", "calibration", "composed", "deliberate", "measured", "appropriate"
- "the standard is...", "communicates...", "signals...", "reads as..."
- Stage-specific terms (see Section 5)

**Avoid in all Stages**:
- Slang ("vibe", "chill", "nailed it")
- Corporate jargon ("synergy", "leverage", "deep-dive")
- Self-help language ("empower", "your truth", "authentic self")
- US superlatives ("amazing", "incredible", "awesome")
- Direct moral judgments ("rude", "stupid", "weird")

### 8.4 Forbidden patterns (universal)

- **Never use the user's name** or assume identity details
- **Never reference specific real people** (politicians, celebrities, named brands)
- **Never use stereotypes** about ethnic, religious, or political groups
- **Never mention specific monetary amounts**
- **Never use US-style emojis or expressions**
- **Never moralise** — explain the social mechanism

### 8.5 Length guidelines (with Stage scaling)

| Element | Stage 1 | Stage 3 | Stage 5 |
|---|---|---|---|
| Section intro paragraph | 60-100 | 80-130 | 80-130 |
| Level Focus line | 15-25 | 20-35 | 25-40 |
| Question title | 3-7 | 3-7 | 3-7 |
| Scenario | 15-30 | 25-40 | 30-50 |
| Option content (each) | 20-50 | 30-60 | 40-80 |
| Option motivation (each) | 25-50 | 45-70 | 60-90 |
| Historical Context | 50-100 | 90-150 | 130-200 |

> **Important**: do not pad. If the question is concrete enough to be answered in fewer words, fewer words is correct.

---

## 9. Historical Context — Localisation Rules

Historical Context anchors each question in the country's social history. **This is the element that varies most per country, even within Pillars 1 and 2.**

### 9.1 What Historical Context should do

- Connect the etiquette norm to a real cultural or historical foundation
- Reference specific decades, regions, or institutional traditions
- Explain **why this norm developed** in this society specifically
- Communicate that this is a learned cultural pattern
- Stage-scale: more nuanced and arc-aware in higher Levels

### 9.2 Belgian examples by Stage

| Stage | Belgian example |
|---|---|
| Apprentice (L1) | "The Belgian handshake reflects an old tradition where the open right hand demonstrated that no weapon was held — a gesture of mutual trust." |
| Practitioner (L2) | "The Belgian *overleg* tradition values exchange of positions as the route to better decisions; the consensus discipline at this level was shaped by post-war corporate culture in Brussels and Antwerp." |
| Architect (L3) | "Status Transfer in Belgian professional culture has its origins in the 19th-century *bourgeoisie* network logic: the formal introduction was a guarantee of social safety, and the modern Architect inherits this protocol when introducing female peers in elite rooms." |
| Strategist (L4) | "Belgian corporate equity research between the 2000s and 2010s identified specific patterns in how mid-career professional disagreement was read across gender lines — patterns that informed the formal equity-monitoring frameworks adopted by most large Belgian organisations following the 2010s gender-equality legislation." |
| Grandmaster (L5) | "The Belgian senior matriarch is the final seal of the middle class — a tradition rooted in 19th- and 20th-century *burgerlijk* family-leadership culture. Her authority is measured by the fact that, twenty years after her death, the family still says: 'We do it this way because it is the proper logic.'" |

### 9.3 Per-country adaptation

When localising for another country:

| Belgian element | Replace with country-equivalent |
|---|---|
| "Brussels and Antwerp professional circles" | "[Capital] and [second city] professional circles" |
| "post-war Belgian corporate culture" | The country's own post-war or formative period |
| "Belgian *overleg* tradition" | Country's consensus tradition (German *Mitbestimmung*, Dutch *poldermodel*, Japanese *nemawashi*, French *concertation*) |
| "*burgerlijk* family culture" | The country's middle-class family tradition with the local term |
| Specific dates | The country's own equivalent transition periods |

### 9.4 Forbidden in Historical Context

- Generic claims ("this has always been the case")
- Made-up institutions or legislation
- Stereotypes presented as historical fact
- Claims about other countries' inferiority
- Religious doctrine as universal moral truth

---

## 10. Distribution Requirements

### 10.1 Per-section distribution

Each section of 50 questions must have **exactly**:
- 50 × `✅ Good`
- 50 × `🟡 Slightly different`
- 50 × `❌ Would not do that`

### 10.2 Position rotation

Within each section, the 50 questions are distributed across the 6 possible permutations of A/B/C labels:

| Permutation | A | B | C | Approx count |
|---|---|---|---|---|
| 1 | Good | Slightly | Would not | 8-9 |
| 2 | Good | Would not | Slightly | 8-9 |
| 3 | Slightly | Good | Would not | 8-9 |
| 4 | Slightly | Would not | Good | 8-9 |
| 5 | Would not | Good | Slightly | 8-9 |
| 6 | Would not | Slightly | Good | 8-9 |

This prevents the user from learning that "A is always Good".

### 10.3 Per-pillar totals

850 questions × 3 options = 2550 option-instances. 850 Historical Context entries.

---

## 11. Build Workflow (per Pillar)

### 11.1 Source material check

For each new country:

1. Identify the country's source content (research, ethnography, or generated cultural research)
2. Map the source to the 17 sections × 5 levels × 10 questions structure (P1/P2/P3/P6) or to module structure (P4/P5)
3. Count what's available per section. Record gaps.
4. Generate the gaps using Pillar-specific topic guidance

### 11.2 Session structure

A Pillar (850 questions for P1-P3) is too large for one chat session. Split into:

- **Session 1**: 2 sections (Common + Men 19-30, OR 2 cross-demo same-age)
- **Session 2**: next 2 sections
- ...etc until all 17 sections built

Per session: aim for 2 files of 50 questions each. The agent reads source content (where available), generates the rest, applies rotation patterns, applies the **Stage-progressive language**, and outputs 2 markdown files.

### 11.3 Master file assembly

Once all 17 section files exist:

1. Concatenate in order: Common → 6 demographics → 6 same-age cross-demo → 4 cross-age cross-demo
2. Apply the worker-format transformer (see Section 4)
3. Run the audit checklist (see Section 12)
4. Test import via the Cowork worker

### 11.4 Pillar-by-Pillar build order

For a new country:

1. **P1 first** — most universal, lowest localisation overhead
2. **P2 second** — also highly universal, reuses P1 voice
3. **P3 third** — universal skeleton with deeper local examples
4. **P4 fourth** — fully localised, modular structure (5 modules)
5. **P5 fifth** — contemporary, modular (3 modules)
6. **P6 last** — private life, returns to 17-section structure but addresses dating, friendship, health, conflict, mantelzorg

### 11.5 Common pitfalls

| Pitfall | Prevention |
|---|---|
| En-dash `–` in demographic names | Always use hyphen `-` |
| CRLF line endings | Force LF (`\n`) only |
| `&` connector in cross-demo headers | Always use `vs.` |
| `(Cross-Age Cross-Gender)` tag | Always use `(Cross-Demographic)` |
| Bold AND italic together | Use either, never both |
| Missing blank lines content/motivation | Always blank line between |
| `Pillar 1` in metadata | Use short form `P1` |
| `<sub>Source:` traceability tags | Strip before final import |
| Question title as full sentence | Keep titles 3-7 words |
| Uniform language across Levels | Apply Stage progression — Level 5 must differ from Level 1 |
| Elite vocabulary in Stage 5 | Stay in middle-class register |
| Hierarchy cluster missing | Check 1-3 questions per Level address employee→manager |

---

## 12. Audit Checklist (run before every import)

### 12.1 Structural checks (P1, P2, P3, P6)

- [ ] File starts with `**Region:** XX` / `**Pillar:** PN` / `**Phase:** 1`
- [ ] Exactly 17 section headers
- [ ] Exactly 85 `## Level N:` headers
- [ ] Exactly 850 `### Q` headers
- [ ] Exactly 850 `**Scenario:**` lines
- [ ] Exactly 2550 `**A) `, `**B) `, `**C) ` bold option markers
- [ ] Exactly 2550 `> ` blockquote lines
- [ ] Exactly 850 `**Historical Context:**` lines

### 12.2 Distribution checks

- [ ] 850 × `✅ Good` / 850 × `🟡 Slightly different` / 850 × `❌ Would not do that`
- [ ] Per section: exactly 50 of each
- [ ] Per Level: exactly 10 questions
- [ ] Position rotation: at least 5 of 6 A/B/C permutations per section

### 12.3 Format hygiene

- [ ] Zero CRLF / Zero en-dashes / Zero `<sub>Source:` tags
- [ ] Zero `(Cross-Age Cross-Gender)` headers / Zero `&` connectors
- [ ] All bold and italic markers properly closed

### 12.4 Content hygiene

- [ ] No real public figures or brands
- [ ] No specific monetary amounts
- [ ] All Historical Context country-appropriate
- [ ] No US-style superlatives or slang
- [ ] No moralising language

### 12.5 Stage progression check

- [ ] Sample questions per Level. Verify language register rises:
  - Level 1 motivation = Apprentice (concrete, 25-50 words)
  - Level 3 motivation = Architect (mechanism-aware, 45-70 words)
  - Level 5 motivation = Grandmaster (sovereign, 60-90 words)
- [ ] Level 5 vocabulary includes Grandmaster terms (sparingly used)
- [ ] Level 1 does NOT use Grandmaster vocabulary

### 12.6 Hierarchy cluster check

- [ ] Each Level (1-5) of each section contains 1-3 questions on employee → manager dynamics
- [ ] Cross-age sections explicitly include manager-direct-report scenarios in 2-3 Q per Level
- [ ] Same-age cross-demo sections include 1-2 peer-manager scenarios per Level

### 12.7 P4/P5 module checks (when applicable)

- [ ] Phase 4: 5 modules present (A linguistic where applicable, B regional, C institutional, D milestones, E familial)
- [ ] Phase 5: 3 modules present (E digital, F multicultural, G class)
- [ ] Module headers follow format: `[Country] — Phase 1 — Pillar 4: Country Layer — Module B: Regional Registers — [Region Name]`

---

## 13. Per-Country Deliverables

Each country must produce these 6 files for the Phase 1 startup dataset:

| File | Content | Size | Questions |
|---|---|---|---|
| `XX_Phase1_P1_middle_class.md` | Adaptive Linguistics | ~1.6 MB | 850 |
| `XX_Phase1_P2_middle_class.md` | Professional Branding | ~2.1 MB | 850 |
| `XX_Phase1_P3_middle_class.md` | Social Navigation | ~2.1 MB | 850 |
| `XX_Phase1_P4_middle_class.md` | Country Layer (modules) | ~1.5 MB | ~600-800 |
| `XX_Phase1_P5_middle_class.md` | Contemporary Context (modules) | ~0.8 MB | ~350 |
| `XX_Phase1_P6_middle_class.md` | Private Life Navigation | ~2.0 MB | 850 |
| **Total per country** | | | **~4,350-4,550** |

Where `XX` = 2-letter country code.

---

## 14. Pillar Index

| Blueprint | Title | Theme | Structure |
|---|---|---|---|
| `01_Pillar1_Adaptive_Linguistics.md` | Pillar 1 | Mixing respect with approachability through language | 17 sections × 50 Q |
| `02_Pillar2_Professional_Branding.md` | Pillar 2 | Visual cues of reliability through appearance | 17 sections × 50 Q |
| `03_Pillar3_Social_Navigation.md` | Pillar 3 | Behaviour in semi-public spaces | 17 sections × 50 Q |
| `04_Pillar4_Country_Layer.md` | Pillar 4 | Country-specific institutional, regional, milestone, familial codes | 5 modules |
| `05_Pillar5_Contemporary_Context.md` | Pillar 5 | Digital, multicultural, class-transition modern dynamics | 3 modules |
| `06_Pillar6_Private_Life_Navigation.md` | Pillar 6 | Dating, friendship, health, private conflict, mantelzorg | 17 sections × 50 Q |

---

## 15. Reference Belgium Build (the master template)

The Belgian Phase 1 dataset serves as the working reference:

- **P1, P2, P3 built and validated** by Cowork worker — 2,550 questions total
- **P4 and P5 not yet built** — will follow the module structure described in Pillars 4 and 5 blueprints
- Source material used for P1-P3: `Belgie_middenklasse2.md` (~10.6 MB)
- Build sessions for P1-P3: ~15 chat sessions
- Final files validated: yes (after format harmonisation)

For new countries, the goal is to replicate this output volume and quality, with all cultural references, examples, and Historical Context fully localised.

---

## 16. Versioning & Change Log

When adapting these blueprints:

1. **Do not modify this Master blueprint per country** — it is country-agnostic
2. Note country-specific exceptions in the country's own working notes
3. If a structural change is needed (e.g. a country has a substantially different demographic structure), discuss before deviating

### Version history

- **v1**: Initial draft (single language register across Levels)
- **v2**: Added Stage progression (Apprentice → Grandmaster), localisation gradient (P1/P2 universal, P3 universal skeleton, P4/P5 modular), hierarchy topic cluster, Phase 4 Module E (Familial & Social Roles), 3-layer localisation model
- **v3** (current): Added Pillar 6 (Private Life Navigation) covering dating, friendship, health, private conflict, mantelzorg — fills the private-life gap identified in the v2 audit. Total dataset per country grows from ~3,500 to ~4,500 questions.

---

*End of Master Blueprint — Format & Principles*
