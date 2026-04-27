export const DOMAIN_KEYS = [
  "counsel.domains.dining",
  "counsel.domains.introductions",
  "counsel.domains.dress_code",
  "counsel.domains.gifting",
  "counsel.domains.digital_protocol",
  "counsel.domains.hosting",
  "counsel.domains.apologies",
] as const;

export type DomainKey = typeof DOMAIN_KEYS[number];

export const DOMAIN_KEY_TO_LOG_DOMAIN: Record<DomainKey, string> = {
  "counsel.domains.dining":           "gastronomy",
  "counsel.domains.introductions":    "eloquence",
  "counsel.domains.dress_code":       "dress_code",
  "counsel.domains.gifting":          "business",
  "counsel.domains.digital_protocol": "business",
  "counsel.domains.hosting":          "formal_events",
  "counsel.domains.apologies":        "eloquence",
};

export const SITUATION_CHIPS_KEYS = [
  "counsel.situation_chips.chinese_dinner",
  "counsel.situation_chips.british_gala",
  "counsel.situation_chips.arabic_reception",
  "counsel.situation_chips.japanese_meeting",
  "counsel.situation_chips.french_dinner",
  "counsel.situation_chips.indian_wedding",
  "counsel.situation_chips.yacht",
] as const;

export const REGION_SITUATION_CHIPS: Record<string, readonly string[]> = {
  CN: ["counsel.situation_chips.chinese_dinner", "counsel.situation_chips.japanese_meeting", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.british_gala", "counsel.situation_chips.yacht"],
  JP: ["counsel.situation_chips.japanese_meeting", "counsel.situation_chips.chinese_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.british_gala", "counsel.situation_chips.yacht"],
  SG: ["counsel.situation_chips.chinese_dinner", "counsel.situation_chips.indian_wedding", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.british_gala", "counsel.situation_chips.yacht"],
  IN: ["counsel.situation_chips.indian_wedding", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.british_gala", "counsel.situation_chips.chinese_dinner", "counsel.situation_chips.yacht"],
  AE: ["counsel.situation_chips.arabic_reception", "counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.indian_wedding", "counsel.situation_chips.yacht"],
  FR: ["counsel.situation_chips.french_dinner", "counsel.situation_chips.british_gala", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.indian_wedding", "counsel.situation_chips.yacht"],
  BE: ["counsel.situation_chips.french_dinner", "counsel.situation_chips.british_gala", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  CH: ["counsel.situation_chips.french_dinner", "counsel.situation_chips.british_gala", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  GB: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.indian_wedding", "counsel.situation_chips.yacht"],
  AU: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  CA: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  US: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.indian_wedding", "counsel.situation_chips.yacht"],
  DE: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  NL: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  IT: ["counsel.situation_chips.french_dinner", "counsel.situation_chips.british_gala", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  ES: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.indian_wedding", "counsel.situation_chips.yacht"],
  PT: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  BR: ["counsel.situation_chips.british_gala", "counsel.situation_chips.french_dinner", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.yacht"],
  MX: ["counsel.situation_chips.british_gala", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.french_dinner", "counsel.situation_chips.yacht"],
  CO: ["counsel.situation_chips.british_gala", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.french_dinner", "counsel.situation_chips.yacht"],
  ZA: ["counsel.situation_chips.british_gala", "counsel.situation_chips.arabic_reception", "counsel.situation_chips.indian_wedding", "counsel.situation_chips.yacht"],
};

export function getSituationChipsForRegion(region: string): readonly string[] {
  return REGION_SITUATION_CHIPS[region] ?? SITUATION_CHIPS_KEYS;
}
