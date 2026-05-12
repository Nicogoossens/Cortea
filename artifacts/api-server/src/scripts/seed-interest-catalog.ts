/**
 * Seed the interest_catalog table — Belgian master seed (EN).
 * ~75 items across 5 taxonomies, tagged per register and region.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server tsx src/scripts/seed-interest-catalog.ts
 *
 * Idempotent — upserts on slug. Safe to run repeatedly.
 * Targets PROD_DATABASE_URL when set, otherwise DATABASE_URL.
 */
import { db, pool } from "@workspace/db";
import { interestCatalogTable } from "@workspace/db";
import { sql } from "drizzle-orm";

interface SeedItem {
  slug: string;
  taxonomy: string;
  label_i18n_key: string;
  registers: string[];
  region_codes: string[] | null;
  display_order: number;
  parent_slug?: string | null;
}

const ITEMS: SeedItem[] = [
  // ── social_circles ────────────────────────────────────────────────────────
  { slug: "sc_family_dinner",          taxonomy: "social_circles", label_i18n_key: "interests.sc_family_dinner",          registers: ["middle_class", "elite"], region_codes: null, display_order: 10 },
  { slug: "sc_neighbourhood",          taxonomy: "social_circles", label_i18n_key: "interests.sc_neighbourhood",          registers: ["middle_class"],           region_codes: null, display_order: 20 },
  { slug: "sc_corporate_networking",   taxonomy: "social_circles", label_i18n_key: "interests.sc_corporate_networking",   registers: ["middle_class", "elite"], region_codes: null, display_order: 30 },
  { slug: "sc_charity_gala",           taxonomy: "social_circles", label_i18n_key: "interests.sc_charity_gala",           registers: ["elite"],                  region_codes: null, display_order: 40 },
  { slug: "sc_academic_conference",    taxonomy: "social_circles", label_i18n_key: "interests.sc_academic_conference",    registers: ["middle_class", "elite"], region_codes: null, display_order: 50 },
  { slug: "sc_private_members_club",   taxonomy: "social_circles", label_i18n_key: "interests.sc_private_members_club",   registers: ["elite"],                  region_codes: null, display_order: 60 },
  { slug: "sc_golf_club",              taxonomy: "social_circles", label_i18n_key: "interests.sc_golf_club",              registers: ["elite"],                  region_codes: null, display_order: 70 },
  { slug: "sc_wine_society",           taxonomy: "social_circles", label_i18n_key: "interests.sc_wine_society",           registers: ["elite"],                  region_codes: null, display_order: 80 },
  { slug: "sc_book_club",              taxonomy: "social_circles", label_i18n_key: "interests.sc_book_club",              registers: ["middle_class"],           region_codes: null, display_order: 90 },
  { slug: "sc_alumni_network",         taxonomy: "social_circles", label_i18n_key: "interests.sc_alumni_network",         registers: ["middle_class", "elite"], region_codes: null, display_order: 100 },
  { slug: "sc_diplomatic_reception",   taxonomy: "social_circles", label_i18n_key: "interests.sc_diplomatic_reception",   registers: ["elite"],                  region_codes: null, display_order: 110 },
  { slug: "sc_volunteer_group",        taxonomy: "social_circles", label_i18n_key: "interests.sc_volunteer_group",        registers: ["middle_class"],           region_codes: null, display_order: 120 },
  { slug: "sc_professional_assoc",     taxonomy: "social_circles", label_i18n_key: "interests.sc_professional_assoc",     registers: ["middle_class", "elite"], region_codes: null, display_order: 130 },
  { slug: "sc_cultural_salon",         taxonomy: "social_circles", label_i18n_key: "interests.sc_cultural_salon",         registers: ["elite"],                  region_codes: null, display_order: 140 },
  { slug: "sc_sports_club",            taxonomy: "social_circles", label_i18n_key: "interests.sc_sports_club",            registers: ["middle_class", "elite"], region_codes: null, display_order: 150 },

  // ── cultural_interests ────────────────────────────────────────────────────
  { slug: "ci_classical_music",        taxonomy: "cultural_interests", label_i18n_key: "interests.ci_classical_music",        registers: ["middle_class", "elite"], region_codes: null,   display_order: 10 },
  { slug: "ci_contemporary_art",       taxonomy: "cultural_interests", label_i18n_key: "interests.ci_contemporary_art",       registers: ["elite"],                  region_codes: null,   display_order: 20 },
  { slug: "ci_theatre_opera",          taxonomy: "cultural_interests", label_i18n_key: "interests.ci_theatre_opera",          registers: ["middle_class", "elite"], region_codes: null,   display_order: 30 },
  { slug: "ci_arthouse_cinema",        taxonomy: "cultural_interests", label_i18n_key: "interests.ci_arthouse_cinema",        registers: ["middle_class", "elite"], region_codes: null,   display_order: 40 },
  { slug: "ci_literature",             taxonomy: "cultural_interests", label_i18n_key: "interests.ci_literature",             registers: ["middle_class", "elite"], region_codes: null,   display_order: 50 },
  { slug: "ci_heritage_museums",       taxonomy: "cultural_interests", label_i18n_key: "interests.ci_heritage_museums",       registers: ["middle_class", "elite"], region_codes: null,   display_order: 60 },
  { slug: "ci_architecture_design",    taxonomy: "cultural_interests", label_i18n_key: "interests.ci_architecture_design",    registers: ["middle_class", "elite"], region_codes: null,   display_order: 70 },
  { slug: "ci_jazz_music",             taxonomy: "cultural_interests", label_i18n_key: "interests.ci_jazz_music",             registers: ["middle_class", "elite"], region_codes: null,   display_order: 80 },
  { slug: "ci_street_art",             taxonomy: "cultural_interests", label_i18n_key: "interests.ci_street_art",             registers: ["middle_class"],           region_codes: null,   display_order: 90 },
  { slug: "ci_ballet",                 taxonomy: "cultural_interests", label_i18n_key: "interests.ci_ballet",                 registers: ["elite"],                  region_codes: null,   display_order: 100 },
  { slug: "ci_photography",            taxonomy: "cultural_interests", label_i18n_key: "interests.ci_photography",            registers: ["middle_class", "elite"], region_codes: null,   display_order: 110 },
  { slug: "ci_comics_bd",              taxonomy: "cultural_interests", label_i18n_key: "interests.ci_comics_bd",              registers: ["middle_class"],           region_codes: ["BE"], display_order: 120 },
  { slug: "ci_folklore_traditions",    taxonomy: "cultural_interests", label_i18n_key: "interests.ci_folklore_traditions",    registers: ["middle_class"],           region_codes: null,   display_order: 130 },
  { slug: "ci_fine_art_collecting",    taxonomy: "cultural_interests", label_i18n_key: "interests.ci_fine_art_collecting",    registers: ["elite"],                  region_codes: null,   display_order: 140 },
  { slug: "ci_gastronomy_culture",     taxonomy: "cultural_interests", label_i18n_key: "interests.ci_gastronomy_culture",     registers: ["middle_class", "elite"], region_codes: null,   display_order: 150 },

  // ── sports ────────────────────────────────────────────────────────────────
  { slug: "sp_cycling",                taxonomy: "sports", label_i18n_key: "interests.sp_cycling",                registers: ["middle_class"],           region_codes: ["BE"], display_order: 10, parent_slug: null },
  { slug: "sp_cycling_road",           taxonomy: "sports", label_i18n_key: "interests.sp_cycling_road",           registers: ["middle_class"],           region_codes: null,   display_order: 20, parent_slug: "sp_cycling" },
  { slug: "sp_tennis",                 taxonomy: "sports", label_i18n_key: "interests.sp_tennis",                 registers: ["middle_class", "elite"], region_codes: null,   display_order: 30 },
  { slug: "sp_polo",                   taxonomy: "sports", label_i18n_key: "interests.sp_polo",                   registers: ["elite"],                  region_codes: null,   display_order: 40 },
  { slug: "sp_golf",                   taxonomy: "sports", label_i18n_key: "interests.sp_golf",                   registers: ["elite"],                  region_codes: null,   display_order: 50 },
  { slug: "sp_football",               taxonomy: "sports", label_i18n_key: "interests.sp_football",               registers: ["middle_class"],           region_codes: null,   display_order: 60 },
  { slug: "sp_swimming",               taxonomy: "sports", label_i18n_key: "interests.sp_swimming",               registers: ["middle_class", "elite"], region_codes: null,   display_order: 70 },
  { slug: "sp_running",                taxonomy: "sports", label_i18n_key: "interests.sp_running",                registers: ["middle_class", "elite"], region_codes: null,   display_order: 80 },
  { slug: "sp_equestrian",             taxonomy: "sports", label_i18n_key: "interests.sp_equestrian",             registers: ["elite"],                  region_codes: null,   display_order: 90 },
  { slug: "sp_sailing",                taxonomy: "sports", label_i18n_key: "interests.sp_sailing",                registers: ["elite"],                  region_codes: null,   display_order: 100 },
  { slug: "sp_skiing",                 taxonomy: "sports", label_i18n_key: "interests.sp_skiing",                 registers: ["elite"],                  region_codes: null,   display_order: 110 },
  { slug: "sp_padel",                  taxonomy: "sports", label_i18n_key: "interests.sp_padel",                  registers: ["middle_class", "elite"], region_codes: null,   display_order: 120 },
  { slug: "sp_hiking",                 taxonomy: "sports", label_i18n_key: "interests.sp_hiking",                 registers: ["middle_class", "elite"], region_codes: null,   display_order: 130 },
  { slug: "sp_rowing",                 taxonomy: "sports", label_i18n_key: "interests.sp_rowing",                 registers: ["middle_class", "elite"], region_codes: null,   display_order: 140 },
  { slug: "sp_fencing",                taxonomy: "sports", label_i18n_key: "interests.sp_fencing",                registers: ["elite"],                  region_codes: null,   display_order: 150 },
  { slug: "sp_hunting",                taxonomy: "sports", label_i18n_key: "interests.sp_hunting",                registers: ["elite"],                  region_codes: null,   display_order: 160, parent_slug: null },
  { slug: "sp_hunting_game_shooting",  taxonomy: "sports", label_i18n_key: "interests.sp_hunting_game_shooting",  registers: ["elite"],                  region_codes: null,   display_order: 161, parent_slug: "sp_hunting" },
  { slug: "sp_hunting_wing_shooting",  taxonomy: "sports", label_i18n_key: "interests.sp_hunting_wing_shooting",  registers: ["elite"],                  region_codes: null,   display_order: 162, parent_slug: "sp_hunting" },
  { slug: "sp_hunting_deer_stalking",  taxonomy: "sports", label_i18n_key: "interests.sp_hunting_deer_stalking",  registers: ["elite"],                  region_codes: null,   display_order: 163, parent_slug: "sp_hunting" },
  { slug: "sp_hunting_falconry",       taxonomy: "sports", label_i18n_key: "interests.sp_hunting_falconry",       registers: ["elite"],                  region_codes: null,   display_order: 164, parent_slug: "sp_hunting" },

  // ── gastronomy ────────────────────────────────────────────────────────────
  { slug: "ga_fine_dining",            taxonomy: "gastronomy", label_i18n_key: "interests.ga_fine_dining",            registers: ["elite"],                  region_codes: null,   display_order: 10 },
  { slug: "ga_wine_appreciation",      taxonomy: "gastronomy", label_i18n_key: "interests.ga_wine_appreciation",      registers: ["elite"],                  region_codes: null,   display_order: 20 },
  { slug: "ga_craft_beer",             taxonomy: "gastronomy", label_i18n_key: "interests.ga_craft_beer",             registers: ["middle_class"],           region_codes: ["BE"], display_order: 30 },
  { slug: "ga_beer_culture",           taxonomy: "gastronomy", label_i18n_key: "interests.ga_beer_culture",           registers: ["middle_class"],           region_codes: ["BE"], display_order: 40 },
  { slug: "ga_chocolate_culture",      taxonomy: "gastronomy", label_i18n_key: "interests.ga_chocolate_culture",      registers: ["middle_class", "elite"], region_codes: ["BE"], display_order: 50 },
  { slug: "ga_home_cooking",           taxonomy: "gastronomy", label_i18n_key: "interests.ga_home_cooking",           registers: ["middle_class"],           region_codes: null,   display_order: 60 },
  { slug: "ga_organic_food",           taxonomy: "gastronomy", label_i18n_key: "interests.ga_organic_food",           registers: ["middle_class", "elite"], region_codes: null,   display_order: 70 },
  { slug: "ga_world_cuisine",          taxonomy: "gastronomy", label_i18n_key: "interests.ga_world_cuisine",          registers: ["middle_class", "elite"], region_codes: null,   display_order: 80 },
  { slug: "ga_whisky_appreciation",    taxonomy: "gastronomy", label_i18n_key: "interests.ga_whisky_appreciation",    registers: ["elite"],                  region_codes: null,   display_order: 90 },
  { slug: "ga_cheese_culture",         taxonomy: "gastronomy", label_i18n_key: "interests.ga_cheese_culture",         registers: ["middle_class", "elite"], region_codes: null,   display_order: 100 },
  { slug: "ga_farmers_market",         taxonomy: "gastronomy", label_i18n_key: "interests.ga_farmers_market",         registers: ["middle_class"],           region_codes: null,   display_order: 110 },
  { slug: "ga_restaurant_culture",     taxonomy: "gastronomy", label_i18n_key: "interests.ga_restaurant_culture",     registers: ["middle_class", "elite"], region_codes: null,   display_order: 120 },
  { slug: "ga_tea_culture",            taxonomy: "gastronomy", label_i18n_key: "interests.ga_tea_culture",            registers: ["middle_class", "elite"], region_codes: null,   display_order: 130 },
  { slug: "ga_cocktail_culture",       taxonomy: "gastronomy", label_i18n_key: "interests.ga_cocktail_culture",       registers: ["middle_class", "elite"], region_codes: null,   display_order: 140 },
  { slug: "ga_food_travel",            taxonomy: "gastronomy", label_i18n_key: "interests.ga_food_travel",            registers: ["middle_class", "elite"], region_codes: null,   display_order: 150 },

  // ── dress_codes ───────────────────────────────────────────────────────────
  { slug: "dc_business_formal",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_business_formal",        registers: ["middle_class", "elite"], region_codes: null, display_order: 10 },
  { slug: "dc_smart_casual",           taxonomy: "dress_codes", label_i18n_key: "interests.dc_smart_casual",           registers: ["middle_class", "elite"], region_codes: null, display_order: 20 },
  { slug: "dc_black_tie",              taxonomy: "dress_codes", label_i18n_key: "interests.dc_black_tie",              registers: ["elite"],                  region_codes: null, display_order: 30 },
  { slug: "dc_white_tie",              taxonomy: "dress_codes", label_i18n_key: "interests.dc_white_tie",              registers: ["elite"],                  region_codes: null, display_order: 40 },
  { slug: "dc_business_casual",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_business_casual",        registers: ["middle_class"],           region_codes: null, display_order: 50 },
  { slug: "dc_cocktail_attire",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_cocktail_attire",        registers: ["middle_class", "elite"], region_codes: null, display_order: 60 },
  { slug: "dc_country_casual",         taxonomy: "dress_codes", label_i18n_key: "interests.dc_country_casual",         registers: ["elite"],                  region_codes: null, display_order: 70 },
  { slug: "dc_creative_casual",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_creative_casual",        registers: ["middle_class"],           region_codes: null, display_order: 80 },
  { slug: "dc_resort_wear",            taxonomy: "dress_codes", label_i18n_key: "interests.dc_resort_wear",            registers: ["middle_class", "elite"], region_codes: null, display_order: 90 },
  { slug: "dc_morning_coat",           taxonomy: "dress_codes", label_i18n_key: "interests.dc_morning_coat",           registers: ["elite"],                  region_codes: null, display_order: 100 },
  { slug: "dc_lounge_suit",            taxonomy: "dress_codes", label_i18n_key: "interests.dc_lounge_suit",            registers: ["middle_class", "elite"], region_codes: null, display_order: 110 },
  { slug: "dc_capsule_wardrobe",       taxonomy: "dress_codes", label_i18n_key: "interests.dc_capsule_wardrobe",       registers: ["middle_class", "elite"], region_codes: null, display_order: 120 },
  { slug: "dc_vintage_classic",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_vintage_classic",        registers: ["middle_class", "elite"], region_codes: null, display_order: 130 },
  { slug: "dc_sustainable_fashion",    taxonomy: "dress_codes", label_i18n_key: "interests.dc_sustainable_fashion",    registers: ["middle_class"],           region_codes: null, display_order: 140 },
  { slug: "dc_traditional_formal",     taxonomy: "dress_codes", label_i18n_key: "interests.dc_traditional_formal",     registers: ["middle_class", "elite"], region_codes: null, display_order: 150 },
];

async function main() {
  console.log(`[seed-interest-catalog] Upserting ${ITEMS.length} items…`);

  for (const item of ITEMS) {
    await db
      .insert(interestCatalogTable)
      .values({
        slug:           item.slug,
        taxonomy:       item.taxonomy,
        label_i18n_key: item.label_i18n_key,
        registers:      item.registers,
        region_codes:   item.region_codes,
        display_order:  item.display_order,
        parent_slug:    item.parent_slug ?? null,
      })
      .onConflictDoUpdate({
        target: interestCatalogTable.slug,
        set: {
          taxonomy:       sql`excluded.taxonomy`,
          label_i18n_key: sql`excluded.label_i18n_key`,
          registers:      sql`excluded.registers`,
          region_codes:   sql`excluded.region_codes`,
          display_order:  sql`excluded.display_order`,
          parent_slug:    sql`excluded.parent_slug`,
        },
      });
  }

  console.log(`[seed-interest-catalog] Done. ${ITEMS.length} items upserted.`);

  const counts = await db.execute(
    sql`SELECT taxonomy, count(*)::int FROM interest_catalog GROUP BY taxonomy ORDER BY taxonomy`
  );
  console.log("[seed-interest-catalog] Counts by taxonomy:");
  for (const row of counts.rows as { taxonomy: string; count: number }[]) {
    console.log(`  ${row.taxonomy}: ${row.count}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("[seed-interest-catalog] Failed:", err);
  process.exit(1);
});
