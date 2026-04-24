/**
 * Social Class Configuration
 * Defines constants, helpers, and types for the Elite and Middle Class registers.
 */

export const SOCIAL_CLASS_CONFIG = {
  elite: {
    register: "elite",
    displayName: "Elite",
    pillars: [
      { pillar: 1, internalName: "Cultural Knowledge", domainName: "The World Within" },
      { pillar: 2, internalName: "Appearance",         domainName: "The Presence" },
      { pillar: 3, internalName: "Eloquence",           domainName: "The Voice" },
      { pillar: 4, internalName: "Table Manners",       domainName: "The Table" },
      { pillar: 5, internalName: "Drinks Knowledge",    domainName: "The Cellar" },
    ],
    levelTitles: [
      "The Initiate",
      "The Apprentice",
      "The Practitioner",
      "The Specialist",
      "The Master",
    ] as [string, string, string, string, string],
  },
  middle_class: {
    register: "middle_class",
    displayName: "Middle Class",
    phases: [
      { phase: 1, domainName: "The Individual", focus: "Individual Core — personal social and professional identity" },
      { phase: 2, domainName: "The Dynamic",    focus: "Interaction Dynamics — how demographics interact with each other" },
      { phase: 3, domainName: "The Arena",      focus: "Social Navigation — semi-public spaces where private and professional overlap" },
      { phase: 4, domainName: "The Territory",  focus: "Country Layer — codes unique to one country (residents)" },
      { phase: 5, domainName: "The Current",    focus: "Contemporary Context — digital, multicultural, class-transition dynamics" },
    ],
    levelTitles: [
      "The Foundation",
      "The Practice",
      "The Confidence",
      "The Fluency",
      "The Mastery",
    ] as [string, string, string, string, string],
    researchPillars: {
      P1: "Adaptive Linguistics",
      P2: "Professional Branding",
      P3: "Social Navigation",
      P4: "Merit-based Etiquette",
    } as Record<string, string>,
    phase4Modules: {
      MOD_A: "Linguistic Map",
      MOD_B: "Regional Registers",
      MOD_C: "Institutional Protocol",
      MOD_D: "Life Milestones",
    } as Record<string, string>,
    phase5Modules: {
      MOD_E: "Digital Etiquette",
      MOD_F: "Multicultural Mosaic",
      MOD_G: "Class Transitions",
    } as Record<string, string>,
  },
} as const;

/** Allowed demographic bracket values for middle class Phase 1 and Phase 3 */
export const DEMOGRAPHIC_BRACKETS = [
  "common",
  "men_19_30",
  "women_19_30",
  "men_30_50",
  "women_30_50",
  "men_50plus",
  "women_50plus",
] as const;
export type DemographicBracket = typeof DEMOGRAPHIC_BRACKETS[number];

/** All phase module codes mapped to their labels */
export const PHASE_MODULES: Record<string, string> = {
  ...SOCIAL_CLASS_CONFIG.middle_class.phase4Modules,
  ...SOCIAL_CLASS_CONFIG.middle_class.phase5Modules,
};

/** All research pillar tags */
export const RESEARCH_PILLARS: Record<string, string> = SOCIAL_CLASS_CONFIG.middle_class.researchPillars;

/**
 * Returns `{ pillar_name, pillar_domain }` for a pillar number and social class register.
 *
 * - `pillar_name`   — short label used in scoring UI (e.g. "Appearance")
 * - `pillar_domain` — display domain string returned in API responses (e.g. "The Presence")
 *
 * For `"universal"` and `"elite"`, elite pillar names are returned (backwards-compatible).
 * For `"middle_class"`, the phase focus label and phase domain name are used.
 * Falls back to `"Pillar N"` for unknown pillar numbers.
 *
 * @example
 * getPillarName(2, "elite");
 * // { pillar_name: "Appearance", pillar_domain: "The Presence" }
 * getPillarName(2, "middle_class");
 * // { pillar_name: "Interaction Dynamics", pillar_domain: "The Dynamic" }
 */
export function getPillarName(pillar: number, social_class: string): { pillar_name: string; pillar_domain: string } {
  if (social_class === "middle_class") {
    const phase = SOCIAL_CLASS_CONFIG.middle_class.phases.find(p => p.phase === pillar);
    if (phase) return { pillar_name: phase.focus.split(" — ")[0], pillar_domain: phase.domainName };
  }
  // elite or universal — use elite names
  const p = SOCIAL_CLASS_CONFIG.elite.pillars.find(p => p.pillar === pillar);
  if (p) return { pillar_name: p.internalName, pillar_domain: p.domainName };
  return { pillar_name: `Pillar ${pillar}`, pillar_domain: `Pillar ${pillar}` };
}

/**
 * Returns the level title for a given 1-based level index and social class register.
 * Level must be 1–5. Falls back to elite titles for `universal` content.
 */
export function getLevelTitle(level: number, social_class: string): string {
  const idx = Math.min(5, Math.max(1, level)) - 1;
  if (social_class === "middle_class") {
    return SOCIAL_CLASS_CONFIG.middle_class.levelTitles[idx];
  }
  return SOCIAL_CLASS_CONFIG.elite.levelTitles[idx];
}
