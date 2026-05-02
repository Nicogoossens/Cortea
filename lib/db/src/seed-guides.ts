import { db } from "./index";
import { guidesTable } from "./schema/guides";
import { randomUUID } from "crypto";

const GUIDES = [
  {
    title: "Guide to a Job Interview in the UK",
    description: "Dress codes, small talk, punctuality expectations, and follow-up etiquette for British professional interviews.",
    pillar: "interview",
    region_code: "GB",
    price_cents: 99,
  },
  {
    title: "First Business Dinner in Japan",
    description: "Seating hierarchy, chopstick rules, toasting customs, and how to decline food gracefully in a Japanese corporate setting.",
    pillar: "dining",
    region_code: "JP",
    price_cents: 199,
  },
  {
    title: "International Internship Starter — Western Europe",
    description: "Office culture, email tone, introductions, and workplace norms across France, Germany, the Netherlands, and Belgium.",
    pillar: "internship",
    region_code: null,
    price_cents: 299,
  },
  {
    title: "Student Exchange Arrival Guide — East Asia",
    description: "First-week etiquette, gift-giving norms, dormitory customs, and navigating hierarchical relationships at Asian universities.",
    pillar: "exchange",
    region_code: null,
    price_cents: 199,
  },
  {
    title: "Networking at International Conferences",
    description: "How to introduce yourself across cultures, business card protocols, following up without being intrusive.",
    pillar: "networking",
    region_code: null,
    price_cents: 149,
  },
  {
    title: "Airport & Transit Etiquette — Gulf States",
    description: "Dress codes, prayer time awareness, and social conduct in UAE, Qatar, and Saudi Arabia airports and lounges.",
    pillar: "travel",
    region_code: null,
    price_cents: 99,
  },
];

async function seedGuides() {
  console.log("Seeding guides...");
  for (const guide of GUIDES) {
    await db.insert(guidesTable).values({
      id: randomUUID(),
      title: guide.title,
      description: guide.description,
      pillar: guide.pillar,
      region_code: guide.region_code ?? null,
      price_cents: guide.price_cents,
      stripe_price_id: null,
      tier_required: null,
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${GUIDES.length} guides.`);
  process.exit(0);
}

seedGuides().catch((err) => {
  console.error(err);
  process.exit(1);
});
