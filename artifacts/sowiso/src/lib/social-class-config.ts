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
  },
} as const;
