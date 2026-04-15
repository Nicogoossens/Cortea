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

const PILLAR_DOMAIN_MAP: Record<string, string> = {
  "The World Within": "pillar.1.name",
  "The Presence":     "pillar.2.name",
  "The Voice":        "pillar.3.name",
  "The Table":        "pillar.4.name",
  "The Cellar":       "pillar.5.name",
};

export function pillarDomainKey(domain: string): string {
  return PILLAR_DOMAIN_MAP[domain] ?? domain;
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
