# Cortéa Tag-Consolidation Audit Log

Generated from `/mnt/user-data/uploads/cortea-tags_import.md` (8971 lines).

## Summary

- Total tag records parsed: **1584**
- Unique canonical tags (post-consolidation): **1415**
- Consolidation operations: **20**
- Parsing-artefact fixes: **1**
- Status alignments: **1**

## Tag-scope distribution

- `global` (≥4 cluster-baselines): **14**
- `regional` (1-3 cluster-baselines): **297**
- `national` (overlay/standalone only): **1104**

## Global tags (require explicit per-country status)

- `cohabitation-without-marriage` — baselines [3, 4, 5, 6]
- `cremation-as-funeral-option` — baselines [3, 4, 5, 6, 7]
- `gift-bringing-to-host` — baselines [3, 5, 6, 7, 8, 9]
- `holocaust-shoah-denial-or-trivialisation` — baselines [3, 4, 5, 6, 10]
- `modest-everyday-dress-cover-shoulders-knees` — baselines [8, 9, 10, 12]
- `pda-couples-public` — baselines [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
- `personal-finances-or-salary-discussion` — baselines [3, 4, 6, 7]
- `pork-consumption-or-serving` — baselines [2, 3, 4, 5, 6, 7]
- `religious-festival-respectful-observance` — baselines [8, 9, 10, 12]
- `right-hand-only-for-eating-and-passing-food` — baselines [8, 9, 10, 12]
- `same-sex-couple-adoption` — baselines [3, 4, 5, 6, 7]
- `same-sex-marriage-recognition` — baselines [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
- `same-sex-romantic-ff` — baselines [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
- `same-sex-romantic-mm` — baselines [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

## Consolidations applied

All renames are name-only; status and volatility unchanged per record. Safety-check: no country's status for the underlying concept was loosened.

### → `accept-offered-food-or-drink-symbolic-minimum`

**Merged aliases (1):**
- `accept-offered-food-or-drink-at-host-symbolic-minimum`

**Records renamed:** 1

- C9/baseline status:`recommended` ← `accept-offered-food-or-drink-at-host-symbolic-minimum`

### → `cheek-kiss-greeting-social-context`

**Merged aliases (1):**
- `cheek-kiss-bisous-greeting-social-context`

**Records renamed:** 1

- C3/overlay:FR status:`recommended` ← `cheek-kiss-bisous-greeting-social-context`

### → `cohabitation-without-marriage`

**Merged aliases (1):**
- `cohabitation-sambo-without-marriage`

**Records renamed:** 1

- C5/baseline status:`free` ← `cohabitation-sambo-without-marriage`

### → `corruption-political-system-critique-domestic`

**Merged aliases (1):**
- `corruption-or-political-system-critique-domestic`

**Records renamed:** 1

- C8/baseline status:`free` ← `corruption-or-political-system-critique-domestic`

### → `football-as-cultural-passion-and-identity`

**Merged aliases (1):**
- `football-soccer-as-cultural-passion-and-identity`

**Records renamed:** 1

- C7/baseline status:`free` ← `football-soccer-as-cultural-passion-and-identity`

### → `holocaust-shoah-denial-or-trivialisation`

**Merged aliases (1):**
- `holocaust-denial-or-trivialisation`

**Records renamed:** 1

- C4/baseline status:`excluded` ← `holocaust-denial-or-trivialisation`

### → `pda-couples-public`

**Merged aliases (5):**
- `pda-couples-public-affectionate`
- `pda-couples-public-moderate`
- `pda-couples-public-restrained`
- `pda-couples-public-restrained-or-avoided`
- `pda-couples-public-restrained-or-moderate`

**Records renamed:** 10

- C3/baseline status:`free` ← `pda-couples-public-moderate`
- C4/baseline status:`free` ← `pda-couples-public-moderate`
- C5/baseline status:`free` ← `pda-couples-public-moderate`
- C6/baseline status:`free` ← `pda-couples-public-affectionate`
- C7/baseline status:`free` ← `pda-couples-public-affectionate`
- C8/baseline status:`not_recommended` ← `pda-couples-public-affectionate`
- C9/baseline status:`not_recommended` ← `pda-couples-public-restrained`
- C10/baseline status:`not_recommended` ← `pda-couples-public-restrained-or-avoided`
- C11/baseline status:`free` ← `pda-couples-public-restrained-or-moderate`
- C12/baseline status:`not_recommended` ← `pda-couples-public-restrained`

### → `pork-prohibited-in-muslim-context`

**Merged aliases (2):**
- `pork-prohibited-haram-in-muslim-context`
- `pork-prohibited-in-muslim-contexts`

**Records renamed:** 2

- C10/baseline status:`excluded` ← `pork-prohibited-haram-in-muslim-context`
- C12/baseline status:`not_recommended` ← `pork-prohibited-in-muslim-contexts`

### → `right-hand-only-for-eating-and-passing-food`

**Merged aliases (2):**
- `right-hand-for-eating-and-passing`
- `right-hand-for-eating-and-passing-food`

**Records renamed:** 2

- C9/baseline status:`recommended` ← `right-hand-for-eating-and-passing-food`
- C10/baseline status:`recommended` ← `right-hand-for-eating-and-passing`

## Parsing-artefact fixes

- C6 `bella-figura-personal-presentation-attention` (IT): Status 'strongly' (parsing artefact) → 'recommended'

## Status alignments

- C8/baseline `indirect-communication-face-saving-no-without-saying-no`: `free` → `recommended`
  - Reason: Uitlijnen met C9 baseline (zelfde concept, sterk patroon)

## Group E — Personal-questions (preserved per user instruction)

Three distinct tags kept for scenario-precision:

- `personal-questions-marriage-children-acceptable-from-elders` (C10/C12 baseline)
- `personal-questions-age-marriage-children-acceptable-from-elders` (C9 baseline)
- `personal-questions-marriage-children-salary-acceptable-from-elders` (C8 baseline)

These tags scope different scenario-content (age questions specific to SEA; salary questions specific to SA). Consolidation would lose scenario-filter granularity.

## Status-inconsistencies preserved (intentional)

The following tags have multiple statuses across clusters — by design (global discriminators):

- `same-sex-romantic-mm` / `same-sex-romantic-ff` — status per country: SA/Levant/SSA `excluded`, Continental/Anglo/Nordic/LatAm/EAC `free`, C11 `not_recommended`
- `same-sex-marriage-recognition` — `free` in 5 clusters, `excluded` in 7
- `pork-consumption-or-serving` — `excluded` in SA, `free` elsewhere
- `nazi-symbols-display-or-praise` — `excluded` in Continental/Nordic (DE §86a, FR Loi Gayssot, recent NO/SE/DK reforms), `not_recommended` in Anglo (free-speech jurisdictions)
- `humor-self-deprecating` — `free` in SA, `recommended` in Anglo (cultural style discriminator)
- `loud-voice-in-public-space` — `not_recommended` in SA, `free` in Mediterranean (cultural style discriminator)
- `strict-on-the-minute-punctuality-expectation` — `recommended` in JP/SG overlay, `not_recommended` in SA standalone
- `royal-family-king-charles-respectful-reference` — `recommended` UK, `free` CA (cultural-political distance)

## Next steps

1. **Stap 2** — generate full tag × country matrix (~61 countries × ~1.400 canonical tags = ~85.000 rows). Apply default-deny (`excluded`) for ungoverned `global` tag×country cells.
2. **Stap 3** — emit `cortea-tags-master.csv` (database import) + `cortea-tags-canonical.md` (canonical registry).
3. **Stap 4** — per-cluster batch of country-review MD files (1 file per country, ALL canonical tags listed with status/volatility/scope).