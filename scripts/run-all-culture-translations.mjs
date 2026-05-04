#!/usr/bin/env node
/**
 * run-all-culture-translations.mjs
 *
 * Runs all 9 language translations sequentially (no parallelism to stay within
 * rate limits), then runs the Compass Protocol Generator for new countries.
 * Each step is idempotent — already-translated rows are skipped automatically.
 */

import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE = process.execPath;

const LANG_SEQUENCE = ["pt", "nl", "fr", "de", "es", "it", "ar", "ja", "zh"];
const BATCH_SIZE = "500";

function run(scriptRelPath, args = []) {
  const scriptPath = path.resolve(__dirname, scriptRelPath);
  console.log(`\n${"═".repeat(64)}`);
  console.log(`▶  ${scriptRelPath} ${args.join(" ")}`);
  console.log(`${"═".repeat(64)}`);

  const result = spawnSync(NODE, [scriptPath, ...args], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(`[ERROR] Failed to start ${scriptRelPath}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[ERROR] ${scriptRelPath} exited with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║  Cortéa Culture Protocol Full Translation Run              ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log(`  Languages: ${LANG_SEQUENCE.join(" → ")}`);
console.log(`  Started  : ${new Date().toISOString()}`);

// ── Phase 1: Translations ──────────────────────────────────────────────────
for (const lang of LANG_SEQUENCE) {
  run("translate-culture-protocols.mjs", ["--lang", lang, "--batch-size", BATCH_SIZE]);
}

// ── Phase 2: Generate protocols for new countries ──────────────────────────
run("generate-compass-protocols.mjs", ["--batch-size", "148", "--max-per-region", "8"]);

// ── Phase 2b: Backfill any i18n gaps left by generation parse failures ─────
// Newly generated rows may have missing language keys if the model returned
// incomplete JSON. This pass fills those gaps using the same safe COALESCE merge.
for (const lang of LANG_SEQUENCE) {
  run("translate-culture-protocols.mjs", ["--lang", lang, "--batch-size", BATCH_SIZE]);
}

// ── Phase 3: Compass overview content (core_value, biggest_taboo, etc.) ───────
// Translates compass_regions.content from en-GB into all 9 languages.
// Only untranslated regions are processed; already-translated ones are skipped.
for (const lang of LANG_SEQUENCE) {
  run("translate-compass-content.mjs", ["--lang", lang, "--batch-size", "200"]);
}

// ── Phase 4: Ensure scenario zh translations are complete (--force to catch
//    rows where content_i18n has the key but title_i18n does not, or vice versa)
run("scenario-translate.mjs", ["--lang", "zh", "--force"]);

console.log(`\n✅  All phases complete: ${new Date().toISOString()}`);
