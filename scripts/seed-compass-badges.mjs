#!/usr/bin/env node
/**
 * Seed 21 compass-type badges — one per Compass region.
 * Idempotent: INSERT … ON CONFLICT DO NOTHING.
 * Usage: node scripts/seed-compass-badges.mjs
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const dbPkgDir = path.resolve(__dirname, "../lib/db");
const pg = require(path.resolve(dbPkgDir, "node_modules/pg"));
const { Pool } = pg;

const COMPASS_REGIONS = [
  { code: "GB", name: "Verenigd Koninkrijk" },
  { code: "US", name: "Verenigde Staten" },
  { code: "AE", name: "VAE / Dubai" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "FR", name: "Frankrijk" },
  { code: "DE", name: "Duitsland" },
  { code: "NL", name: "Nederland" },
  { code: "AU", name: "Australië" },
  { code: "CA", name: "Canada" },
  { code: "IT", name: "Italië" },
  { code: "IN", name: "India" },
  { code: "ES", name: "Spanje" },
  { code: "PT", name: "Portugal" },
  { code: "SG", name: "Singapore" },
  { code: "BR", name: "Brazilië" },
  { code: "ZA", name: "Zuid-Afrika" },
  { code: "MX", name: "Mexico" },
  { code: "CO", name: "Colombia" },
  { code: "BE", name: "België" },
  { code: "CH", name: "Zwitserland" },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  let inserted = 0;
  let skipped = 0;

  for (const region of COMPASS_REGIONS) {
    const slug = `compass-${region.code.toLowerCase()}`;
    const title = `Compas: ${region.name}`;
    const description = `Volledig verkend in het Compas.`;

    const result = await pool.query(
      `INSERT INTO badges (slug, title, description, badge_type, register, region_code)
       VALUES ($1, $2, $3, 'compass', 'none', $4)
       ON CONFLICT (slug) DO NOTHING`,
      [slug, title, description, region.code]
    );

    if (result.rowCount > 0) {
      console.log(`  ✓ ${slug}`);
      inserted++;
    } else {
      console.log(`  - ${slug} (already exists)`);
      skipped++;
    }
  }

  await pool.end();
  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
