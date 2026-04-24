import { db } from "./index";
import { useCasesTable } from "./schema/use_cases";
import { sql } from "drizzle-orm";

const USE_CASES = [
  {
    slug: "business-dinner-tokyo",
    title: "Business Dinner in Tokyo",
    region_code: "JP",
    flag_emoji: "🇯🇵",
    formality_level: "formal",
    domain_tags: ["gastronomy", "business", "cultural_knowledge"],
    pillar_weights: { 1: 0.35, 4: 0.40, 3: 0.15, 2: 0.10 },
    description: "Navigate a formal multi-course business dinner in Tokyo, mastering Japanese dining rituals, toast etiquette, and silent communication.",
    cover_context: "A private tatami room at a Michelin-starred kaiseki restaurant. Your hosts are senior executives — the hierarchy is silent but absolute.",
    primary_tool: "atelier",
  },
  {
    slug: "royal-garden-party-london",
    title: "Royal Garden Party in London",
    region_code: "GB",
    flag_emoji: "🇬🇧",
    formality_level: "white_tie",
    domain_tags: ["formal_events", "dress_code", "eloquence"],
    pillar_weights: { 2: 0.40, 3: 0.30, 1: 0.20, 4: 0.10 },
    description: "Attend a Buckingham Palace garden party with poise — mastering presentation, introductions, conversation, and the unspoken hierarchy of British social ceremony.",
    cover_context: "The lawns of Buckingham Palace. Two thousand guests, a strict dress code, and the careful art of being noticed without appearing to try.",
    primary_tool: "mirror",
  },
  {
    slug: "black-tie-gala-paris",
    title: "Black-Tie Charity Gala in Paris",
    region_code: "FR",
    flag_emoji: "🇫🇷",
    formality_level: "black_tie",
    domain_tags: ["formal_events", "gastronomy", "drinks", "eloquence"],
    pillar_weights: { 2: 0.30, 4: 0.25, 5: 0.25, 3: 0.20 },
    description: "Command a Parisian gala evening — from the aperitif to the table wine, with impeccable dress, refined French dinner conversation, and cellar knowledge.",
    cover_context: "A gilded salle at the Palais Garnier. The guests include politicians, couturiers, and old money. Your Bordeaux knowledge will be tested.",
    primary_tool: "atelier",
  },
  {
    slug: "board-meeting-frankfurt",
    title: "Board Meeting in Frankfurt",
    region_code: "DE",
    flag_emoji: "🇩🇪",
    formality_level: "business_formal",
    domain_tags: ["business", "eloquence", "cultural_knowledge"],
    pillar_weights: { 3: 0.40, 1: 0.35, 2: 0.15, 4: 0.10 },
    description: "Command a supervisory board meeting in Frankfurt — precise language, formal address, and the structured etiquette of German corporate culture.",
    cover_context: "A 20th-floor boardroom in the financial district. Titles are mandatory. Silence signals disapproval. Precision is the only currency.",
    primary_tool: "counsel",
  },
  {
    slug: "client-lunch-new-york",
    title: "Client Power Lunch in New York",
    region_code: "US",
    flag_emoji: "🇺🇸",
    formality_level: "business_casual",
    domain_tags: ["business", "gastronomy", "eloquence"],
    pillar_weights: { 3: 0.35, 4: 0.30, 1: 0.20, 2: 0.15 },
    description: "Impress a senior Wall Street client over lunch at a Midtown institution — navigating American business dining, directness, and the art of a confident order.",
    cover_context: "A corner booth at a legendary Midtown restaurant. Your host has closed deals here for thirty years. First impressions are decisive.",
    primary_tool: "counsel",
  },
  {
    slug: "tea-ceremony-kyoto",
    title: "Traditional Tea Ceremony in Kyoto",
    region_code: "JP",
    flag_emoji: "🇯🇵",
    formality_level: "ceremonial",
    domain_tags: ["cultural_knowledge", "formal_events", "lifestyle_wellness"],
    pillar_weights: { 1: 0.50, 2: 0.20, 3: 0.20, 4: 0.10 },
    description: "Participate with grace in a traditional chanoyu tea ceremony — understanding every gesture, silence, and ritual movement as communication.",
    cover_context: "A roji garden path leads to a chashitsu. Your host is a Tea Master. Every movement carries meaning. Every silence speaks.",
    primary_tool: "atelier",
  },
  {
    slug: "wine-dinner-bordeaux",
    title: "Wine Collector's Dinner in Bordeaux",
    region_code: "FR",
    flag_emoji: "🇫🇷",
    formality_level: "formal",
    domain_tags: ["gastronomy", "drinks", "cultural_knowledge"],
    pillar_weights: { 5: 0.45, 4: 0.30, 1: 0.15, 3: 0.10 },
    description: "Converse and taste with authority at a Grand Cru château dinner — from decanting rituals to vintage assessment and the language of the sommelier.",
    cover_context: "A candlelit cave at Château Pichon Baron. The 1990 Pétrus is breathing. Your host has a Master of Wine degree. Be prepared.",
    primary_tool: "atelier",
  },
  {
    slug: "diplomatic-reception-geneva",
    title: "Diplomatic Reception in Geneva",
    region_code: "CH",
    flag_emoji: "🇨🇭",
    formality_level: "formal",
    domain_tags: ["formal_events", "cultural_knowledge", "eloquence", "business"],
    pillar_weights: { 1: 0.30, 3: 0.35, 2: 0.20, 4: 0.15 },
    description: "Navigate a United Nations diplomatic reception with multi-cultural fluency — mastering protocol, multilingual courtesy, and the art of measured conversation.",
    cover_context: "The Palais des Nations reception hall. Ambassadors from forty nations. Every word is weighed, every introduction carries geopolitical subtext.",
    primary_tool: "compass",
  },
  {
    slug: "private-members-club-london",
    title: "Private Members' Club in London",
    region_code: "GB",
    flag_emoji: "🇬🇧",
    formality_level: "smart_casual",
    domain_tags: ["lifestyle_wellness", "eloquence", "cultural_knowledge"],
    pillar_weights: { 3: 0.35, 1: 0.25, 2: 0.25, 4: 0.15 },
    description: "Hold your own as a guest at a Mayfair members' club — understanding house rules, unspoken hierarchies, and the calibrated informality of British elite leisure.",
    cover_context: "The reading room of a St James's Street club, founded in 1762. Your sponsor is a long-standing member. Understatement is everything.",
    primary_tool: "counsel",
  },
  {
    slug: "rooftop-cocktail-dubai",
    title: "Rooftop Cocktail Party in Dubai",
    region_code: "AE",
    flag_emoji: "🇦🇪",
    formality_level: "smart_casual",
    domain_tags: ["formal_events", "cultural_knowledge", "drinks", "dress_code"],
    pillar_weights: { 1: 0.40, 2: 0.25, 5: 0.20, 3: 0.15 },
    description: "Navigate a mixed-culture luxury gathering in Dubai — balancing Western hospitality norms with Islamic social customs, dress code sensitivity, and Halal awareness.",
    cover_context: "A Burj Khalifa-view terrace during Ramadan. Your host is Emirati royalty. The non-alcoholic drinks station signals cultural awareness. Know which to choose.",
    primary_tool: "compass",
  },
];

async function seedUseCases() {
  console.log("Seeding use cases...");

  await db.execute(sql`DELETE FROM use_cases WHERE id > 0`);

  for (const uc of USE_CASES) {
    await db.insert(useCasesTable).values(uc).onConflictDoNothing();
  }

  console.log(`Seeded ${USE_CASES.length} use cases.`);
  process.exit(0);
}

seedUseCases().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
