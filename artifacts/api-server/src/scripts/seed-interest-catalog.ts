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
  // Parents (flat / no children)
  { slug: "sc_family_dinner",          taxonomy: "social_circles", label_i18n_key: "interests.sc_family_dinner",          registers: ["middle_class", "elite"], region_codes: null, display_order:  10, parent_slug: null },
  { slug: "sc_neighbourhood",          taxonomy: "social_circles", label_i18n_key: "interests.sc_neighbourhood",          registers: ["middle_class"],           region_codes: null, display_order:  20, parent_slug: null },
  { slug: "sc_book_club",              taxonomy: "social_circles", label_i18n_key: "interests.sc_book_club",              registers: ["middle_class"],           region_codes: null, display_order:  90, parent_slug: null },
  { slug: "sc_volunteer_group",        taxonomy: "social_circles", label_i18n_key: "interests.sc_volunteer_group",        registers: ["middle_class"],           region_codes: null, display_order: 120, parent_slug: null },
  { slug: "sc_charity_gala",           taxonomy: "social_circles", label_i18n_key: "interests.sc_charity_gala",           registers: ["elite"],                  region_codes: null, display_order:  40, parent_slug: null },
  { slug: "sc_diplomatic_reception",   taxonomy: "social_circles", label_i18n_key: "interests.sc_diplomatic_reception",   registers: ["elite"],                  region_codes: null, display_order: 110, parent_slug: null },
  // Parent: corporate networking → professional sub-circles
  { slug: "sc_corporate_networking",   taxonomy: "social_circles", label_i18n_key: "interests.sc_corporate_networking",   registers: ["middle_class", "elite"], region_codes: null, display_order:  30, parent_slug: null },
  { slug: "sc_alumni_network",         taxonomy: "social_circles", label_i18n_key: "interests.sc_alumni_network",         registers: ["middle_class", "elite"], region_codes: null, display_order: 100, parent_slug: "sc_corporate_networking" },
  { slug: "sc_professional_assoc",     taxonomy: "social_circles", label_i18n_key: "interests.sc_professional_assoc",     registers: ["middle_class", "elite"], region_codes: null, display_order: 130, parent_slug: "sc_corporate_networking" },
  { slug: "sc_academic_conference",    taxonomy: "social_circles", label_i18n_key: "interests.sc_academic_conference",    registers: ["middle_class", "elite"], region_codes: null, display_order:  50, parent_slug: "sc_corporate_networking" },
  // Parent: private members club → elite club sub-types
  { slug: "sc_private_members_club",   taxonomy: "social_circles", label_i18n_key: "interests.sc_private_members_club",   registers: ["elite"],                  region_codes: null, display_order:  60, parent_slug: null },
  { slug: "sc_golf_club",              taxonomy: "social_circles", label_i18n_key: "interests.sc_golf_club",              registers: ["elite"],                  region_codes: null, display_order:  70, parent_slug: "sc_private_members_club" },
  { slug: "sc_wine_society",           taxonomy: "social_circles", label_i18n_key: "interests.sc_wine_society",           registers: ["elite"],                  region_codes: null, display_order:  80, parent_slug: "sc_private_members_club" },
  { slug: "sc_cultural_salon",         taxonomy: "social_circles", label_i18n_key: "interests.sc_cultural_salon",         registers: ["elite"],                  region_codes: null, display_order: 140, parent_slug: "sc_private_members_club" },
  { slug: "sc_sports_club",            taxonomy: "social_circles", label_i18n_key: "interests.sc_sports_club",            registers: ["middle_class", "elite"], region_codes: null, display_order: 150, parent_slug: "sc_private_members_club" },

  // ── cultural_interests ────────────────────────────────────────────────────
  // Flat parents
  { slug: "ci_literature",             taxonomy: "cultural_interests", label_i18n_key: "interests.ci_literature",             registers: ["middle_class", "elite"], region_codes: null,   display_order:  50, parent_slug: null },
  { slug: "ci_folklore_traditions",    taxonomy: "cultural_interests", label_i18n_key: "interests.ci_folklore_traditions",    registers: ["middle_class"],           region_codes: null,   display_order: 130, parent_slug: null },
  { slug: "ci_gastronomy_culture",     taxonomy: "cultural_interests", label_i18n_key: "interests.ci_gastronomy_culture",     registers: ["middle_class", "elite"], region_codes: null,   display_order: 150, parent_slug: null },
  // Parent: performing arts → classical / contemporary forms
  { slug: "ci_theatre_opera",          taxonomy: "cultural_interests", label_i18n_key: "interests.ci_theatre_opera",          registers: ["middle_class", "elite"], region_codes: null,   display_order:  30, parent_slug: null },
  { slug: "ci_ballet",                 taxonomy: "cultural_interests", label_i18n_key: "interests.ci_ballet",                 registers: ["elite"],                  region_codes: null,   display_order: 100, parent_slug: "ci_theatre_opera" },
  { slug: "ci_classical_music",        taxonomy: "cultural_interests", label_i18n_key: "interests.ci_classical_music",        registers: ["middle_class", "elite"], region_codes: null,   display_order:  10, parent_slug: "ci_theatre_opera" },
  { slug: "ci_jazz_music",             taxonomy: "cultural_interests", label_i18n_key: "interests.ci_jazz_music",             registers: ["middle_class", "elite"], region_codes: null,   display_order:  80, parent_slug: "ci_theatre_opera" },
  { slug: "ci_arthouse_cinema",        taxonomy: "cultural_interests", label_i18n_key: "interests.ci_arthouse_cinema",        registers: ["middle_class", "elite"], region_codes: null,   display_order:  40, parent_slug: "ci_theatre_opera" },
  // Parent: fine arts & collecting → visual art sub-types
  { slug: "ci_fine_art_collecting",    taxonomy: "cultural_interests", label_i18n_key: "interests.ci_fine_art_collecting",    registers: ["elite"],                  region_codes: null,   display_order: 140, parent_slug: null },
  { slug: "ci_contemporary_art",       taxonomy: "cultural_interests", label_i18n_key: "interests.ci_contemporary_art",       registers: ["elite"],                  region_codes: null,   display_order:  20, parent_slug: "ci_fine_art_collecting" },
  { slug: "ci_photography",            taxonomy: "cultural_interests", label_i18n_key: "interests.ci_photography",            registers: ["middle_class", "elite"], region_codes: null,   display_order: 110, parent_slug: "ci_fine_art_collecting" },
  { slug: "ci_street_art",             taxonomy: "cultural_interests", label_i18n_key: "interests.ci_street_art",             registers: ["middle_class"],           region_codes: null,   display_order:  90, parent_slug: "ci_fine_art_collecting" },
  { slug: "ci_comics_bd",              taxonomy: "cultural_interests", label_i18n_key: "interests.ci_comics_bd",              registers: ["middle_class"],           region_codes: ["BE"], display_order: 120, parent_slug: "ci_fine_art_collecting" },
  // Parent: architecture & design → built-heritage sub-type
  { slug: "ci_architecture_design",    taxonomy: "cultural_interests", label_i18n_key: "interests.ci_architecture_design",    registers: ["middle_class", "elite"], region_codes: null,   display_order:  70, parent_slug: null },
  { slug: "ci_heritage_museums",       taxonomy: "cultural_interests", label_i18n_key: "interests.ci_heritage_museums",       registers: ["middle_class", "elite"], region_codes: null,   display_order:  60, parent_slug: "ci_architecture_design" },

  // ── sports ────────────────────────────────────────────────────────────────
  // Flat top-level sports
  { slug: "sp_polo",                   taxonomy: "sports", label_i18n_key: "interests.sp_polo",                   registers: ["elite"],                  region_codes: null,   display_order:  40, parent_slug: null },
  { slug: "sp_equestrian",             taxonomy: "sports", label_i18n_key: "interests.sp_equestrian",             registers: ["elite"],                  region_codes: null,   display_order:  90, parent_slug: null },
  { slug: "sp_sailing",                taxonomy: "sports", label_i18n_key: "interests.sp_sailing",                registers: ["elite"],                  region_codes: null,   display_order: 100, parent_slug: null },
  { slug: "sp_fencing",                taxonomy: "sports", label_i18n_key: "interests.sp_fencing",                registers: ["elite"],                  region_codes: null,   display_order: 150, parent_slug: null },
  { slug: "sp_rowing",                 taxonomy: "sports", label_i18n_key: "interests.sp_rowing",                 registers: ["middle_class", "elite"], region_codes: null,   display_order: 140, parent_slug: null },
  { slug: "sp_golf",                   taxonomy: "sports", label_i18n_key: "interests.sp_golf",                   registers: ["elite"],                  region_codes: null,   display_order:  50, parent_slug: null },
  { slug: "sp_tennis",                 taxonomy: "sports", label_i18n_key: "interests.sp_tennis",                 registers: ["middle_class", "elite"], region_codes: null,   display_order:  30, parent_slug: null },
  { slug: "sp_skiing",                 taxonomy: "sports", label_i18n_key: "interests.sp_skiing",                 registers: ["elite"],                  region_codes: null,   display_order: 110, parent_slug: null },
  { slug: "sp_padel",                  taxonomy: "sports", label_i18n_key: "interests.sp_padel",                  registers: ["middle_class", "elite"], region_codes: null,   display_order: 120, parent_slug: null },
  { slug: "sp_swimming",               taxonomy: "sports", label_i18n_key: "interests.sp_swimming",               registers: ["middle_class", "elite"], region_codes: null,   display_order:  70, parent_slug: null },
  { slug: "sp_running",                taxonomy: "sports", label_i18n_key: "interests.sp_running",                registers: ["middle_class", "elite"], region_codes: null,   display_order:  80, parent_slug: null },
  { slug: "sp_hiking",                 taxonomy: "sports", label_i18n_key: "interests.sp_hiking",                 registers: ["middle_class", "elite"], region_codes: null,   display_order: 130, parent_slug: null },
  { slug: "sp_football",               taxonomy: "sports", label_i18n_key: "interests.sp_football",               registers: ["middle_class"],           region_codes: null,   display_order:  60, parent_slug: null },
  // Parent: cycling → road sub-type
  { slug: "sp_cycling",                taxonomy: "sports", label_i18n_key: "interests.sp_cycling",                registers: ["middle_class"],           region_codes: ["BE"], display_order:  10, parent_slug: null },
  { slug: "sp_cycling_road",           taxonomy: "sports", label_i18n_key: "interests.sp_cycling_road",           registers: ["middle_class"],           region_codes: null,   display_order:  20, parent_slug: "sp_cycling" },
  // Parent: hunting → discipline sub-types
  { slug: "sp_hunting",                taxonomy: "sports", label_i18n_key: "interests.sp_hunting",                registers: ["elite"],                  region_codes: null,   display_order: 160, parent_slug: null },
  { slug: "sp_hunting_game_shooting",  taxonomy: "sports", label_i18n_key: "interests.sp_hunting_game_shooting",  registers: ["elite"],                  region_codes: null,   display_order: 161, parent_slug: "sp_hunting" },
  { slug: "sp_hunting_wing_shooting",  taxonomy: "sports", label_i18n_key: "interests.sp_hunting_wing_shooting",  registers: ["elite"],                  region_codes: null,   display_order: 162, parent_slug: "sp_hunting" },
  { slug: "sp_hunting_deer_stalking",  taxonomy: "sports", label_i18n_key: "interests.sp_hunting_deer_stalking",  registers: ["elite"],                  region_codes: null,   display_order: 163, parent_slug: "sp_hunting" },
  { slug: "sp_hunting_falconry",       taxonomy: "sports", label_i18n_key: "interests.sp_hunting_falconry",       registers: ["elite"],                  region_codes: null,   display_order: 164, parent_slug: "sp_hunting" },

  // ── gastronomy ────────────────────────────────────────────────────────────
  // Parent: fine dining → restaurant & culinary travel sub-types
  { slug: "ga_fine_dining",            taxonomy: "gastronomy", label_i18n_key: "interests.ga_fine_dining",            registers: ["elite"],                  region_codes: null,   display_order:  10, parent_slug: null },
  { slug: "ga_restaurant_culture",     taxonomy: "gastronomy", label_i18n_key: "interests.ga_restaurant_culture",     registers: ["middle_class", "elite"], region_codes: null,   display_order: 120, parent_slug: "ga_fine_dining" },
  { slug: "ga_food_travel",            taxonomy: "gastronomy", label_i18n_key: "interests.ga_food_travel",            registers: ["middle_class", "elite"], region_codes: null,   display_order: 150, parent_slug: "ga_fine_dining" },
  { slug: "ga_world_cuisine",          taxonomy: "gastronomy", label_i18n_key: "interests.ga_world_cuisine",          registers: ["middle_class", "elite"], region_codes: null,   display_order:  80, parent_slug: "ga_fine_dining" },
  // Parent: wine appreciation → spirit & beverage sub-types
  { slug: "ga_wine_appreciation",      taxonomy: "gastronomy", label_i18n_key: "interests.ga_wine_appreciation",      registers: ["elite"],                  region_codes: null,   display_order:  20, parent_slug: null },
  { slug: "ga_whisky_appreciation",    taxonomy: "gastronomy", label_i18n_key: "interests.ga_whisky_appreciation",    registers: ["elite"],                  region_codes: null,   display_order:  90, parent_slug: "ga_wine_appreciation" },
  { slug: "ga_cocktail_culture",       taxonomy: "gastronomy", label_i18n_key: "interests.ga_cocktail_culture",       registers: ["middle_class", "elite"], region_codes: null,   display_order: 140, parent_slug: "ga_wine_appreciation" },
  { slug: "ga_craft_beer",             taxonomy: "gastronomy", label_i18n_key: "interests.ga_craft_beer",             registers: ["middle_class"],           region_codes: ["BE"], display_order:  30, parent_slug: "ga_wine_appreciation" },
  { slug: "ga_beer_culture",           taxonomy: "gastronomy", label_i18n_key: "interests.ga_beer_culture",           registers: ["middle_class"],           region_codes: ["BE"], display_order:  40, parent_slug: "ga_wine_appreciation" },
  { slug: "ga_tea_culture",            taxonomy: "gastronomy", label_i18n_key: "interests.ga_tea_culture",            registers: ["middle_class", "elite"], region_codes: null,   display_order: 130, parent_slug: "ga_wine_appreciation" },
  // Parent: home cooking → artisan & market sub-types
  { slug: "ga_home_cooking",           taxonomy: "gastronomy", label_i18n_key: "interests.ga_home_cooking",           registers: ["middle_class"],           region_codes: null,   display_order:  60, parent_slug: null },
  { slug: "ga_organic_food",           taxonomy: "gastronomy", label_i18n_key: "interests.ga_organic_food",           registers: ["middle_class", "elite"], region_codes: null,   display_order:  70, parent_slug: "ga_home_cooking" },
  { slug: "ga_farmers_market",         taxonomy: "gastronomy", label_i18n_key: "interests.ga_farmers_market",         registers: ["middle_class"],           region_codes: null,   display_order: 110, parent_slug: "ga_home_cooking" },
  { slug: "ga_chocolate_culture",      taxonomy: "gastronomy", label_i18n_key: "interests.ga_chocolate_culture",      registers: ["middle_class", "elite"], region_codes: ["BE"], display_order:  50, parent_slug: "ga_home_cooking" },
  { slug: "ga_cheese_culture",         taxonomy: "gastronomy", label_i18n_key: "interests.ga_cheese_culture",         registers: ["middle_class", "elite"], region_codes: null,   display_order: 100, parent_slug: "ga_home_cooking" },

  // ── dress_codes ───────────────────────────────────────────────────────────
  // Parent: black tie → white tie & morning dress (formal ceremony sub-types)
  { slug: "dc_black_tie",              taxonomy: "dress_codes", label_i18n_key: "interests.dc_black_tie",              registers: ["elite"],                  region_codes: null, display_order:  30, parent_slug: null },
  { slug: "dc_white_tie",              taxonomy: "dress_codes", label_i18n_key: "interests.dc_white_tie",              registers: ["elite"],                  region_codes: null, display_order:  40, parent_slug: "dc_black_tie" },
  { slug: "dc_morning_coat",           taxonomy: "dress_codes", label_i18n_key: "interests.dc_morning_coat",           registers: ["elite"],                  region_codes: null, display_order: 100, parent_slug: "dc_black_tie" },
  // Parent: business formal → professional dress sub-types
  { slug: "dc_business_formal",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_business_formal",        registers: ["middle_class", "elite"], region_codes: null, display_order:  10, parent_slug: null },
  { slug: "dc_lounge_suit",            taxonomy: "dress_codes", label_i18n_key: "interests.dc_lounge_suit",            registers: ["middle_class", "elite"], region_codes: null, display_order: 110, parent_slug: "dc_business_formal" },
  { slug: "dc_business_casual",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_business_casual",        registers: ["middle_class"],           region_codes: null, display_order:  50, parent_slug: "dc_business_formal" },
  // Parent: smart casual → relaxed-occasion sub-types
  { slug: "dc_smart_casual",           taxonomy: "dress_codes", label_i18n_key: "interests.dc_smart_casual",           registers: ["middle_class", "elite"], region_codes: null, display_order:  20, parent_slug: null },
  { slug: "dc_cocktail_attire",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_cocktail_attire",        registers: ["middle_class", "elite"], region_codes: null, display_order:  60, parent_slug: "dc_smart_casual" },
  { slug: "dc_country_casual",         taxonomy: "dress_codes", label_i18n_key: "interests.dc_country_casual",         registers: ["elite"],                  region_codes: null, display_order:  70, parent_slug: "dc_smart_casual" },
  { slug: "dc_creative_casual",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_creative_casual",        registers: ["middle_class"],           region_codes: null, display_order:  80, parent_slug: "dc_smart_casual" },
  { slug: "dc_resort_wear",            taxonomy: "dress_codes", label_i18n_key: "interests.dc_resort_wear",            registers: ["middle_class", "elite"], region_codes: null, display_order:  90, parent_slug: "dc_smart_casual" },
  // Parent: capsule wardrobe → sustainable & heritage sub-types
  { slug: "dc_capsule_wardrobe",       taxonomy: "dress_codes", label_i18n_key: "interests.dc_capsule_wardrobe",       registers: ["middle_class", "elite"], region_codes: null, display_order: 120, parent_slug: null },
  { slug: "dc_vintage_classic",        taxonomy: "dress_codes", label_i18n_key: "interests.dc_vintage_classic",        registers: ["middle_class", "elite"], region_codes: null, display_order: 130, parent_slug: "dc_capsule_wardrobe" },
  { slug: "dc_sustainable_fashion",    taxonomy: "dress_codes", label_i18n_key: "interests.dc_sustainable_fashion",    registers: ["middle_class"],           region_codes: null, display_order: 140, parent_slug: "dc_capsule_wardrobe" },
  { slug: "dc_traditional_formal",     taxonomy: "dress_codes", label_i18n_key: "interests.dc_traditional_formal",     registers: ["middle_class", "elite"], region_codes: null, display_order: 150, parent_slug: "dc_capsule_wardrobe" },
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
