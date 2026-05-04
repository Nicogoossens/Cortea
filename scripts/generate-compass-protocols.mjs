#!/usr/bin/env node
/**
 * Cortéa Compass Protocol Generator
 *
 * For each compass_regions country that has no culture_protocols rows, generates
 * culturally-accurate etiquette protocols via Claude Haiku and inserts them
 * directly into the culture_protocols table — including rule_cc_i18n translations
 * for all 9 target languages in one combined generation+translation call.
 *
 * Usage:
 *   node scripts/generate-compass-protocols.mjs [flags]
 *
 * Flags:
 *   --region <code>        Process only this region (e.g. GL, FO, AD). Skips if already has protocols.
 *   --batch-size <n>       Max countries to process per run (default: 20).
 *   --max-per-region <n>   Protocols to generate per country (default: 5, one per pillar).
 *   --published-only       Only process regions where is_published = true (default: true).
 *   --include-unpublished  Also process unpublished regions.
 *   --dry-run              Print planned output; do not write to database.
 *   --force                Re-generate for regions that already have protocols.
 *   --only-missing-pillars Target only regions that have some protocols but are missing at least one
 *                          pillar; generate only the absent pillars. Safe for re-runs: ON CONFLICT
 *                          DO NOTHING skips rows that already exist.
 *   --verbose              Print generated content.
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

const SWEEPER_NAME = "compass-protocol-generation";
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
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const FLAG_REGION            = flag("--region")?.toUpperCase() ?? null;
const FLAG_BATCH_SIZE        = flag("--batch-size")    ? parseInt(flag("--batch-size"), 10)    : 20;
const FLAG_MAX_REGION        = flag("--max-per-region") ? parseInt(flag("--max-per-region"), 10) : 5;
const FLAG_DRY_RUN           = args.includes("--dry-run");
const FLAG_FORCE             = args.includes("--force");
const FLAG_ONLY_MISSING      = args.includes("--only-missing-pillars");
const FLAG_VERBOSE           = args.includes("--verbose");
const FLAG_INCLUDE_UNPUB     = args.includes("--include-unpublished");

// ── Pillar definitions ─────────────────────────────────────────────────────────
const PILLARS = [
  { id: 1, theme: "Communication — greetings, forms of address, conversation norms, phone and digital etiquette" },
  { id: 2, theme: "Hospitality & Dining — table manners, hosting, gifting, alcohol, restaurant conduct" },
  { id: 3, theme: "Dress & Grooming — appropriate attire, formal wear, public appearance standards" },
  { id: 4, theme: "Status & Hierarchy — rank, deference, business etiquette, social positioning" },
  { id: 5, theme: "Public Conduct — public spaces, religious/ceremonial occasions, civic behaviour" },
];

// ── DB pool ───────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Anthropic fetch ───────────────────────────────────────────────────────────
async function callAnthropic(systemPrompt, userPrompt, retries = 6) {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) throw new Error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set.");

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

// ── Fetch regions to process ──────────────────────────────────────────────────
async function fetchRegions() {
  const params = [];
  const conditions = [];

  if (!FLAG_INCLUDE_UNPUB) {
    conditions.push("cr.is_published = true");
  }

  if (FLAG_REGION) {
    params.push(FLAG_REGION);
    conditions.push(`cr.region_code = $${params.length}`);
  }

  if (!FLAG_FORCE) {
    conditions.push("NOT EXISTS (SELECT 1 FROM culture_protocols cp WHERE cp.region_code = cr.region_code)");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(FLAG_BATCH_SIZE);
  const { rows } = await pool.query(
    `SELECT cr.region_code, cr.flag_emoji, cr.content, cr.is_published
     FROM compass_regions cr
     ${where}
     ORDER BY cr.is_published DESC, cr.region_code
     LIMIT $${params.length}`,
    params,
  );
  return rows;
}

// ── Fetch regions with missing pillars (--only-missing-pillars mode) ───────────
async function fetchRegionsWithMissingPillars() {
  const allPillarIds = PILLARS.map((p) => p.id);
  const params = [];
  const conditions = [];

  if (!FLAG_INCLUDE_UNPUB) {
    conditions.push("cr.is_published = true");
  }

  if (FLAG_REGION) {
    params.push(FLAG_REGION);
    conditions.push(`cr.region_code = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(FLAG_BATCH_SIZE);
  const { rows } = await pool.query(
    `SELECT
       cr.region_code,
       cr.flag_emoji,
       cr.content,
       cr.is_published,
       ARRAY_AGG(DISTINCT cp.pillar) FILTER (WHERE cp.pillar IS NOT NULL) AS present_pillars
     FROM compass_regions cr
     LEFT JOIN culture_protocols cp ON cp.region_code = cr.region_code
     ${where}
     GROUP BY cr.region_code, cr.flag_emoji, cr.content, cr.is_published
     HAVING
       -- Has at least one protocol (gap-fill targets partial, not empty regions)
       COUNT(cp.id) > 0
       -- But is missing at least one of the required pillars
       AND NOT (ARRAY[${allPillarIds.join(",")}]::int[] <@ COALESCE(ARRAY_AGG(DISTINCT cp.pillar) FILTER (WHERE cp.pillar IS NOT NULL), ARRAY[]::int[]))
     ORDER BY cr.is_published DESC, cr.region_code
     LIMIT $${params.length}`,
    params,
  );
  return rows.map((r) => ({
    ...r,
    missing_pillars: allPillarIds.filter((id) => !(r.present_pillars ?? []).includes(id)),
  }));
}

// ── Extract English context from compass_regions.content ───────────────────────
function extractContext(content) {
  if (!content || typeof content !== "object") return null;
  // Prefer en-GB, then any en*, then first available
  const langKey =
    content["en-GB"] ? "en-GB" :
    Object.keys(content).find((k) => k.toLowerCase().startsWith("en")) ??
    Object.keys(content)[0];
  return langKey ? content[langKey] : null;
}

// ── System prompt ──────────────────────────────────────────────────────────────
// pillarsToGenerate: array of pillar objects to include (defaults to all PILLARS)
function buildSystemPrompt(regionCode, ctx, pillarsToGenerate = null) {
  const activePillars = pillarsToGenerate ?? PILLARS.slice(0, FLAG_MAX_REGION);
  const regionName = ctx?.region_name ?? regionCode;
  const ctxBlock = ctx ? `
REGION PROFILE — ${regionCode} (${regionName}):
- Core value: ${ctx.core_value ?? "(not specified)"}
- Biggest taboo: ${ctx.biggest_taboo ?? "(not specified)"}
- Dress code: ${ctx.dress_code ?? "(not specified)"}
- Dining etiquette: ${ctx.dining_etiquette ?? "(not specified)"}
- Gift protocol: ${ctx.gift_protocol ?? "(not specified)"}
- Language notes: ${ctx.language_notes ?? "(not specified)"}
- DOs: ${(ctx.dos ?? []).slice(0, 5).join(" | ")}
- DON'Ts: ${(ctx.donts ?? []).slice(0, 5).join(" | ")}`.trim() : `REGION: ${regionCode}`;

  return `You are a senior etiquette researcher for Cortéa, an elite Belgian etiquette academy.
You are generating culturally-accurate etiquette protocols for the Cultural Compass — a reference guide for sophisticated international travellers and professionals.

${ctxBlock}

TASK: Generate exactly ${activePillars.length} etiquette protocol(s) for ${regionCode} — one per pillar listed below — and translate each into 9 languages.

PILLAR ASSIGNMENTS (one protocol per pillar):
${activePillars.map((p) => `- Pillar ${p.id}: ${p.theme}`).join("\n")}

Each protocol must be:
- Specific to ${regionCode} culture — never generic or copy-pasted from another country.
- Actionable: one clear rule a sophisticated visitor should know and follow.
- Written in English first (rule_description: factual, rule_cc: Cortéa-voice, slightly formal, 1-2 sentences).
- Translated into all 9 target languages with appropriate register for an elite etiquette academy.

TRANSLATION REGISTERS:
- nl: Formeel Nederlands, u/uw, Latijns vocabulaire
- fr: Français formel, vous/votre, registre Académie française
- de: Formelles Hochdeutsch, Sie/Ihnen, Duden-Standard
- es: Español formal castellano, usted, Real Academia Española
- pt: Português europeu formal, o senhor/a senhora
- it: Italiano formale letterario, Lei/Suo, congiuntivo
- ar: العربية الفصحى المعاصرة، أسلوب رسمي راقٍ
- ja: 格調高い正式な日本語、丁寧語・尊敬語
- zh: 正式典雅的现代汉语（简体），书面语体，「」用于引号而非"…"

CRITICAL JSON RULES:
- Return ONLY the raw JSON object — no markdown fences, no preamble, no trailing text.
- All string values must be valid JSON: escape internal double-quotes as \\".
- Use single quotes for apostrophes; never typographic/curly quotes inside JSON strings.
- Chinese (zh): use 「」for quotation marks, NOT " or " inside JSON string values.

OUTPUT SCHEMA:
{
  "protocols": [
    {
      "pillar": <1-5>,
      "rule_type": "<short label, 3-6 words>",
      "rule_description": "<factual English, 1-2 sentences>",
      "rule_cc": "<Cortéa-voice English, 1-2 sentences, slightly formal>",
      "urgency": <1-3>,
      "context": "<social|professional|dining|dress|public>",
      "gender_applicability": "all",
      "social_class": "<universal|elite|middle_class>",
      "i18n": {
        "nl": "<translated rule_cc>",
        "fr": "<translated rule_cc>",
        "de": "<translated rule_cc>",
        "es": "<translated rule_cc>",
        "pt": "<translated rule_cc>",
        "it": "<translated rule_cc>",
        "ar": "<translated rule_cc>",
        "ja": "<translated rule_cc>",
        "zh": "<translated rule_cc>"
      }
    }
  ]
}`;
}

function buildUserPrompt(regionCode, ctx, pillarsToGenerate = null) {
  const activePillars = pillarsToGenerate ?? PILLARS.slice(0, FLAG_MAX_REGION);
  const regionName = ctx?.region_name ?? regionCode;
  const pillarList = activePillars.map((p) => `Pillar ${p.id}`).join(", ");
  return `Generate ${activePillars.length} culturally-specific etiquette protocol(s) for ${regionCode} (${regionName}) covering ${pillarList}, with all 9 language translations included.`;
}

// ── Parse generated protocols ─────────────────────────────────────────────────
function parseProtocols(raw) {
  let text = raw;
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) text = m[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  // Normalize curly quotes before repair
  text = text.replace(/[\u201C\u201D]/g, "'");

  try { text = jsonrepair(text); } catch { /* let JSON.parse report */ }
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.protocols)) throw new Error("response missing protocols[] array");

  return parsed.protocols.filter((p) => {
    if (typeof p.rule_type !== "string" || !p.rule_type.trim()) return false;
    if (typeof p.rule_description !== "string" || !p.rule_description.trim()) return false;
    if (typeof p.rule_cc !== "string" || !p.rule_cc.trim()) return false;
    if (typeof p.pillar !== "number" || p.pillar < 1 || p.pillar > 5) return false;
    return true;
  });
}

// ── Required i18n language keys ───────────────────────────────────────────────
const REQUIRED_I18N_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];

// ── Insert protocols ───────────────────────────────────────────────────────────
async function insertProtocols(regionCode, protocols) {
  let inserted = 0;
  for (const p of protocols) {
    const i18n = (p.i18n && typeof p.i18n === "object") ? p.i18n : {};
    // Also store rule_cc itself in the i18n map under 'en' for consistency
    if (!i18n.en) i18n.en = p.rule_cc;

    // Warn if any required i18n keys are missing — generated rows will be
    // backfilled by Phase 2b translation pass in run-all-culture-translations.mjs
    const missingLangs = REQUIRED_I18N_LANGS.filter((l) => !i18n[l] || !i18n[l].trim());
    if (missingLangs.length > 0) {
      console.warn(`  [i18n warn] ${regionCode} protocol pillar=${p.pillar}: missing langs [${missingLangs.join(",")}] — will be backfilled`);
    }

    const { rows } = await pool.query(
      `INSERT INTO culture_protocols
         (region_code, pillar, rule_type, rule_description, rule_cc,
          gender_applicability, context, urgency, social_class,
          rule_cc_i18n, personas, modules, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13)
       ON CONFLICT ON CONSTRAINT culture_protocols_region_pillar_rule_key DO NOTHING
       RETURNING id`,
      [
        regionCode,
        p.pillar ?? 1,
        (p.rule_type ?? "").substring(0, 120),
        p.rule_description ?? "",
        p.rule_cc ?? "",
        p.gender_applicability ?? "all",
        p.context ?? "social",
        p.urgency ?? 2,
        p.social_class ?? "universal",
        JSON.stringify(i18n),
        JSON.stringify([]),
        JSON.stringify([]),
        false,
      ]
    );
    if (rows.length > 0) inserted++;
  }
  return inserted;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const runStartedAt = new Date();
  console.log("Cortéa Compass Protocol Generator");
  console.log(`Mode:            ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — protocols will be inserted"}`);
  console.log(`Batch size:      ${FLAG_BATCH_SIZE} countries`);
  console.log(`Per region:      ${FLAG_MAX_REGION} protocols`);
  if (FLAG_REGION)       console.log(`Region filter:   ${FLAG_REGION}`);
  if (FLAG_FORCE)        console.log("Force:           re-generating for regions that already have protocols");
  if (FLAG_ONLY_MISSING) console.log("Mode:            only-missing-pillars (gap-fill — skips complete regions)");
  console.log("─".repeat(60));

  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(
      `[compass-gen] Daily AI budget reached: $${budget.spent.toFixed(4)} of $${budget.budget}. Aborting.`
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

  const regions = FLAG_ONLY_MISSING
    ? await fetchRegionsWithMissingPillars()
    : await fetchRegions();

  console.log(`Found ${regions.length} region(s) to process.\n`);

  let totalInserted = 0;
  let totalFailed = 0;

  for (const [i, region] of regions.entries()) {
    const { region_code, content } = region;
    const ctx = extractContext(content);
    const regionName = ctx?.region_name ?? region_code;

    // In --only-missing-pillars mode, only generate for the absent pillars.
    const pillarsToGenerate = FLAG_ONLY_MISSING && region.missing_pillars?.length > 0
      ? PILLARS.filter((p) => region.missing_pillars.includes(p.id))
      : null; // null = all pillars (standard mode)

    const pillarLabel = pillarsToGenerate
      ? `missing pillars [${pillarsToGenerate.map((p) => p.id).join(",")}]`
      : `${FLAG_MAX_REGION} protocols`;

    process.stdout.write(
      `[${i + 1}/${regions.length}] ${region.flag_emoji ?? ""} ${region_code} (${regionName}) — ${pillarLabel} … `
    );

    const sysPrompt = buildSystemPrompt(region_code, ctx, pillarsToGenerate);
    const usrPrompt = buildUserPrompt(region_code, ctx, pillarsToGenerate);

    let raw;
    try {
      raw = await callAnthropic(sysPrompt, usrPrompt);
    } catch (err) {
      console.log(`API ERROR — ${err.message}`);
      totalFailed++;
      continue;
    }

    let protocols;
    try {
      protocols = parseProtocols(raw);
    } catch (err) {
      console.log(`PARSE FAIL — ${err.message}`);
      if (FLAG_VERBOSE) console.log("Raw (first 800):", raw.substring(0, 800));
      totalFailed++;
      continue;
    }

    if (protocols.length === 0) {
      console.log("NO VALID PROTOCOLS — skipping");
      totalFailed++;
      continue;
    }

    console.log(`${protocols.length} protocols`);

    if (FLAG_VERBOSE) {
      protocols.forEach((p) => {
        console.log(`  P${p.pillar}: ${p.rule_type} — ${p.rule_cc.substring(0, 80)}`);
      });
    }

    if (!FLAG_DRY_RUN) {
      try {
        const inserted = await insertProtocols(region_code, protocols);
        totalInserted += inserted;
      } catch (err) {
        console.log(`  DB ERROR — ${err.message}`);
        totalFailed++;
      }
    } else {
      totalInserted += protocols.length;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Regions processed: ${regions.length}   Protocols inserted: ${totalInserted}   Failed: ${totalFailed}`);
  if (FLAG_DRY_RUN) console.log("DRY RUN — no database writes performed.");

  await recordWorkerRun({
    sweeper: SWEEPER_NAME,
    startedAt: runStartedAt,
    itemsProcessed: totalInserted,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    model: MODEL,
    status: totalFailed > 0 ? "partial" : "ok",
    metadata: {
      regions: regions.length,
      protocolsInserted: totalInserted,
      failed: totalFailed,
      maxPerRegion: FLAG_MAX_REGION,
      dryRun: FLAG_DRY_RUN,
      onlyMissingPillars: FLAG_ONLY_MISSING,
    },
  });
  await closeWorkerCostPool();
  await pool.end();
}

main().catch(async (err) => {
  console.error("Fatal error:", err.stack ?? err.message);
  try { await pool.end(); } catch {}
  try { await closeWorkerCostPool(); } catch {}
  process.exit(1);
});
