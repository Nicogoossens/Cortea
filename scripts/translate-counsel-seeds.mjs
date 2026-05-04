#!/usr/bin/env node
/**
 * Counsel Region Seeds Translation Worker
 *
 * Translates the text fields of active counsel_region_seeds rows into a single
 * target language and writes the result to the content_i18n jsonb column.
 *
 * Fields translated per seed:
 *   summary          string
 *   principles       string[]
 *   do_examples      string[]
 *   avoid_examples   string[]
 *   register_notes   string? (optional)
 *
 * Usage:
 *   node scripts/translate-counsel-seeds.mjs --lang <code> [flags]
 *
 * Flags:
 *   --lang <code>     REQUIRED. Target language (nl, fr, de, es, pt, it, ar, ja, zh).
 *   --batch-size <n>  Number of seeds to process (default: 50).
 *   --dry-run         Print translations; do not write to database.
 *   --verbose         Show full translated content.
 *   --force           Re-translate seeds that already have a translation for this lang.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import {
  checkDailyBudget,
  recordWorkerRun,
  closeWorkerCostPool,
} from "./lib/worker-cost.mjs";

const SWEEPER_NAME = "counsel-seed-translation";
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

function getFlag(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}

const FLAG_LANG       = getFlag("--lang");
const FLAG_BATCH_SIZE = getFlag("--batch-size") ? parseInt(getFlag("--batch-size"), 10) : 50;
const FLAG_DRY_RUN    = args.includes("--dry-run");
const FLAG_VERBOSE    = args.includes("--verbose");
const FLAG_FORCE      = args.includes("--force");

const ALL_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];

if (!FLAG_LANG) {
  console.error("ERROR: --lang <code> is required. Supported: " + ALL_LANGS.join(", "));
  process.exit(1);
}
if (!ALL_LANGS.includes(FLAG_LANG)) {
  console.error(`ERROR: Unsupported language '${FLAG_LANG}'. Supported: ${ALL_LANGS.join(", ")}`);
  process.exit(1);
}

// ── Translation system prompts ─────────────────────────────────────────────────
// Seeds are professional cultural reference material — always formal register.
const JSON_SAFETY_NOTE = `
CRITICAL JSON RULES: All string values must be valid JSON strings.
- Escape any double-quote character (") inside strings as \\"
- Do NOT use typographic/curly quotes inside string values
- Return ONLY the raw JSON object. No markdown fences, no preamble.`;

const SYSTEM_PROMPTS = {
  nl: `U bent een professionele vertaler voor Cortéa, een Belgische etiquette-academie van de elite.
Vertaal Engelstalige culturele gedragsgidsen naar formeel, verfijnd Nederlands.
Altijd 'u'/'uw'. Bewaar de etiquettenuances exact. Eigennamen en regiocodes onveranderd.${JSON_SAFETY_NOTE}`,

  fr: `Vous êtes traducteur professionnel pour Cortéa, académie d'étiquette belge de prestige.
Traduisez les guides de comportement culturel anglais vers le français formel et élégant.
Toujours 'vous'/'votre'. Vocabulaire Académie française. Préservez toutes les nuances d'étiquette. Noms propres inchangés.${JSON_SAFETY_NOTE}`,

  de: `Sie sind professioneller Übersetzer für Cortéa, eine belgische Elite-Etikette-Akademie.
Übersetzen Sie englische Kulturverhaltensleitfäden ins formale Hochdeutsch.
Immer 'Sie'/'Ihnen'/'Ihr'. Konjunktiv II. Etikette-Nuancen exakt bewahren. Eigennamen unverändert.${JSON_SAFETY_NOTE}`,

  es: `Usted es traductor profesional para Cortéa, academia de etiqueta belga de élite.
Traduzca guías de comportamiento cultural del inglés al español formal y refinado.
Siempre 'usted'. Vocabulario latinizante. Preserve todas las matices de etiqueta. Nombres propios sin cambios.${JSON_SAFETY_NOTE}`,

  pt: `É tradutor profissional para a Cortéa, academia de etiqueta belga de prestígio.
Traduza guias de comportamento cultural do inglês para o português europeu formal e refinado.
Sempre 'o senhor'/'a senhora'. Infinitivo pessoal. Preserve todas as nuances de etiqueta. Nomes próprios inalterados.${JSON_SAFETY_NOTE}`,

  it: `Lei è traduttore professionale per Cortéa, accademia di galateo belga d'élite.
Traduca guide di comportamento culturale dall'inglese all'italiano formale letterario.
Sempre 'Lei'/'Suo'/'Sua'. Congiuntivo. Vocabolario Accademia della Crusca. Preservi tutte le sfumature. Nomi propri invariati.${JSON_SAFETY_NOTE}`,

  ar: `أنتَ مترجم محترف لـ Cortéa، أكاديمية آداب السلوك البلجيكية الرفيعة.
ترجم أدلة السلوك الثقافي من الإنجليزية إلى العربية الفصحى الرسمية الرفيعة.
استخدم الضمائر الرسمية دائماً. احتفظ بدقة آداب السلوك. لا تترجم الأسماء العلَم وأكواد المناطق.${JSON_SAFETY_NOTE}`,

  ja: `あなたはベルギーの名門エチケットアカデミー Cortéa の専任プロ翻訳者です。
英語の文化行動ガイドを最上級の敬語を駆使した格調高い日本語に翻訳してください。
礼儀作法のニュアンスを正確に保持してください。固有名詞と地域コードはそのままにしてください。${JSON_SAFETY_NOTE}`,

  zh: `您是比利时精英礼仪学院 Cortéa 的专业翻译。
请将英语文化行为指南翻译成正式、典雅的现代书面汉语（普通话，简体字）。
始终使用"您/您的"等尊称。精确保留礼仪细节。专有名词和地区代码保留原文。${JSON_SAFETY_NOTE}`,
};

const LANG_NAMES = {
  nl: "Dutch", fr: "French", de: "German", es: "Spanish",
  pt: "Portuguese", it: "Italian", ar: "Arabic", ja: "Japanese", zh: "Chinese",
};

function buildUserPrompt(lang, seed) {
  const content = seed.content;
  return `Translate the following cultural etiquette knowledge into ${LANG_NAMES[lang]} for the region: ${seed.region_code} / domain: ${seed.domain}.

All text fields must be translated. Keep the same JSON structure exactly.

Input JSON:
${JSON.stringify({
  summary:        content.summary,
  principles:     content.principles,
  do_examples:    content.do_examples,
  avoid_examples: content.avoid_examples,
  ...(content.register_notes != null ? { register_notes: content.register_notes } : {}),
}, null, 2)}

Output JSON schema (return ONLY this, no other text):
{
  "summary": "<translated summary>",
  "principles": ["<translated>", ...],
  "do_examples": ["<translated>", ...],
  "avoid_examples": ["<translated>", ...],
  "register_notes": "<translated or omit if not present>"
}`;
}

// ── Anthropic fetch ────────────────────────────────────────────────────────────
async function callAnthropic(systemPrompt, userPrompt) {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) throw new Error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set.");

  const response = await fetch(`${base}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
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

// ── Parse translation response ─────────────────────────────────────────────────
function parseTranslation(raw, originalContent) {
  let text = raw;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  // Replace typographic quotes to aid JSON parsing
  text = text.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.summary !== "string") return null;
    if (!Array.isArray(parsed.principles)) return null;
    if (!Array.isArray(parsed.do_examples)) return null;
    if (!Array.isArray(parsed.avoid_examples)) return null;

    const result = {
      summary:        parsed.summary,
      principles:     parsed.principles.map(String),
      do_examples:    parsed.do_examples.map(String),
      avoid_examples: parsed.avoid_examples.map(String),
    };
    // Carry over register_notes if present (translated or original)
    if (typeof parsed.register_notes === "string" && parsed.register_notes.trim()) {
      result.register_notes = parsed.register_notes;
    } else if (originalContent.register_notes) {
      result.register_notes = originalContent.register_notes;
    }
    return result;
  } catch (e) {
    process.stderr.write(`JSON parse error: ${e.message}\nRaw (first 600): ${text.substring(0, 600)}\n`);
    return null;
  }
}

// ── DB pool ────────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const runStartedAt = new Date();
  const lang = FLAG_LANG;

  console.log("Cortéa — Counsel Seeds Translation Worker");
  console.log(`Lang:    ${lang.toUpperCase()} (${LANG_NAMES[lang]})`);
  console.log(`Mode:    ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE"}`);
  console.log(`Batch:   ${FLAG_BATCH_SIZE}`);
  if (FLAG_FORCE) console.log("Force:   re-translating already-translated seeds");
  console.log("─".repeat(60));

  // Budget check
  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(`[counsel-seeds-translate] Daily AI budget reached: spent $${budget.spent.toFixed(4)} of $${budget.budget}. Skipping.`);
    await recordWorkerRun({
      sweeper:         SWEEPER_NAME,
      startedAt:       runStartedAt,
      itemsProcessed:  0,
      inputTokens:     0,
      outputTokens:    0,
      status:          "budget_capped",
      model:           MODEL,
      metadata:        { lang, spent: budget.spent, budget: budget.budget },
    });
    await closeWorkerCostPool();
    await pool.end();
    return;
  }

  // Fetch active seeds that need this language
  const filterSql = FLAG_FORCE
    ? `WHERE status = 'active'`
    : `WHERE status = 'active' AND (content_i18n IS NULL OR content_i18n->>'${lang}' IS NULL)`;

  const client = await pool.connect();
  let rows;
  try {
    ({ rows } = await client.query(
      `SELECT id, region_code, domain, content, content_i18n
       FROM counsel_region_seeds
       ${filterSql}
       ORDER BY id
       LIMIT $1`,
      [FLAG_BATCH_SIZE]
    ));
  } finally {
    client.release();
  }

  console.log(`Seeds to translate: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log(`All active seeds already translated into ${lang.toUpperCase()}.`);
    await recordWorkerRun({
      sweeper:         SWEEPER_NAME,
      startedAt:       runStartedAt,
      itemsProcessed:  0,
      inputTokens:     0,
      outputTokens:    0,
      status:          "completed",
      model:           MODEL,
      metadata:        { lang, message: "nothing_to_translate" },
    });
    await closeWorkerCostPool();
    await pool.end();
    return;
  }

  const systemPrompt = SYSTEM_PROMPTS[lang];
  let translated = 0;
  let failed = 0;

  for (const row of rows) {
    const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
    process.stdout.write(`  [${row.region_code}/${row.domain}] → ${lang} … `);

    let raw;
    try {
      raw = await callAnthropic(systemPrompt, buildUserPrompt(lang, { ...row, content }));
    } catch (err) {
      console.log(`API ERROR — ${err.message}`);
      failed++;
      continue;
    }

    const result = parseTranslation(raw, content);
    if (!result) {
      console.log("PARSE FAIL — skipping");
      if (FLAG_VERBOSE) console.log("Raw:", raw.substring(0, 400));
      failed++;
      continue;
    }

    console.log(`OK → "${result.summary.substring(0, 60)}${result.summary.length > 60 ? "…" : ""}"`);
    if (FLAG_VERBOSE) {
      console.log(`    Principles[0]: ${result.principles[0] ?? "(none)"}`);
    }

    if (!FLAG_DRY_RUN) {
      const existingI18n = typeof row.content_i18n === "string"
        ? JSON.parse(row.content_i18n)
        : (row.content_i18n ?? {});

      const updatedI18n = { ...existingI18n, [lang]: result };

      const wc = await pool.connect();
      try {
        await wc.query(
          `UPDATE counsel_region_seeds SET content_i18n = $1 WHERE id = $2`,
          [JSON.stringify(updatedI18n), row.id]
        );
      } finally {
        wc.release();
      }
    }

    translated++;
    // Brief pause to avoid rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Translated: ${translated}  Failed: ${failed}`);
  if (FLAG_DRY_RUN) console.log("DRY RUN — no writes performed.");

  const INPUT_COST_PER_1M  = 0.80;
  const OUTPUT_COST_PER_1M = 4.00;
  const estimatedUsd =
    (totalInputTokens / 1_000_000) * INPUT_COST_PER_1M +
    (totalOutputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

  console.log(`Tokens: ${totalInputTokens} in / ${totalOutputTokens} out — ~$${estimatedUsd.toFixed(4)}`);

  if (!FLAG_DRY_RUN) {
    await recordWorkerRun({
      sweeper:         SWEEPER_NAME,
      startedAt:       runStartedAt,
      itemsProcessed:  translated,
      inputTokens:     totalInputTokens,
      outputTokens:    totalOutputTokens,
      status:          failed > 0 ? "partial" : "completed",
      model:           MODEL,
      metadata:        { lang, translated, failed, batch_size: FLAG_BATCH_SIZE },
    });
  }

  await closeWorkerCostPool();
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
