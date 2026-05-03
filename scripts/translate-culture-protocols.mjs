#!/usr/bin/env node
/**
 * Cortéa Culture Protocol Translation Worker
 *
 * Translates culture_protocols.rule_cc (or rule_description as fallback)
 * into target languages and stores the results in rule_cc_i18n (jsonb).
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

// ── System prompts per language ────────────────────────────────────────────────
const JSON_SAFETY_NOTE = `
CRITICAL JSON RULES:
- Return ONLY the raw JSON object — no markdown fences, no preamble, no trailing text.
- All string values must be valid JSON strings: escape every internal double-quote as \\".
- Use single quotes (') for apostrophes/contractions; never typographic or curly quotes.`;

const SYSTEM_PROMPTS = {
  nl: `U bent professioneel vertaler voor Cortéa, een Belgische elite-etiquetteacademie.
Vertaal Engelse etiquetteregels naar formeel, waardig Nederlands (u/uw, Latijns vocabulaire, geen anglicismen).
${JSON_SAFETY_NOTE}`,

  fr: `Vous êtes traducteur professionnel pour Cortéa, académie belge d'étiquette de prestige.
Traduisez des règles d'étiquette anglaises en français formel et élégant (vous/votre, Académie française, sans anglicismes).
${JSON_SAFETY_NOTE}`,

  de: `Sie sind professioneller Übersetzer für Cortéa, eine belgische Eliteakademie für Etikette.
Übersetzen Sie englische Etikette-Regeln ins formelle Hochdeutsch (Sie/Ihnen, Duden-Standard, ohne Anglizismen).
${JSON_SAFETY_NOTE}`,

  es: `Usted es traductor profesional para Cortéa, academia belga de etiqueta de élite.
Traduzca reglas de etiqueta del inglés al español formal castellano (usted, subjuntivo, Real Academia Española).
${JSON_SAFETY_NOTE}`,

  pt: `É tradutor profissional da Cortéa, academia belga de etiqueta de prestígio.
Traduza regras de etiqueta do inglês para português europeu formal (o senhor/a senhora, vocabulário clássico, sem neologismos brasileiros).
${JSON_SAFETY_NOTE}`,

  it: `Lei è traduttore professionale per Cortéa, accademia belga di etichetta d'élite.
Traduca regole di galateo dall'inglese all'italiano formale letterario (Lei/Suo, congiuntivo, senza anglicismi).
${JSON_SAFETY_NOTE}`,

  ar: `أنتَ مترجم محترف لـ Cortéa، أكاديمية الآداب البلجيكية الراقية.
ترجم قواعد الآداب من الإنجليزية إلى العربية الفصحى المعاصرة (أسلوب رسمي راقٍ، الضمائر الرسمية، بعيداً عن العامية).
${JSON_SAFETY_NOTE}`,

  ja: `あなたはCortéa（ベルギーの名門エチケットアカデミー）専任のプロの翻訳者です。
英語のエチケット規則を格調高い正式な日本語に翻訳してください（丁寧語・尊敬語・謙譲語を適切に使用）。
${JSON_SAFETY_NOTE}`,

  zh: `您是Cortéa比利时精英礼仪学院的专业翻译。
请将英语礼仪规则翻译成正式、典雅的现代汉语（普通话，简体字，书面正式语体，使用您/您的等敬语，措辞庄重，避免口语化表达）。
引用词语或专有名词时，请使用「」书名号，切勿在JSON字符串内部使用双引号（"）以免破坏JSON格式。
${JSON_SAFETY_NOTE}`,
};

// ── User prompt ────────────────────────────────────────────────────────────────
function buildUserPrompt(lang, row) {
  const source = row.rule_cc || row.rule_description;
  return `Translate this cultural etiquette rule into ${lang.toUpperCase()}.

Source (English):
${JSON.stringify({ rule_type: row.rule_type, rule_text: source }, null, 2)}

Return ONLY this JSON shape:
{
  "rule_type": "<translated rule_type>",
  "rule_text": "<translated rule_text>"
}`;
}

// ── DB pool ───────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Anthropic fetch ───────────────────────────────────────────────────────────
async function callAnthropic(systemPrompt, userPrompt) {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) {
    throw new Error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set.");
  }

  const response = await fetch(`${base}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  totalInputTokens  += Number(data.usage?.input_tokens  ?? 0) || 0;
  totalOutputTokens += Number(data.usage?.output_tokens ?? 0) || 0;
  return data.content?.[0]?.text?.trim() ?? "";
}

// ── Parse translation response ────────────────────────────────────────────────
function parseTranslation(raw) {
  let text = raw;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  // Replace typographic/curly quotes with straight single quotes so jsonrepair
  // can handle unescaped inner double-quotes produced by the model (e.g. Chinese "…")
  text = text.replace(/[\u201C\u201D]/g, "'");

  try { text = jsonrepair(text); } catch { /* ignore */ }
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.rule_text !== "string") return null;
    return {
      rule_type: typeof parsed.rule_type === "string" ? parsed.rule_type : null,
      rule_text: parsed.rule_text,
    };
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

    for (const lang of TARGET_LANGS) {
      if (!FLAG_FORCE && currentI18n[lang]) {
        if (FLAG_VERBOSE) {
          console.log(`  [SKIP] Protocol ${row.id} (${row.region_code}) lang=${lang} — already translated`);
        }
        skipped++;
        continue;
      }

      const systemPrompt = SYSTEM_PROMPTS[lang];
      if (!systemPrompt) {
        console.warn(`  [WARN] No system prompt for lang=${lang} — skipping`);
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
        `  [${row.region_code}] #${row.id} (${(row.rule_type ?? "").substring(0, 38)}) → ${lang} … `
      );

      let raw;
      try {
        raw = await callAnthropic(systemPrompt, buildUserPrompt(lang, row));
      } catch (err) {
        console.log(`API ERROR — ${err.message}`);
        failed++;
        continue;
      }

      const result = parseTranslation(raw);
      if (!result) {
        console.log("PARSE FAIL — skipping");
        if (FLAG_VERBOSE) console.log("Raw:", raw.substring(0, 500));
        failed++;
        continue;
      }

      console.log(`OK`);
      if (FLAG_VERBOSE) {
        console.log(`    → ${result.rule_text.substring(0, 120)}`);
      }

      // Merge new translation into the existing i18n map
      currentI18n[lang] = result.rule_text;

      if (!FLAG_DRY_RUN) {
        const updateClient = await pool.connect();
        try {
          await updateClient.query(
            `UPDATE culture_protocols SET rule_cc_i18n = $1::jsonb WHERE id = $2`,
            [JSON.stringify(currentI18n), row.id]
          );
        } finally {
          updateClient.release();
        }
      }

      translated++;
      await new Promise((r) => setTimeout(r, 200));
    }
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
