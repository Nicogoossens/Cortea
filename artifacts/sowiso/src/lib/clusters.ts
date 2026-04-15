import type { RegionCode } from "@/lib/active-region";

export interface CultureCluster {
  id: string;
  nameKey: string;
  philosophyKey: string;
  members: RegionCode[];
  dos: string[];
  donts: string[];
  hasHighSociety?: boolean;
}

export const CULTURE_CLUSTERS: CultureCluster[] = [
  {
    id: "anglosaxon",
    nameKey: "clusters.anglosaxon.name",
    philosophyKey: "clusters.anglosaxon.philosophy",
    members: ["GB", "US", "AU", "CA"],
    dos: [
      "Queue patiently and without complaint — order is a social contract.",
      "Maintain comfortable personal space; respect the invisible perimeter.",
      "Use first names quickly; informality signals trust, not disrespect.",
      "Express disagreement directly but without rancour.",
      "Humour is a social currency — wit and understatement are admired.",
    ],
    donts: [
      "Do not discuss salary, age, or personal wealth at social occasions.",
      "Do not touch a new acquaintance beyond a firm handshake.",
      "Do not mistake casual tone for casual commitment.",
      "Do not be conspicuously late — punctuality is a baseline courtesy.",
      "Do not over-compliment; sincerity is valued above effusion.",
    ],
  },
  {
    id: "western-europe",
    nameKey: "clusters.western_europe.name",
    philosophyKey: "clusters.western_europe.philosophy",
    members: ["FR", "DE", "NL"],
    hasHighSociety: true,
    dos: [
      "Greet formally with title and surname until invited to use first names.",
      "Arrive precisely on time — punctuality is a mark of character.",
      "Engage in substantive conversation; intellectual depth is respected.",
      "Present business cards with both hands and read them carefully.",
      "Dress with refinement; appearance signals seriousness of purpose.",
    ],
    donts: [
      "Do not assume familiarity before it is offered.",
      "Do not discuss money, religion, or politics without invitation.",
      "Do not confuse directness (German) for rudeness — it is honesty.",
      "Do not skip the formal greeting rituals; they matter enormously.",
      "Do not bring expensive wine to a French host — they will choose.",
    ],
  },
  {
    id: "romance-mediterranean",
    nameKey: "clusters.romance.name",
    philosophyKey: "clusters.romance.philosophy",
    members: ["IT", "ES", "PT"],
    dos: [
      "Greet warmly with cheek kisses (the norm varies by country).",
      "Express appreciation for food, art, and beauty — it opens doors.",
      "Dress with care and elegance; personal presentation speaks volumes.",
      "Allow meals to unfold slowly — the table is a social stage.",
      "Show genuine personal interest; relationships precede business.",
    ],
    donts: [
      "Do not rush a meal or decline an invitation to linger at table.",
      "Do not confuse relaxed timing with unreliability.",
      "Do not ignore the importance of family as a reference frame.",
      "Do not be brusquely transactional — warm up before getting to business.",
      "Do not dress casually for formal gatherings; bella figura matters.",
    ],
  },
  {
    id: "east-asian",
    nameKey: "clusters.east_asian.name",
    philosophyKey: "clusters.east_asian.philosophy",
    members: ["JP", "CN", "SG"],
    dos: [
      "Present and receive business cards with both hands and a bow.",
      "Preserve the face of your host at all costs — indirect refusal is kindness.",
      "Accept offered food and drink graciously; refusal can cause offence.",
      "Defer to hierarchy in seating, serving, and introductions.",
      "Observe silence as a sign of respect and careful thought.",
    ],
    donts: [
      "Do not refuse hospitality directly — find a gracious, face-saving alternative.",
      "Do not write in red ink (associated with death in China and Korea).",
      "Do not point with one finger — use the whole hand.",
      "Do not stick chopsticks vertically in rice — a funeral omen.",
      "Do not assume one country's customs apply across the region.",
    ],
  },
  {
    id: "arabic-world",
    nameKey: "clusters.arabic.name",
    philosophyKey: "clusters.arabic.philosophy",
    members: ["AE"],
    dos: [
      "Accept coffee or tea immediately; refusal is a social slight.",
      "Dress modestly; cover shoulders and knees in traditional settings.",
      "Greet with right hand only — the left is considered unclean.",
      "Be patient with relationship-building before any business discussion.",
      "Show genuine respect for Islamic practice and prayer times.",
    ],
    donts: [
      "Do not schedule meetings during Friday prayers or Ramadan iftar.",
      "Do not expose the soles of your shoes when seated.",
      "Do not hand items or eat with the left hand.",
      "Do not discuss Israel or domestic politics without care.",
      "Do not bring or offer alcohol unless you know your host's stance.",
    ],
  },
  {
    id: "south-asian",
    nameKey: "clusters.south_asian.name",
    philosophyKey: "clusters.south_asian.philosophy",
    members: ["IN"],
    dos: [
      "Greet with 'Namaste' (hands pressed together) in traditional contexts.",
      "Accept hospitality generously — refusal can feel like rejection.",
      "Acknowledge seniority and hierarchy in all formal interactions.",
      "Remove shoes before entering homes and religious spaces.",
      "Engage with warmth and personal questions — they signal interest.",
    ],
    donts: [
      "Do not offer beef to Hindu hosts or pork to Muslim hosts.",
      "Do not use the left hand for eating, giving, or receiving.",
      "Do not mistake head wobbling for confusion — it often means agreement.",
      "Do not rush; time is relational, not purely transactional.",
      "Do not confuse linguistic directness with social directness.",
    ],
  },
  {
    id: "latin-america",
    nameKey: "clusters.latin_america.name",
    philosophyKey: "clusters.latin_america.philosophy",
    members: ["MX", "BR"],
    dos: [
      "Greet warmly with physical closeness — handshakes, embraces, and cheek kisses.",
      "Invest in small talk and personal rapport before any agenda.",
      "Dress well — appearance signals self-respect and social standing.",
      "Be flexible with time; schedules are approximate.",
      "Express warmth and enthusiasm genuinely — it builds trust instantly.",
    ],
    donts: [
      "Do not mistake warmth for informality in business.",
      "Do not discuss Argentina with a Brazilian or vice versa carelessly.",
      "Do not rush to the point; conversation is a pleasure, not just a tool.",
      "Do not confuse schedule flexibility with lack of seriousness.",
      "Do not avoid physical contact — it is a sign of genuine connection.",
    ],
  },
  {
    id: "ubuntu-africa",
    nameKey: "clusters.ubuntu.name",
    philosophyKey: "clusters.ubuntu.philosophy",
    members: ["ZA"],
    dos: [
      "Greet everyone personally on entering a room — Ubuntu demands acknowledgement.",
      "Show genuine interest in people's families and communities.",
      "Accept offered food and hospitality with both hands and gratitude.",
      "Allow consensus to form naturally; decisions are collective.",
      "Dress appropriately for context — smart dress signals respect.",
    ],
    donts: [
      "Do not ignore the importance of community in any interaction.",
      "Do not rush a consensus — it undermines the collective process.",
      "Do not single out individuals for blame in group settings.",
      "Do not mistake warmth for the absence of hierarchy.",
      "Do not overlook local cultural diversity within Southern Africa.",
    ],
  },
];

export function getCluster(id: string): CultureCluster | undefined {
  return CULTURE_CLUSTERS.find((c) => c.id === id);
}
