#!/usr/bin/env node
/**
 * Seeds the translations table in PostgreSQL from the locale JSON files.
 * Handles upsert so re-running is safe.
 *
 * Usage: node scripts/seed-translations.mjs [--lang en] [--force]
 * Runs from the workspace root using the api-server's pg dependency.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOCALES_DIR = resolve(ROOT, "artifacts/sowiso/src/locales");

// Use pg from pnpm virtual store
const require = createRequire(import.meta.url);
const pgPath = resolve(ROOT, "node_modules/.pnpm/pg@8.20.0/node_modules/pg");
const pg = require(pgPath);

const args = process.argv.slice(2);
const targetLang = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;

const RTL_LANGS = new Set(["ar"]);

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database.");

  const langs = readdirSync(LOCALES_DIR).filter((d) => {
    if (targetLang && d !== targetLang) return false;
    const jsonPath = resolve(LOCALES_DIR, d, "translation.json");
    return existsSync(jsonPath);
  });

  console.log(`Seeding locales: ${langs.join(", ")}`);

  let total = 0;
  for (const lang of langs) {
    const jsonPath = resolve(LOCALES_DIR, lang, "translation.json");
    const translations = JSON.parse(readFileSync(jsonPath, "utf8"));
    const keys = Object.keys(translations);
    const isRtl = RTL_LANGS.has(lang);

    console.log(`  ${lang}: ${keys.length} keys (rtl=${isRtl})`);

    const CHUNK = 50;
    for (let i = 0; i < keys.length; i += CHUNK) {
      const chunk = keys.slice(i, i + CHUNK);
      const valuePlaceholders = chunk.map((_, idx) => {
        const o = idx * 5;
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5})`;
      });
      const params = chunk.flatMap((k) => [lang, "high", isRtl, k, translations[k]]);

      await client.query(
        `INSERT INTO translations (language_code, formality_register, rtl_flag, key, value)
         VALUES ${valuePlaceholders.join(", ")}
         ON CONFLICT (language_code, key)
         DO UPDATE SET value = EXCLUDED.value, rtl_flag = EXCLUDED.rtl_flag`,
        params
      );
      total += chunk.length;
    }
    console.log(`    ✓ ${lang} seeded`);
  }

  await client.end();
  console.log(`\nDone — seeded ${total} rows total.`);
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
