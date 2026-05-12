/**
 * seed-u1-catalog.ts
 *
 * Imports U1_COMPLETE_all_tags.csv (352 items, 17 categories) into interest_catalog.
 * Clears existing rows first, then inserts all U1 items.
 * Also writes i18n keys (NL + EN from CSV, EN fallback for other 8 locales) to locale files.
 *
 * Run: pnpm tsx src/scripts/seed-u1-catalog.ts
 */

import { db, pool } from "@workspace/db";
import { sql } from "drizzle-orm";
import { readFileSync, writeFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += line[i];
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n");
  const header = parseCSVLine(lines[0]);
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => {
      const vals = parseCSVLine(l);
      const row: Record<string, string> = {};
      header.forEach((h, i) => {
        row[h] = vals[i] ?? "";
      });
      return row;
    });
}

// ── Locale updater ────────────────────────────────────────────────────────────

const LOCALE_DIR = resolve(__dirname, "../../../sowiso/src/locales");

const TAXONOMY_LABELS: Record<string, { nl: string; en: string }> = {
  goals:               { nl: "Doelen",                   en: "Goals" },
  spheres:             { nl: "Leefwerelden",              en: "Spheres" },
  dresscode:           { nl: "Dresscode",                 en: "Dress Code" },
  wardrobe_philosophy: { nl: "Kledingfilosofie",          en: "Wardrobe Philosophy" },
  sport_leisure:       { nl: "Sport & Vrije Tijd",        en: "Sport & Leisure" },
  cuisines:            { nl: "Keukens",                   en: "Cuisines" },
  culinary_techniques: { nl: "Culinaire Technieken",      en: "Culinary Techniques" },
  beverages:           { nl: "Dranken",                   en: "Beverages" },
  foods:               { nl: "Etenswaren",                en: "Foods" },
  food_philosophy:     { nl: "Voedingsfilosofie",         en: "Food Philosophy" },
  cultural_interests:  { nl: "Culturele Interesses",      en: "Cultural Interests" },
  social_circles:      { nl: "Sociale Kringen",           en: "Social Circles" },
  travel_styles:       { nl: "Reizigersprofiel",          en: "Travel Styles" },
  vehicle_preferences: { nl: "Voertuigvoorkeur",          en: "Vehicle Preferences" },
  residence_style:     { nl: "Woonstijl",                 en: "Residence Style" },
  education_tradition: { nl: "Opleiding & Traditie",      en: "Education & Tradition" },
  religious_tradition: { nl: "Religieuze Traditie",       en: "Religious Tradition" },
};

const LOCALES_WITH_LANG: Record<string, "nl" | "en"> = {
  en: "en",
  nl: "nl",
  fr: "en",
  de: "en",
  es: "en",
  it: "en",
  ja: "en",
  pt: "en",
  ar: "en",
  zh: "en",
};

function updateLocaleFile(
  locale: string,
  lang: "nl" | "en",
  items: Record<string, string>[]
): number {
  const filePath = join(LOCALE_DIR, locale, "translation.json");
  const data: Record<string, string> = JSON.parse(readFileSync(filePath, "utf8"));

  let added = 0;

  // Add taxonomy labels
  for (const [taxonomy, labels] of Object.entries(TAXONOMY_LABELS)) {
    const key = `profile.taxonomy.${taxonomy}`;
    if (!data[key]) {
      data[key] = labels[lang];
      added++;
    } else {
      // Always update taxonomy labels to match new values
      if (data[key] !== labels[lang]) {
        data[key] = labels[lang];
        added++;
      }
    }
  }

  // Add interest item keys
  for (const row of items) {
    const key = `interests.${row.tag_id}`;
    const label = lang === "nl" ? row.label_nl : row.label_en;
    if (!data[key] || data[key] !== label) {
      data[key] = label || row.label_en;
      added++;
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return added;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Ensure schema has new columns
  console.log("[seed-u1] Ensuring schema columns…");
  await db.execute(sql`ALTER TABLE interest_catalog ADD COLUMN IF NOT EXISTS relevance_scope TEXT`);
  await db.execute(sql`ALTER TABLE interest_catalog ADD COLUMN IF NOT EXISTS notes TEXT`);

  // 2. Parse CSV
  const csvPath = resolve(__dirname, "../../../../attached_assets/U1_COMPLETE_all_tags.csv");
  console.log(`[seed-u1] Reading CSV: ${csvPath}`);
  const csvText = readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvText);
  console.log(`[seed-u1] Parsed ${rows.length} rows`);

  // 3. Clear existing catalog
  await db.execute(sql`DELETE FROM interest_catalog`);
  console.log("[seed-u1] Cleared existing interest_catalog rows");

  // 4. Insert all U1 rows
  console.log("[seed-u1] Inserting rows…");
  let i = 0;
  for (const row of rows) {
    const slug = row.tag_id;
    if (!slug) continue;
    const taxonomy = row.category;
    const label_i18n_key = `interests.${slug}`;
    const elite_gated = row.elite_gated === "yes";
    const registers = elite_gated ? ["elite"] : ["middle_class", "elite"];
    const relevance_scope = row.relevance_scope || null;
    const notes = row.notes || null;

    await db.execute(sql`
      INSERT INTO interest_catalog (slug, taxonomy, label_i18n_key, registers, relevance_scope, notes, display_order)
      VALUES (
        ${slug},
        ${taxonomy},
        ${label_i18n_key},
        ${JSON.stringify(registers)}::jsonb,
        ${relevance_scope},
        ${notes},
        ${i * 10}
      )
      ON CONFLICT (slug) DO UPDATE SET
        taxonomy        = EXCLUDED.taxonomy,
        label_i18n_key  = EXCLUDED.label_i18n_key,
        registers       = EXCLUDED.registers,
        relevance_scope = EXCLUDED.relevance_scope,
        notes           = EXCLUDED.notes,
        display_order   = EXCLUDED.display_order
    `);
    i++;
    if (i % 50 === 0) process.stdout.write(`  ${i}/${rows.length}\n`);
  }
  process.stdout.write(`  ${i}/${rows.length}\n`);
  console.log(`[seed-u1] Done. ${i} items upserted.`);

  // 5. Count by taxonomy
  const counts = await db.execute(sql`
    SELECT taxonomy, COUNT(*)::int as count FROM interest_catalog GROUP BY taxonomy ORDER BY taxonomy
  `);
  console.log("[seed-u1] Counts by taxonomy:");
  counts.rows.forEach((r: any) => console.log(`  ${r.taxonomy}: ${r.count}`));

  // 6. Update locale files
  console.log("[seed-u1] Updating locale files…");
  for (const [locale, lang] of Object.entries(LOCALES_WITH_LANG)) {
    const added = updateLocaleFile(locale, lang, rows);
    console.log(`  [${locale}] ${added > 0 ? `Updated ${added} keys` : "No changes"}`);
  }

  await pool.end();
  console.log("[seed-u1] All done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
