#!/usr/bin/env node
/**
 * SOWISO Scenario Translation Worker
 *
 * Translates scenario titles and content (situation, question, option text +
 * explanation) into target languages using Claude, then stores the results in
 * the title_i18n (jsonb) and content_i18n (jsonb) columns of the scenarios table.
 *
 * Usage:
 *   node scripts/scenario-translate.mjs [flags]
 *
 * Flags:
 *   --lang <code>   Base language code to translate into (nl, fr, de, es, pt, it, hi).
 *                   Omit to translate into ALL supported languages.
 *   --id <n>        Translate only the scenario with this ID.
 *   --dry-run       Print planned translations; do not write to database.
 *   --verbose       Show full translated content, not just titles.
 *   --force         Re-translate scenarios that already have a translation for
 *                   the target language.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { jsonrepair } from "jsonrepair";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Resolve pg from the @workspace/db package
const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const dbPkg = require(dbPkgPath);
const pg = require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool } = pg;

// ── CLI flags ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAG_LANG     = args.includes("--lang")    ? args[args.indexOf("--lang") + 1]    : null;
const FLAG_ID       = args.includes("--id")      ? parseInt(args[args.indexOf("--id") + 1], 10) : null;
const FLAG_DRY_RUN  = args.includes("--dry-run");
const FLAG_VERBOSE  = args.includes("--verbose");
const FLAG_FORCE    = args.includes("--force");

// ── Supported target languages ─────────────────────────────────────────────────
const ALL_LANGS = ["nl", "fr", "de", "es", "pt", "it", "hi"];

const TARGET_LANGS = FLAG_LANG ? [FLAG_LANG] : ALL_LANGS;

// ── System prompts per language ────────────────────────────────────────────────
// Each prompt instructs the model to translate etiquette scenario content into
// the target language with a register appropriate for an elite etiquette academy.
const JSON_SAFETY_NOTE = `
CRITICAL JSON RULES: All string values must be valid JSON strings.
- Any double-quote character (") that appears INSIDE a string value MUST be escaped as \\"
- Do NOT use typographic/curly quotes (" " „ ") inside string values — use escaped ASCII quotes \\" instead
- Do NOT use unescaped apostrophes that look like quotes; prefer single quotes (') for contractions
- Return ONLY the raw JSON object. No markdown fences, no preamble, no trailing text.`;

const SYSTEM_PROMPTS = {
  nl: `You are a professional translator for SOWISO, an elite etiquette academy.
Translate English etiquette scenario content into formal Dutch (Nederlands).
Register: dignified and measured — u/uw forms, Latinate vocabulary, no anglicisms.
${JSON_SAFETY_NOTE}`,

  fr: `Vous êtes traducteur professionnel pour SOWISO, académie d'étiquette de prestige.
Traduisez des scénarios d'étiquette anglais en français formel et élégant.
Registre : 18e siècle parisien — vous/votre, vocabulaire Académie française, sans anglicismes.
${JSON_SAFETY_NOTE}`,

  de: `Sie sind professioneller Übersetzer für SOWISO, eine Eliteakademie für Etikette.
Übersetzen Sie englische Etikette-Szenarien ins formelle Hochdeutsch.
Register: Preußische Verwaltungspräzision — Sie/Ihnen, Konjunktiv II für höfliche Bitten, Duden-Standard.
${JSON_SAFETY_NOTE}`,

  es: `Usted es traductor profesional para SOWISO, academia de etiqueta de élite.
Traduzca escenarios de etiqueta del inglés al español formal castellano.
Registro: Real Academia Española — usted, subjuntivo, vocabulario culto ('solicitar' no 'pedir'), sin anglicismos.
${JSON_SAFETY_NOTE}`,

  pt: `É tradutor profissional da SOWISO, academia de etiqueta de prestígio.
Traduza cenários de etiqueta do inglês para português europeu formal.
Registo: o senhor / a senhora, infinitivo pessoal, vocabulário clássico português, sem neologismos brasileiros.
${JSON_SAFETY_NOTE}`,

  it: `Lei è traduttore professionale per SOWISO, accademia di etichetta d'élite.
Traduca scenari di galateo dall'inglese all'italiano formale letterario.
Registro: Lei/Suo, congiuntivo, vocabolario toscano letterario, senza anglicismi. Tono: Leopardi e Manzoni.
${JSON_SAFETY_NOTE}`,

  hi: `आप SOWISO के लिए एक पेशेवर अनुवादक हैं, जो एक कुलीन शिष्टाचार अकादमी है।
अंग्रेज़ी शिष्टाचार परिदृश्यों का औपचारिक हिंदी में अनुवाद करें।
रजिस्टर: आप-सम्बोधन, संस्कृत-निष्ठ तत्सम शब्दावली, अंग्रेज़ी शब्दों से परहेज़।
${JSON_SAFETY_NOTE}`,
};

const USER_PROMPT = (lang, scenario) => `Translate the following English etiquette scenario into ${lang.toUpperCase()}.

Preserve all etiquette nuances and cultural context. Keep proper nouns (e.g. SOWISO) untranslated.
The "correct" boolean must remain unchanged — only translate text fields.

Input JSON:
${JSON.stringify({
  title: scenario.title,
  situation: scenario.content_json.situation,
  question: scenario.content_json.question,
  options: scenario.content_json.options.map((o, i) => ({
    index: i,
    text: o.text,
    explanation: o.explanation,
  })),
}, null, 2)}

Output JSON schema (return ONLY this, no other text):
{
  "title": "<translated title>",
  "situation": "<translated situation>",
  "question": "<translated question>",
  "options": [
    { "index": 0, "text": "<translated>", "explanation": "<translated>" },
    ...
  ]
}`;

// ── DB pool ───────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Anthropic fetch ───────────────────────────────────────────────────────────
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
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() ?? "";
}

// ── Parse translation response ────────────────────────────────────────────────
function parseTranslation(raw, scenario) {
  // Extract the first JSON object from the response (handles markdown fences robustly)
  let text = raw;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  // Repair common JSON issues (e.g. unescaped inner quotes from typographic conventions)
  try { text = jsonrepair(text); } catch { /* ignore repair errors; let JSON.parse report */ }
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.title !== "string") return null;
    if (typeof parsed.situation !== "string") return null;
    if (typeof parsed.question !== "string") return null;
    if (!Array.isArray(parsed.options)) return null;
    return {
      title: parsed.title,
      content: {
        situation: parsed.situation,
        question: parsed.question,
        options: scenario.content_json.options.map((orig, i) => {
          const translated = parsed.options.find((o) => o.index === i) ?? parsed.options[i];
          return {
            text: translated?.text ?? orig.text,
            correct: orig.correct,
            explanation: translated?.explanation ?? orig.explanation,
          };
        }),
      },
    };
  } catch (e) {
    process.stderr.write(`JSON parse error: ${e.message}\nText (first 800): ${text.substring(0, 800)}\n`);
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log("SOWISO Scenario Translation Worker");
  console.log(`Mode:    ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — translations will be saved"}`);
  if (FLAG_LANG) console.log(`Filter:  lang = ${FLAG_LANG}`);
  if (FLAG_ID)   console.log(`Filter:  scenario id = ${FLAG_ID}`);
  if (FLAG_FORCE) console.log("Force:   re-translating already-translated scenarios");
  console.log("─".repeat(60));

  const conditions = ["1=1"];
  const params = [];

  if (FLAG_ID) {
    params.push(FLAG_ID);
    conditions.push(`id = $${params.length}`);
  }

  const query =
    `SELECT id, title, content_json, title_i18n, content_i18n ` +
    `FROM scenarios ` +
    `WHERE ${conditions.join(" AND ")} ` +
    `ORDER BY id`;

  const client = await pool.connect();
  let rows;
  try {
    ({ rows } = await client.query(query, params));
  } finally {
    client.release();
  }

  console.log(`Loaded ${rows.length} scenario(s). Target languages: ${TARGET_LANGS.join(", ")}\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const titleI18n    = (row.title_i18n   ?? {});
    const contentI18n  = (row.content_i18n ?? {});

    for (const lang of TARGET_LANGS) {
      if (!FLAG_FORCE && titleI18n[lang]) {
        if (FLAG_VERBOSE) {
          console.log(`  [SKIP] Scenario ${row.id} lang=${lang} — already translated`);
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

      process.stdout.write(`  Translating scenario ${row.id} (${row.title.substring(0, 40)}…) → ${lang} … `);

      let raw;
      try {
        raw = await callAnthropic(systemPrompt, USER_PROMPT(lang, row));
      } catch (err) {
        console.log(`API ERROR — ${err.message}`);
        failed++;
        continue;
      }

      const result = parseTranslation(raw, row);
      if (!result) {
        console.log("PARSE FAIL — skipping");
        if (FLAG_VERBOSE) console.log("Raw:", raw.substring(0, 500));
        failed++;
        continue;
      }

      console.log(`OK → "${result.title}"`);
      if (FLAG_VERBOSE) {
        console.log(`    Situation: ${result.content.situation.substring(0, 100)}…`);
      }

      titleI18n[lang]   = result.title;
      contentI18n[lang] = result.content;

      if (!FLAG_DRY_RUN) {
        const updateClient = await pool.connect();
        try {
          await updateClient.query(
            `UPDATE scenarios SET title_i18n = $1, content_i18n = $2 WHERE id = $3`,
            [JSON.stringify(titleI18n), JSON.stringify(contentI18n), row.id]
          );
        } finally {
          updateClient.release();
        }
      }

      translated++;
      // Brief pause to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Translated: ${translated}  Skipped: ${skipped}  Failed: ${failed}`);
  if (FLAG_DRY_RUN) console.log("DRY RUN — no database writes performed.");

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
