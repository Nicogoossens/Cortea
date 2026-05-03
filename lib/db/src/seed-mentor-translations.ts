/**
 * SEED: Mentor feedback translations (24 keys × 10 locales = 240 rows)
 *
 * Reads the flat `mentor.{tone}.{bracket}.{index}` keys from the i18next
 * locale files at artifacts/sowiso/src/locales/{lang}/translation.json
 * and upserts them into the `translations` table so admins can edit them
 * from the admin panel like any other translation key.
 *
 * Locales covered: en, nl, de, fr, es, it, pt, ar, ja, zh
 *
 * Usage:
 *   pnpm --filter @workspace/db run seed-mentor-translations
 *   pnpm --filter @workspace/db run seed-mentor-translations -- --force
 *
 * Without --force, existing rows are preserved (insert-on-conflict-do-nothing).
 * With --force, existing rows for these keys are overwritten with the values
 * from the locale JSON files.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";

import { db } from "./index.js";
import { translationsTable } from "./schema/index.js";

type TranslationRow = Omit<typeof translationsTable.$inferInsert, "id">;

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, "../../../artifacts/sowiso/src/locales");

const LANGUAGES: Array<{ code: string; formality: string; rtl: boolean }> = [
  { code: "en", formality: "high",   rtl: false },
  { code: "nl", formality: "high",   rtl: false },
  { code: "de", formality: "high",   rtl: false },
  { code: "fr", formality: "high",   rtl: false },
  { code: "es", formality: "medium", rtl: false },
  { code: "it", formality: "medium", rtl: false },
  { code: "pt", formality: "medium", rtl: false },
  { code: "ar", formality: "high",   rtl: true  },
  { code: "ja", formality: "high",   rtl: false },
  { code: "zh", formality: "medium", rtl: false },
];

const TONES = ["correct", "incorrect"] as const;
const BRACKETS = ["young", "adult", "mature"] as const;
const INDICES = [0, 1, 2, 3] as const;

function buildKeys(): string[] {
  const keys: string[] = [];
  for (const tone of TONES) {
    for (const bracket of BRACKETS) {
      for (const i of INDICES) {
        keys.push(`mentor.${tone}.${bracket}.${i}`);
      }
    }
  }
  return keys;
}

function loadLocale(code: string): Record<string, unknown> {
  const path = resolve(LOCALES_DIR, code, "translation.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

const FLAG_FORCE = process.argv.includes("--force");

async function seedMentorTranslations() {
  console.log("Seeding mentor feedback translations…");

  const keys = buildKeys();
  const rows: TranslationRow[] = [];
  const missing: string[] = [];

  for (const lang of LANGUAGES) {
    const dict = loadLocale(lang.code);
    for (const key of keys) {
      const value = dict[key];
      if (typeof value !== "string" || value.length === 0) {
        missing.push(`${lang.code}:${key}`);
        continue;
      }
      rows.push({
        language_code:      lang.code,
        formality_register: lang.formality,
        rtl_flag:           lang.rtl,
        key,
        value,
      });
    }
  }

  if (missing.length > 0) {
    console.error(`  Missing ${missing.length} mentor translations in locale files:`);
    for (const m of missing) console.error(`    - ${m}`);
    throw new Error("Refusing to seed with missing mentor translations.");
  }

  if (FLAG_FORCE) {
    console.log("  --force: existing mentor.* rows will be overwritten with locale-file values.");
  } else {
    console.log("  Upserting — new keys inserted, existing rows preserved (use --force to overwrite).");
  }

  // Use raw SQL so we only address the 5 columns we care about. This keeps
  // the seed resilient to other schema columns (e.g. calibrated_module) that
  // may exist in code but not yet in the live DB, or vice versa.
  const conflictAction = FLAG_FORCE
    ? sql`DO UPDATE SET value = EXCLUDED.value, formality_register = EXCLUDED.formality_register, rtl_flag = EXCLUDED.rtl_flag`
    : sql`DO NOTHING`;

  const BATCH = 200;
  let processed = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const valuesSql = sql.join(
      slice.map(
        (r) => sql`(${r.language_code}, ${r.formality_register}, ${r.rtl_flag}, ${r.key}, ${r.value})`,
      ),
      sql`, `,
    );
    await db.execute(sql`
      INSERT INTO translations (language_code, formality_register, rtl_flag, key, value)
      VALUES ${valuesSql}
      ON CONFLICT (language_code, key) ${conflictAction}
    `);
    processed += slice.length;
  }

  console.log(`  ${processed} rows processed (${LANGUAGES.length} locales × ${keys.length} keys).`);
  console.log("Mentor translation seed complete.");
  process.exit(0);
}

seedMentorTranslations().catch((err) => {
  console.error("Mentor translation seed failed:", err);
  process.exit(1);
});
