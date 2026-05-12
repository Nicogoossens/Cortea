# Cortéa Canonical Tag Registry

**Total canonical tags**: 1415
**Total countries with overlay**: 61
**Full matrix rows**: 86315

## Tag-scope taxonomy

| scope | definition | count |
|---|---|---|
| `global` | Tag appears in ≥4 cluster baselines; status varies by country; explicit per-country assignment required | 14 |
| `regional` | Tag appears in 1-3 cluster baselines; relevant for cluster member countries + sometimes neighbours | 297 |
| `national` | Tag appears only in country overlays / standalone; specific to one or few countries | 1104 |

## Status semantics

- `free` — no constraint; scenario uses tag without re-ranking
- `recommended` — culturally fitting; re-rank +N + boost
- `not_recommended` — culturally inappropriate (not legally punishable); re-rank −N + UI warning
- `excluded` — hard filter; scenario NOT shown

## Default-deny safety policy

If no explicit assignment exists for a (tag, country) combination, the matrix assigns `excluded`. Cf. project safety principle: tolerated-but-illegal stays excluded; when in doubt → excluded.

## Global discriminators (14)

These tags MUST have explicit per-country status. Status varies by country, this is feature not bug.

| tag_id | base clusters | notes |
|---|---|---|
| `cohabitation-without-marriage` | C3,C4,C5,C6 |  |
| `cremation-as-funeral-option` | C3,C4,C5,C6,C7 |  |
| `gift-bringing-to-host` | C3,C5,C6,C7,C8,C9 | Flowers, quality dates, oud perfume, sweets appreciated. No alcohol, no pork. |
| `holocaust-shoah-denial-or-trivialisation` | C3,C4,C5,C6,C10 | Criminal offence in France, Germany, Belgium, Switzerland (Switzerland: Article  |
| `modest-everyday-dress-cover-shoulders-knees` | C8,C9,C10,C12 | Cluster baseline more modest than Mediterranean or Latin American. Visible shoul |
| `pda-couples-public` | C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12 | Under Public Decency Code as "indecent behavior", fined SAR 3,000 (doubled on re |
| `personal-finances-or-salary-discussion` | C3,C4,C6,C7 |  |
| `pork-consumption-or-serving` | C2,C3,C4,C5,C6,C7 | Haram under Islamic dietary rules; import and sale prohibited. |
| `religious-festival-respectful-observance` | C8,C9,C10,C12 | Diwali, Eid (al-Fitr, al-Adha), Vesak/Buddha Purnima, Holi, Dashain, Durga Puja, |
| `right-hand-only-for-eating-and-passing-food` | C8,C9,C10,C12 | Left hand culturally unclean (toilet-associated). Using right hand for eating, a |
| `same-sex-couple-adoption` | C3,C4,C5,C6,C7 |  |
| `same-sex-marriage-recognition` | C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12 |  |
| `same-sex-romantic-ff` | C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12 | Same as `same-sex-romantic-mm`. Women are explicitly covered by the law. |
| `same-sex-romantic-mm` | C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12 | Same-sex acts are criminal under sharia interpretation. Penalties range from fiv |

## Regional tags (sample, first 30 of 297)

| tag_id | base clusters |
|---|---|
| `1989-velvet-revolution-fall-of-berlin-wall-end-of-communism` | C11 |
| `accept-offered-coffee-or-tea-symbolic-minimum` | C10 |
| `accept-offered-food-or-drink-at-host` | C7 |
| `accept-offered-food-or-drink-symbolic-minimum` | C9,C12 |
| `address-senior-by-title-not-first-name` | C2 |
| `africa-as-monolithic-or-poverty-victim-framing-offensive` | C12 |
| `age-and-position-respect-extended-greeting-protocol` | C10 |
| `age-and-seniority-respect-pervasive` | C9,C12 |
| `age-seniority-respect-uncle-aunty-elder-non-family-address` | C8 |
| `agenda-driven-meeting-time-boxed` | C4 |
| `alcohol-cluster-varied-permitted-mostly-restricted-muslim` | C12 |
| `alcohol-consumption-social-norm` | C4,C5 |
| `alcohol-consumption-with-business-counterpart` | C2 |
| `alcohol-cultural-variation-permitted-in-tr-il-lb-restricted-elsewhere` | C10 |
| `appointment-scheduling-in-advance` | C5 |
| `appointment-scheduling-in-advance-personal-visit` | C3 |
| `arab-spring-2011-legacy-discussion` | C10 |
| `arabic-or-local-language-greeting-effort-respected` | C10 |
| `arranged-introduction-marriage-tradition` | C8 |
| `august-vacation-business-effectively-closed` | C6 |
| `bbq-cookout-informal-hosting` | C4 |
| `beach-swimwear-not-in-town-centre` | C6 |
| `bella-figura-personal-presentation-attention` | C6 |
| `big-man-political-cultural-pattern-discussion` | C12 |
| `binge-drinking-weekend-cultural-pattern` | C5 |
| `boasting-self-promotion-status-display` | C5 |
| `boss-superior-deference-formal-meeting-context` | C9 |
| `bread-and-salt-traditional-welcome` | C11 |
| `bride-wealth-dowry-lobola-mahr-cultural-practice` | C12 |
| `bringing-gift-or-bottle-to-host` | C4 |

*... + 267 more regional tags in master CSV*

## National tags (sample, first 30 of 1104)

| tag_id | country/cluster |
|---|---|
| `11-official-languages-sign-language-12th` | ZA |
| `17-may-constitution-day-flag-bunad-celebration` | NO |
| `1956-revolution-against-soviet-october-23-memorial` | HU |
| `1965-anti-communist-purge-historical-discussion` | ID |
| `1968-prague-spring-soviet-invasion-historical-memory` | CZ |
| `1969-may-13-racial-riots-historical-discussion` | MY |
| `1971-liberation-war-from-pakistan-respectful` | BD |
| `1mdb-najib-scandal-discussion` | MY |
| `2002-gujarat-riots-or-other-communal-violence-discussion` | IN |
| `2007-08-post-election-violence-historical-discussion` | KE |
| `2008-financial-crisis-banking-discussion` | IS |
| `2014-coup-military-government-historical-discussion` | TH |
| `2015-earthquake-respectful-reference` | NP |
| `2019-financial-collapse-and-ongoing-crisis` | LB |
| `2022-economic-crisis-aragalaya-protest-rajapaksa-ouster` | LK |
| `2024-election-annulment-georgescu-russian-interference-context` | RO |
| `25-april-carnation-revolution-respectful-reference` | PT |
| `42-plus-ethnic-groups-kikuyu-luhya-kalenjin-luo-kamba-major` | KE |
| `abaya-mandatory-framing` | SA |
| `abiy-ahmed-prosperity-party-government-since-2018` | ET |
| `abortion-access-pro-choice-framing` | US |
| `abortion-federally-decriminalised-since-september-2023` | MX |
| `abortion-legal-since-2018-referendum` | IE |
| `abortion-legal-since-2020` | AR |
| `abortion-legal-up-to-12-weeks-since-2012` | UY |
| `abortion-legal-up-to-24-weeks-since-2022` | CO |
| `abortion-near-total-ban-since-2021-strict-eu-outlier` | PL |
| `abortion-rape-or-mother-life-only` | PE |
| `abortion-restricted-mother-life-only-since-2023` | MT |
| `abortion-restriction-pro-life-framing` | US |

*... + 1074 more national tags in master CSV*