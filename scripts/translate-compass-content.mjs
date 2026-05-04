#!/usr/bin/env node
/**
 * Cortéa Compass Content Translation Worker
 *
 * Translates compass_regions.content (core_value, biggest_taboo, dining_etiquette,
 * dress_code, gift_protocol, language_notes, dos, donts) from en-GB into
 * all 9 supported languages and stores results as additional locale keys
 * in the content JSONB column.
 *
 * Usage:
 *   node scripts/translate-compass-content.mjs [flags]
 *
 * Flags:
 *   --lang <code>     Only this language (nl, fr, de, es, pt, it, ar, ja, zh)
 *   --region <code>   Only this region_code (e.g. GB, AF, CN)
 *   --batch-size <n>  Regions per run (default: 20)
 *   --dry-run         Preview without writing to database
 *   --force           Re-translate already-translated entries
 *   --verbose         Print translated text
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

const SWEEPER_NAME = "compass-content-translation";
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
const FLAG_DRY_RUN    = args.includes("--dry-run");
const FLAG_FORCE      = args.includes("--force");
const FLAG_VERBOSE    = args.includes("--verbose");
const FLAG_BATCH_SIZE = args.includes("--batch-size") ? parseInt(args[args.indexOf("--batch-size") + 1], 10) : 20;

// ── Supported target languages ─────────────────────────────────────────────────
const ALL_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];
// --lang accepts a single code or a comma-separated list (e.g. --lang de,es,pt)
const TARGET_LANGS = FLAG_LANG ? FLAG_LANG.split(",").map(l => l.trim()).filter(Boolean) : ALL_LANGS;

// ── Emoji flag helper ──────────────────────────────────────────────────────────
function flagEmoji(code) {
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E0 - 65 + c.charCodeAt(0))).join("");
}

// ── System prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional cultural content translator for Cortéa, a Belgian elite etiquette academy.
You translate structured JSON describing cultural etiquette into multiple formal languages simultaneously.

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
- Use single quotes (') for apostrophes; never typographic or curly quotes inside JSON strings.
- Preserve the exact array length for dos and donts — same number of items as source.
- Do not add or remove fields from the object structure.`;

// ── Build prompt for one region ─────────────────────────────────────────────
function buildUserPrompt(regionCode, enContent, langsNeeded) {
  const source = {
    core_value:       enContent.core_value       ?? "",
    biggest_taboo:    enContent.biggest_taboo    ?? "",
    dining_etiquette: enContent.dining_etiquette ?? "",
    dress_code:       enContent.dress_code       ?? "",
    gift_protocol:    enContent.gift_protocol    ?? "",
    language_notes:   enContent.language_notes   ?? "",
    dos:              enContent.dos              ?? [],
    donts:            enContent.donts            ?? [],
  };

  const langPlaceholders = langsNeeded
    .map(l => `  "${l}": { "core_value": "...", "biggest_taboo": "...", "dining_etiquette": "...", "dress_code": "...", "gift_protocol": "...", "language_notes": "...", "dos": [...], "donts": [...] }`)
    .join(",\n");

  return `Translate this cultural etiquette content for region ${regionCode} into ALL of these languages: ${langsNeeded.join(", ")}.

Source (en-GB):
${JSON.stringify(source, null, 2)}

Return ONLY this JSON object with one key per requested language:
{
${langPlaceholders}
}

Each language value must contain all 8 fields: core_value, biggest_taboo, dining_etiquette, dress_code, gift_protocol, language_notes, dos (array with ${source.dos.length} items), donts (array with ${source.donts.length} items).`;
}

// ── DB pool ───────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Anthropic fetch (exponential backoff for rate limits) ──────────────────────
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
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (response.status === 429) {
      attempt++;
      if (attempt > retries) {
        const text = await response.text();
        throw new Error(`Anthropic 429 (after ${retries} retries): ${text}`);
      }
      const delay = Math.min(3000 * Math.pow(2, attempt - 1), 90000);
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

// ── Parse response: { lang: { core_value, ..., dos, donts } } ──────────────────
function parseTranslations(raw, langsNeeded) {
  let text = raw;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  text = text.replace(/[\u201C\u201D\u2018\u2019]/g, "'");

  try { text = jsonrepair(text); } catch { /* ignore */ }

  try {
    const parsed = JSON.parse(text);
    const result = {};
    for (const lang of langsNeeded) {
      const entry = parsed[lang];
      if (entry && typeof entry === "object" && typeof entry.core_value === "string") {
        result[lang] = {
          core_value:       entry.core_value       ?? "",
          biggest_taboo:    entry.biggest_taboo    ?? "",
          dining_etiquette: entry.dining_etiquette ?? "",
          dress_code:       entry.dress_code       ?? "",
          gift_protocol:    entry.gift_protocol    ?? "",
          language_notes:   entry.language_notes   ?? "",
          dos:              Array.isArray(entry.dos)   ? entry.dos   : [],
          donts:            Array.isArray(entry.donts) ? entry.donts : [],
        };
      }
    }
    if (Object.keys(result).length === 0) return null;
    return result;
  } catch (e) {
    process.stderr.write(`JSON parse error: ${e.message}\nRaw (first 600): ${text.substring(0, 600)}\n`);
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const runStartedAt = new Date();
  console.log("Cortéa Compass Content Translation Worker");
  console.log(`Mode:       ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — translations will be saved"}`);
  console.log(`Languages:  ${TARGET_LANGS.join(", ")}`);
  if (FLAG_REGION) console.log(`Region:     ${FLAG_REGION}`);
  if (FLAG_FORCE)  console.log("Force:      re-translating already-translated rows");
  console.log(`Batch size: ${FLAG_BATCH_SIZE}`);
  console.log("─".repeat(60));

  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(
      `[compass-content-translate] Daily AI budget reached: spent $${budget.spent.toFixed(4)} of $${budget.budget}. Skipping.`
    );
    await recordWorkerRun({
      sweeper: SWEEPER_NAME, startedAt: runStartedAt,
      itemsProcessed: 0, inputTokens: 0, outputTokens: 0,
      status: "budget_capped", model: MODEL,
      metadata: { spent: budget.spent, budget: budget.budget },
    });
    await closeWorkerCostPool();
    await pool.end();
    return;
  }

  // Build WHERE clause — regions with en-GB content
  const conditions = ["is_published = true", "content ? 'en-GB'"];
  const params = [];

  if (FLAG_REGION) {
    params.push(FLAG_REGION.toUpperCase());
    conditions.push(`region_code = $${params.length}`);
  }

  // When targeting specific languages and not forcing, only fetch rows missing at least one
  if (TARGET_LANGS.length < ALL_LANGS.length && !FLAG_FORCE) {
    const missingAny = TARGET_LANGS
      .map(l => `NOT (content ? '${l.replace(/'/g, "''")}')`)
      .join(" OR ");
    conditions.push(`(${missingAny})`);
  }

  params.push(FLAG_BATCH_SIZE);
  const query =
    `SELECT region_code, flag_emoji, content->'en-GB' AS en_content, content AS full_content ` +
    `FROM compass_regions ` +
    `WHERE ${conditions.join(" AND ")} ` +
    `ORDER BY region_code ` +
    `LIMIT $${params.length}`;

  const client = await pool.connect();
  let rows;
  try {
    ({ rows } = await client.query(query, params));
  } finally {
    client.release();
  }

  console.log(`Loaded ${rows.length} region(s) to process. Target languages: ${TARGET_LANGS.join(", ")}`);
  if (rows.length === 0) {
    console.log("Nothing to translate — all done!");
  }
  console.log();

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const currentContent = row.full_content ?? {};
    const enContent = row.en_content ?? {};

    // Determine which languages are actually missing for this row
    const langsNeeded = TARGET_LANGS.filter((lang) => {
      if (FLAG_FORCE) return true;
      return !currentContent[lang] || typeof currentContent[lang] !== "object";
    });

    if (langsNeeded.length === 0) {
      if (FLAG_VERBOSE) {
        console.log(`  [SKIP] ${flagEmoji(row.region_code)} ${row.region_code} — all target languages present`);
      }
      skipped++;
      continue;
    }

    process.stdout.write(`  ${flagEmoji(row.region_code)} ${row.region_code} → [${langsNeeded.join(",")}] … `);

    let raw;
    try {
      raw = await callAnthropic(SYSTEM_PROMPT, buildUserPrompt(row.region_code, enContent, langsNeeded));
    } catch (err) {
      console.log(`API ERR: ${err.message.substring(0, 120)}`);
      failed++;
      continue;
    }

    const translations = parseTranslations(raw, langsNeeded);
    if (!translations) {
      console.log("PARSE FAIL — skipping");
      if (FLAG_VERBOSE) console.log("  Raw:", raw.substring(0, 400));
      failed++;
      continue;
    }

    const gotLangs = Object.keys(translations);
    console.log(`OK (${gotLangs.join(",")})`);

    if (FLAG_VERBOSE) {
      for (const [lang, entry] of Object.entries(translations)) {
        console.log(`    ${lang} core_value: ${entry.core_value?.substring(0, 80)}`);
      }
    }

    if (!FLAG_DRY_RUN) {
      const updateClient = await pool.connect();
      try {
        // Build a JSONB patch with only the newly translated language keys
        const patch = {};
        for (const [lang, entry] of Object.entries(translations)) {
          patch[lang] = entry;
        }
        await updateClient.query(
          `UPDATE compass_regions
           SET content = COALESCE(content, '{}'::jsonb) || $1::jsonb
           WHERE region_code = $2`,
          [JSON.stringify(patch), row.region_code]
        );
      } finally {
        updateClient.release();
      }
    }

    translated++;
    // Pause between calls to respect rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Regions processed: ${translated}   Skipped: ${skipped}   Failed: ${failed}`);
  if (FLAG_DRY_RUN) console.log("DRY RUN — no database writes performed.");

  const estimatedUsd =
    (totalInputTokens / 1_000_000) * 1 + (totalOutputTokens / 1_000_000) * 5;

  console.log(
    `__AI_COST__ ${JSON.stringify({
      sweeper: SWEEPER_NAME,
      elapsedMs: Date.now() - runStartedAt.getTime(),
      itemsProcessed: translated,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      estimatedUsd,
      model: MODEL,
      status: failed > 0 ? "partial" : "ok",
    })}`
  );

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
