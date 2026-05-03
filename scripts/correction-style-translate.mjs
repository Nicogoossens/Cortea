#!/usr/bin/env node
/**
 * SOWISO Correction-Style Translation Worker
 *
 * Translates the bespoke per-scenario `correction_style` tip into target
 * languages using Claude, then stores the results in the
 * `correction_style_i18n` (jsonb) column of the scenarios table.
 *
 * Usage:
 *   node scripts/correction-style-translate.mjs [flags]
 *
 * Flags:
 *   --lang <code>   Base language code to translate into
 *                   (nl, fr, de, es, pt, it, ar, ja, zh).
 *                   Omit to translate into ALL supported languages.
 *   --id <n>        Translate only the scenario with this ID.
 *   --dry-run       Print planned translations; do not write to database.
 *   --verbose       Show full translated text, not just preview.
 *   --force         Re-translate scenarios that already have a translation
 *                   for the target language.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const pg = require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool } = pg;

const args = process.argv.slice(2);
const FLAG_LANG    = args.includes("--lang")    ? args[args.indexOf("--lang") + 1]    : null;
const FLAG_ID      = args.includes("--id")      ? parseInt(args[args.indexOf("--id") + 1], 10) : null;
const FLAG_DRY_RUN = args.includes("--dry-run");
const FLAG_VERBOSE = args.includes("--verbose");
const FLAG_FORCE   = args.includes("--force");

const ALL_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];
const TARGET_LANGS = FLAG_LANG ? [FLAG_LANG] : ALL_LANGS;

// Per-language register matches the rest of the SOWISO translation pipeline
// (see scripts/scenario-translate.mjs) so the bespoke correction tip reads
// in the same dignified voice as the surrounding scenario text.
const SYSTEM_PROMPTS = {
  nl: `You are a professional translator for SOWISO, an elite etiquette academy.
Translate a short English etiquette correction tip into formal Dutch (Nederlands).
Register: dignified and measured — u/uw forms, Latinate vocabulary, no anglicisms.
Return ONLY the translated text. No quotes, no preamble, no markdown.`,

  fr: `Vous êtes traducteur professionnel pour SOWISO, académie d'étiquette de prestige.
Traduisez un court conseil d'étiquette en français formel et élégant.
Registre : 18e siècle parisien — vous/votre, vocabulaire Académie française, sans anglicismes.
Retournez UNIQUEMENT le texte traduit. Pas de guillemets, pas de préambule, pas de markdown.`,

  de: `Sie sind professioneller Übersetzer für SOWISO, eine Eliteakademie für Etikette.
Übersetzen Sie einen kurzen Etikette-Hinweis ins formelle Hochdeutsch.
Register: Preußische Verwaltungspräzision — Sie/Ihnen, Konjunktiv II, Duden-Standard.
Geben Sie NUR den übersetzten Text zurück. Keine Anführungszeichen, keine Einleitung, kein Markdown.`,

  es: `Usted es traductor profesional para SOWISO, academia de etiqueta de élite.
Traduzca un breve consejo de etiqueta del inglés al español formal castellano.
Registro: Real Academia Española — usted, subjuntivo, vocabulario culto, sin anglicismos.
Devuelva ÚNICAMENTE el texto traducido. Sin comillas, sin preámbulo, sin markdown.`,

  pt: `É tradutor profissional da SOWISO, academia de etiqueta de prestígio.
Traduza um breve conselho de etiqueta do inglês para português europeu formal.
Registo: o senhor / a senhora, infinitivo pessoal, vocabulário clássico português.
Devolva APENAS o texto traduzido. Sem aspas, sem preâmbulo, sem markdown.`,

  it: `Lei è traduttore professionale per SOWISO, accademia di etichetta d'élite.
Traduca un breve consiglio di galateo dall'inglese all'italiano formale letterario.
Registro: Lei/Suo, congiuntivo, vocabolario toscano letterario, senza anglicismi.
Restituisca SOLO il testo tradotto. Senza virgolette, senza preambolo, senza markdown.`,

  ar: `أنتَ مترجم محترف لـ SOWISO، أكاديمية آداب السلوك الرفيعة.
ترجم نصيحة آداب سلوك قصيرة من الإنجليزية إلى العربية الفصحى المعاصرة.
السجل: أسلوب رسمي راقٍ، الضمائر الرسمية، الابتعاد عن العامية.
أعد النص المترجم فقط. بدون علامات اقتباس أو مقدمة أو markdown.`,

  ja: `あなたは SOWISO（上流マナー・エチケットの名門アカデミー）専任のプロの翻訳者です。
英語の短いエチケット指導文を、格調高い正式な日本語に翻訳してください。
スタイル：丁寧語・尊敬語を適切に使用、和語と漢語を均衡よく、カタカナ語は最小限。
翻訳されたテキストのみを返してください。引用符、前置き、markdown は不要です。`,

  zh: `您是 SOWISO 精英礼仪学院的专业翻译。
请将一段简短的英语礼仪指导翻译成正式、典雅的现代汉语（普通话，简体字）。
文体：书面正式语体，使用您/您的等敬语，避免口语化表达和英语借词。
只返回翻译后的文本。不要引号、前言或 markdown。`,
};

const USER_PROMPT = (lang, text) => `Translate the following English etiquette correction tip into ${lang.toUpperCase()}.

Preserve all etiquette nuances and cultural context. Keep proper nouns (e.g. SOWISO) untranslated.
Return ONLY the translated sentence(s). No quotes, no labels, no markdown fences.

English tip:
${text}`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
  return data.content?.[0]?.text?.trim() ?? "";
}

function cleanTranslation(raw) {
  if (!raw) return null;
  let t = raw.trim();
  // Strip leading/trailing markdown fences, quotes, or labels the model
  // may add despite the system prompt forbidding them.
  t = t.replace(/^```(?:[a-z]+)?\n?/i, "").replace(/\n?```$/i, "").trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t.length > 0 ? t : null;
}

async function main() {
  console.log("SOWISO Correction-Style Translation Worker");
  console.log(`Mode:    ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — translations will be saved"}`);
  if (FLAG_LANG)  console.log(`Filter:  lang = ${FLAG_LANG}`);
  if (FLAG_ID)    console.log(`Filter:  scenario id = ${FLAG_ID}`);
  if (FLAG_FORCE) console.log("Force:   re-translating already-translated scenarios");
  console.log("─".repeat(60));

  const conditions = ["correction_style IS NOT NULL", "TRIM(correction_style) <> ''"];
  const params = [];
  if (FLAG_ID) {
    params.push(FLAG_ID);
    conditions.push(`id = $${params.length}`);
  }

  const query =
    `SELECT id, title, correction_style, correction_style_i18n ` +
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

  console.log(`Loaded ${rows.length} scenario(s) with bespoke correction_style. Target languages: ${TARGET_LANGS.join(", ")}\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const i18n = row.correction_style_i18n ?? {};

    for (const lang of TARGET_LANGS) {
      if (!FLAG_FORCE && i18n[lang]) {
        if (FLAG_VERBOSE) console.log(`  [SKIP] Scenario ${row.id} lang=${lang} — already translated`);
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
        raw = await callAnthropic(systemPrompt, USER_PROMPT(lang, row.correction_style));
      } catch (err) {
        console.log(`API ERROR — ${err.message}`);
        failed++;
        continue;
      }

      const cleaned = cleanTranslation(raw);
      if (!cleaned) {
        console.log("EMPTY — skipping");
        if (FLAG_VERBOSE) console.log("Raw:", raw.substring(0, 400));
        failed++;
        continue;
      }

      console.log(`OK (${cleaned.length} chars)`);
      if (FLAG_VERBOSE) console.log(`    ${cleaned.substring(0, 160)}${cleaned.length > 160 ? "…" : ""}`);

      i18n[lang] = cleaned;

      if (!FLAG_DRY_RUN) {
        const updateClient = await pool.connect();
        try {
          await updateClient.query(
            `UPDATE scenarios SET correction_style_i18n = $1 WHERE id = $2`,
            [JSON.stringify(i18n), row.id],
          );
        } finally {
          updateClient.release();
        }
      }

      translated++;
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
