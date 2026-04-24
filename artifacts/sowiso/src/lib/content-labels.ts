/**
 * Maps API-returned English strings (from DB) to i18n keys.
 * Use with t() to display translated labels.
 */

const LEVEL_KEY_MAP: Record<string, string> = {
  "The Aware":         "level.the_aware",
  "The Composed":      "level.the_composed",
  "The Refined":       "level.the_refined",
  "The Distinguished": "level.the_distinguished",
  "The Sovereign":     "level.the_sovereign",
};

export function levelKey(name: string | undefined): string {
  if (!name) return "level.the_aware";
  return LEVEL_KEY_MAP[name] ?? name;
}

/** Elite register: pillar number → domain name */
const ELITE_PILLAR_DOMAIN_MAP: Record<number, string> = {
  1: "The World Within",
  2: "The Presence",
  3: "The Voice",
  4: "The Table",
  5: "The Cellar",
};

/** Middle class register: phase number → domain name */
const MIDDLE_CLASS_PHASE_DOMAIN_MAP: Record<number, string> = {
  1: "The Individual",
  2: "The Dynamic",
  3: "The Arena",
  4: "The Territory",
  5: "The Current",
};

/** Legacy domain-name → i18n key map (elite / universal, for backwards-compat) */
const PILLAR_DOMAIN_MAP: Record<string, string> = {
  "The World Within": "pillar.1.name",
  "The Presence":     "pillar.2.name",
  "The Voice":        "pillar.3.name",
  "The Table":        "pillar.4.name",
  "The Cellar":       "pillar.5.name",
};

/** Middle class domain-name → i18n key map */
const MIDDLE_CLASS_DOMAIN_MAP: Record<string, string> = {
  "The Individual": "middle.phase.1.name",
  "The Dynamic":    "middle.phase.2.name",
  "The Arena":      "middle.phase.3.name",
  "The Territory":  "middle.phase.4.name",
  "The Current":    "middle.phase.5.name",
};

/**
 * Returns the i18n key for a pillar domain name string.
 * Works for both elite and middle_class domain names.
 * When social_class is not provided, it auto-detects the register
 * from the domain name so callers that only have the domain string still resolve correctly.
 */
export function pillarDomainKey(domain: string, social_class?: string): string {
  if (social_class === "middle_class") {
    return MIDDLE_CLASS_DOMAIN_MAP[domain] ?? PILLAR_DOMAIN_MAP[domain] ?? domain;
  }
  // Auto-detect: if the domain name only appears in the middle-class map, use that key
  if (!social_class && domain in MIDDLE_CLASS_DOMAIN_MAP && !(domain in PILLAR_DOMAIN_MAP)) {
    return MIDDLE_CLASS_DOMAIN_MAP[domain]!;
  }
  return PILLAR_DOMAIN_MAP[domain] ?? domain;
}

/**
 * Returns the domain name for a given pillar/phase number and social class.
 * Useful when you have a pillar number but not the domain name string.
 */
export function pillarDomainName(pillar: number, social_class?: string): string {
  if (social_class === "middle_class") {
    return MIDDLE_CLASS_PHASE_DOMAIN_MAP[pillar] ?? `Phase ${pillar}`;
  }
  return ELITE_PILLAR_DOMAIN_MAP[pillar] ?? `Pillar ${pillar}`;
}

const PILLAR_TITLE_MAP: Record<string, string> = {
  "The Observer":    "pillar.title.the_observer",
  "The Reader":      "pillar.title.the_reader",
  "The Traveller":   "pillar.title.the_traveller",
  "The Diplomat":    "pillar.title.the_diplomat",
  "The Luminary":    "pillar.title.the_luminary",

  "The Conscious":   "pillar.title.the_conscious",
  "The Poised":      "pillar.title.the_poised",
  "The Curated":     "pillar.title.the_curated",
  "The Impeccable":  "pillar.title.the_impeccable",
  "The Icon":        "pillar.title.the_icon",

  "The Listener":    "pillar.title.the_listener",
  "The Conversant":  "pillar.title.the_conversant",
  "The Eloquent":    "pillar.title.the_eloquent",
  "The Orator":      "pillar.title.the_orator",
  "The Sage":        "pillar.title.the_sage",

  "The Guest":       "pillar.title.the_guest",
  "The Diner":       "pillar.title.the_diner",
  "The Connoisseur": "pillar.title.the_connoisseur",
  "The Host":        "pillar.title.the_host",
  "The Maître":      "pillar.title.the_maitre",

  "The Sipper":       "pillar.title.the_sipper",
  "The Taster":       "pillar.title.the_taster",
  "The Selector":     "pillar.title.the_selector",
  "The Sommelier":    "pillar.title.the_sommelier",
  "The Cellar Master":"pillar.title.the_cellar_master",
};

export function pillarTitleKey(title: string | undefined): string {
  if (!title) return "level.the_aware";
  return PILLAR_TITLE_MAP[title] ?? title;
}

const TRIGGER_KEY_MAP: Record<string, string> = {
  correct_choice:   "trigger.correct_choice",
  incorrect_choice: "trigger.incorrect_choice",
  time_bonus:       "trigger.time_bonus",
  correcte_keuze:   "trigger.correct_choice",
  onjuiste_keuze:   "trigger.incorrect_choice",
};

export function triggerLabel(trigger: string, t: (k: string) => string): string {
  const key = TRIGGER_KEY_MAP[trigger];
  if (key) return t(key);
  return trigger.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
