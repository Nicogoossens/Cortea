#!/usr/bin/env node
/**
 * Cortéa Culture Protocol Translation Worker
 *
 * Translates culture_protocols.rule_cc (or rule_description as fallback)
 * into target languages and stores the results in rule_cc_i18n (jsonb).
 *
 * One Claude Haiku call per protocol row returns ALL missing languages in a
 * single JSON response, then persists using a safe COALESCE merge so
 * concurrent updates are never lost.
 *
 * Usage:
 *   node scripts/translate-culture-protocols.mjs [flags]
 *
 * Flags:
 *   --lang <code>     Translate into this language only (nl, fr, de, es, pt, it, ar, ja, zh).
 *                     Omit to translate into ALL supported languages.
 *   --region <code>   Only process this region_code (e.g. GL, FO, AD).
 *   --dry-run         Print planned translations; do not write to database.
 *   --force           Re-translate rows that already have a translation for the target language.
 *   --batch-size <n>  How many rows to process per run (default: 500).
 *   --verbose         Print the translated text for each row.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { jsonrepair } from "jsonrepair";
import {
  checkDailyBudget,
  recordWorkerRun,
  closeWorkerCostPool,
} from "./lib/worker-cost.mjs";

const SWEEPER_NAME = "culture-protocol-translation";
const MODEL = "claude-haiku-4-5";

let totalInputTokens = 0;
let totalOutputTokens = 0;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const pg = require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool } = pg;

// ── CLI flags ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAG_LANG       = args.includes("--lang")       ? args[args.indexOf("--lang") + 1]                     : null;
const FLAG_REGION     = args.includes("--region")     ? args[args.indexOf("--region") + 1]                   : null;
const FLAG_ID         = args.includes("--id")         ? parseInt(args[args.indexOf("--id") + 1], 10)         : null;
const FLAG_DRY_RUN    = args.includes("--dry-run");
const FLAG_FORCE      = args.includes("--force");
const FLAG_VERBOSE    = args.includes("--verbose");
const FLAG_BATCH_SIZE = args.includes("--batch-size") ? parseInt(args[args.indexOf("--batch-size") + 1], 10) : 500;

// ── Supported target languages ─────────────────────────────────────────────────
const ALL_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];
const TARGET_LANGS = FLAG_LANG ? [FLAG_LANG] : ALL_LANGS;

// ── System prompt (multi-language combined call) ───────────────────────────────
const SYSTEM_PROMPT = `You are a professional translator for Cortéa, a Belgian elite etiquette academy.
You translate English cultural etiquette rules into multiple formal European and world languages simultaneously.

Translation style per language:
- nl: Formal Dutch (u/uw, Latin vocabulary, no anglicisms)
- fr: Formal French (vous/votre, Académie française standard, no anglicisms)
- de: Formal German High German (Sie/Ihnen, Duden standard, no anglicisms)
- es: Formal Castilian Spanish (usted, subjunctive, Real Academia Española)
- pt: Formal European Portuguese (o senhor/a senhora, classical vocabulary, no Brazilian neologisms)
- it: Formal literary Italian (Lei/Suo, subjunctive, no anglicisms)
- ar: Modern Standard Arabic (formal register, official pronouns, no colloquialisms)
- ja: Formal Japanese (keigo — polite/honorific/humble forms as appropriate)
- zh: Formal Simplified Chinese Mandarin (您/您的 honorifics, literary register, no colloquialisms)

CRITICAL JSON RULES:
- Return ONLY the raw JSON object — no markdown fences, no preamble, no trailing text.
- All string values must be valid JSON strings: escape every internal double-quote as \\".
- Use single quotes (') for apostrophes/contractions; never typographic or curly quotes.
- Do not use Chinese 「」 brackets inside JSON strings.`;

// ── User prompt: one combined call for all missing languages ───────────────────
function buildUserPrompt(row, langsNeeded) {
  const source = row.rule_cc || row.rule_description;
  const langList = langsNeeded.map((l) => `"${l}": "<${l} translation>"`).join(",\n  ");
  return `Translate this cultural etiquette rule into ALL of the following languages: ${langsNeeded.join(", ")}.

Source (English):
rule_type: ${JSON.stringify(row.rule_type ?? "")}
rule_text: ${JSON.stringify(source)}

Return ONLY this JSON object with one key per requested language:
{
  ${langList}
}

Each value must be the translated rule_text only (not rule_type). Keep translations concise and faithful to the Cortéa formal register.`;
}

// ── DB pool ───────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Anthropic fetch (with exponential backoff for rate limits) ─────────────────
async function callAnthropic(systemPrompt, userPrompt, retries = 6) {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) {
    throw new Error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set.");
  }

  let attempt = 0;
  while (attempt <= retries) {
    const response = await fetch(`${base}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (response.status === 429) {
      attempt++;
      if (attempt > retries) {
        const text = await response.text();
        throw new Error(`Anthropic API error 429 (after ${retries} retries): ${text}`);
      }
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 60000);
      process.stdout.write(`[rate-limit: waiting ${delay / 1000}s] `);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    totalInputTokens  += Number(data.usage?.input_tokens  ?? 0) || 0;
    totalOutputTokens += Number(data.usage?.output_tokens ?? 0) || 0;
    return data.content?.[0]?.text?.trim() ?? "";
  }
  throw new Error("callAnthropic: exhausted retries");
}

// ── Parse multi-language translation response ──────────────────────────────────
function parseTranslations(raw, langsNeeded) {
  let text = raw;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  text = text.replace(/[\u201C\u201D]/g, "'");

  try { text = jsonrepair(text); } catch { /* ignore */ }
  try {
    const parsed = JSON.parse(text);
    const result = {};
    for (const lang of langsNeeded) {
      if (typeof parsed[lang] === "string" && parsed[lang].trim()) {
        result[lang] = parsed[lang];
      }
    }
    if (Object.keys(result).length === 0) return null;
    return result;
  } catch (e) {
    process.stderr.write(`JSON parse error: ${e.message}\nText (first 800): ${text.substring(0, 800)}\n`);
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const runStartedAt = new Date();
  console.log("Cortéa Culture Protocol Translation Worker");
  console.log(`Mode:       ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — translations will be saved"}`);
  console.log(`Languages:  ${TARGET_LANGS.join(", ")}`);
  if (FLAG_REGION) console.log(`Region:     ${FLAG_REGION}`);
  if (FLAG_FORCE)  console.log("Force:      re-translating already-translated rows");
  console.log(`Batch size: ${FLAG_BATCH_SIZE}`);
  console.log("─".repeat(60));

  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(
      `[culture-protocol-translate] Daily AI budget reached: spent $${budget.spent.toFixed(4)} of $${budget.budget}. Skipping run.`,
    );
    await recordWorkerRun({
      sweeper: SWEEPER_NAME,
      startedAt: runStartedAt,
      itemsProcessed: 0,
      inputTokens: 0,
      outputTokens: 0,
      status: "budget_capped",
      model: MODEL,
      metadata: { spent: budget.spent, budget: budget.budget },
    });
    await closeWorkerCostPool();
    await pool.end();
    return;
  }

  // Build WHERE clause — only load rows with actual source text
  const conditions = ["(rule_cc IS NOT NULL OR rule_description IS NOT NULL)"];
  const params = [];

  if (FLAG_ID) {
    params.push(FLAG_ID);
    conditions.push(`id = $${params.length}`);
  }

  if (FLAG_REGION) {
    params.push(FLAG_REGION);
    conditions.push(`region_code = $${params.length}`);
  }

  // When targeting a single language and not forcing, filter in SQL for efficiency
  if (FLAG_LANG && !FLAG_FORCE) {
    conditions.push(
      `(rule_cc_i18n IS NULL OR NOT (rule_cc_i18n ? '${FLAG_LANG.replace(/'/g, "''")}'))`
    );
  }

  params.push(FLAG_BATCH_SIZE);
  const limitClause = `LIMIT $${params.length}`;

  const query =
    `SELECT id, region_code, rule_type, rule_description, rule_cc, rule_cc_i18n ` +
    `FROM culture_protocols ` +
    `WHERE ${conditions.join(" AND ")} ` +
    `ORDER BY id ` +
    limitClause;

  const client = await pool.connect();
  let rows;
  try {
    ({ rows } = await client.query(query, params));
  } finally {
    client.release();
  }

  console.log(`Loaded ${rows.length} protocol(s) needing translation. Target languages: ${TARGET_LANGS.join(", ")}\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const currentI18n = (row.rule_cc_i18n ?? {});

    // Determine which languages are actually needed for this row
    const langsNeeded = TARGET_LANGS.filter((lang) => {
      if (FLAG_FORCE) return true;
      return !currentI18n[lang];
    });

    if (langsNeeded.length === 0) {
      if (FLAG_VERBOSE) {
        console.log(`  [SKIP] Protocol ${row.id} (${row.region_code}) — all target languages already present`);
      }
      skipped++;
      continue;
    }

    const sourceText = row.rule_cc || row.rule_description;
    if (!sourceText) {
      if (FLAG_VERBOSE) console.log(`  [SKIP] Protocol ${row.id} — no source text`);
      skipped++;
      continue;
    }

    process.stdout.write(
      `  [${row.region_code}] #${row.id} (${(row.rule_type ?? "").substring(0, 38)}) → [${langsNeeded.join(",")}] … `
    );

    let raw;
    try {
      raw = await callAnthropic(SYSTEM_PROMPT, buildUserPrompt(row, langsNeeded));
    } catch (err) {
      console.log(`API ERROR — ${err.message}`);
      failed++;
      continue;
    }

    const translations = parseTranslations(raw, langsNeeded);
    if (!translations) {
      console.log("PARSE FAIL — skipping");
      if (FLAG_VERBOSE) console.log("Raw:", raw.substring(0, 500));
      failed++;
      continue;
    }

    const gotLangs = Object.keys(translations);
    console.log(`OK (${gotLangs.join(",")})`);
    if (FLAG_VERBOSE) {
      for (const [lang, text] of Object.entries(translations)) {
        console.log(`    ${lang}: ${text.substring(0, 100)}`);
      }
    }

    if (!FLAG_DRY_RUN) {
      const updateClient = await pool.connect();
      try {
        // Safe merge: COALESCE ensures we start from existing i18n even if NULL,
        // then || merges the new translations without overwriting other keys.
        await updateClient.query(
          `UPDATE culture_protocols
           SET rule_cc_i18n = COALESCE(rule_cc_i18n, '{}'::jsonb) || $1::jsonb
           WHERE id = $2`,
          [JSON.stringify(translations), row.id]
        );
      } finally {
        updateClient.release();
      }
    }

    translated++;
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Translated: ${translated}  Skipped: ${skipped}  Failed: ${failed}`);
  if (FLAG_DRY_RUN) console.log("DRY RUN — no database writes performed.");

  await recordWorkerRun({
    sweeper: SWEEPER_NAME,
    startedAt: runStartedAt,
    itemsProcessed: translated,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    model: MODEL,
    status: failed > 0 ? "partial" : "ok",
    metadata: {
      targetLangs: TARGET_LANGS,
      region: FLAG_REGION ?? "all",
      skipped,
      failed,
      dryRun: FLAG_DRY_RUN,
    },
  });
  await closeWorkerCostPool();
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
