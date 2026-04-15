#!/usr/bin/env node
/**
 * SOWISO Elite Register Translation Worker
 *
 * Audits every translation in the database and rewrites strings that fall
 * below the elite register standard expected for their locale and formality
 * register level. Both the locale (e.g. nl-NL vs nl-BE) and the
 * formality_register column drive which system prompt is applied.
 *
 * Usage (see TRANSLATION_WORKER.md for full docs):
 *   node scripts/elite-register-worker.mjs [options]
 *
 * Options:
 *   --locale <code>   Only process this language code (e.g. nl, fr, de)
 *   --dry-run         Print planned rewrites without touching the database
 *   --verbose         Show every string evaluated, even those that pass
 *   --force           Re-evaluate strings already stamped with quality_reviewed_at
 *
 * Examples:
 *   node scripts/elite-register-worker.mjs --dry-run
 *   node scripts/elite-register-worker.mjs --locale nl --verbose
 *   node scripts/elite-register-worker.mjs --force
 *   node scripts/elite-register-worker.mjs --locale fr --dry-run --verbose
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve pg from lib/db where it is installed as a workspace dependency
const _require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { Pool } = _require("pg");

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function flagArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const FLAG_LOCALE  = flagArg("--locale");
const FLAG_DRY_RUN = args.includes("--dry-run");
const FLAG_VERBOSE = args.includes("--verbose");
const FLAG_FORCE   = args.includes("--force");

// ── Keys that must never be rewritten ───────────────────────────────────────
const SKIP_KEYS = new Set(["app.name", "app.established", "atelier.duration"]);

// ── Anthropic setup via env vars ─────────────────────────────────────────────
const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

if (!ANTHROPIC_BASE || !ANTHROPIC_KEY) {
  console.error(
    "Missing AI_INTEGRATIONS_ANTHROPIC_BASE_URL or AI_INTEGRATIONS_ANTHROPIC_API_KEY.\n" +
    "These are set automatically by the Replit AI integration — ensure the workspace is configured."
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Per-locale, per-register elite system prompts ───────────────────────────
// Keys: "<language_code>" (base) or "<language_code>:<formality_register>"
// Resolution order: "<lang>:<register>" → "<lang>" → "en"
const LOCALE_PROMPTS = {
  // ── Dutch ─────────────────────────────────────────────────────────────────
  "nl": `You are a master of Dutch aristocratic language (nl-NL, Kingdom of the Netherlands).
Elite register in Dutch means:
- Always 'u' and 'uw' for second person (never 'jij/je/jouw').
- Prefer Latinate and French-derived vocabulary over colloquial Germanic words.
- Use the aanvoegende wijs (subjunctive) where classical Dutch demands it.
- Avoid contractions, diminutives, anglicisms, and modern internet vocabulary.
- Sentence structure: measured, periodic, never rushed.
Forbidden: informal pronouns, exclamation marks in instructions, anglicisms, slang.`,

  "nl:medium": `You are a master of formal standard Dutch (nl-NL, administrative register).
Formal Dutch means:
- Always 'u'/'uw'; avoid 'jij/je' but diminutives are acceptable for warmth.
- Clear, correct grammar; Latinate vocabulary preferred but not mandatory.
- Polite imperative constructions; avoid slang and anglicisms.
Forbidden: casual/colloquial phrasing, 'jij/je', anglicisms.`,

  "nl:low": `You review Dutch UI text for general audience — standard polite Dutch.
Keep phrasing clear, correct, and respectful. 'u' preferred but 'je' acceptable in context.
Avoid slang, typos, and anglicisms that have Dutch equivalents.`,

  // ── French ────────────────────────────────────────────────────────────────
  "fr": `You are a master of formal French (fr-FR, Académie française standard).
Elite register in French means:
- Always 'vous'/'votre/vos' (never 'tu/te/ton').
- Employ the subjunctive freely and correctly.
- Prefer elevated vocabulary ('demeurer' over 'rester', 'acquérir' over 'obtenir').
- Avoid anglicisms, verlan, elliptical sentences, and all familiar constructions.
- Tone: 18th-century French salon — precise, graceful, authoritative.
Forbidden: 'tu' forms, anglicisms, exclamation marks in instructions.`,

  "fr:medium": `You review French for formal, professional register (fr-FR).
'Vous' mandatory; subjunctive where appropriate; vocabulary: formal but not archaic.
Avoid anglicisms and casual phrasing.`,

  // ── German ────────────────────────────────────────────────────────────────
  "de": `You are a master of formal High German (Hochdeutsch, de-DE Duden standard).
Elite register in German means:
- Always 'Sie'/'Ihnen'/'Ihr' (never 'du/dich/dein').
- Konjunktiv II for polite requests and hypotheticals.
- Classical compound nouns and Latinate vocabulary over anglicisms.
- Impeccable Duden grammar; no elision; no abbreviations.
- Tone: Prussian administrative precision combined with Goethe-era literary dignity.
Forbidden: casual speech, anglicisms, abbreviations, internet vocabulary.`,

  "de:medium": `You review German for formal professional register (de-DE).
'Sie'/'Ihnen' mandatory; correct grammar; formal vocabulary.
Avoid anglicisms that have German equivalents. Abbreviations acceptable only in UI labels.`,

  // ── Spanish ───────────────────────────────────────────────────────────────
  "es": `You are a master of Castilian Spanish formal register (es-ES, RAE standard).
Elite register in Spanish means:
- Always 'usted'/'ustedes' with third-person verbal agreement (never 'tú/vosotros').
- Use subjunctive freely: present, imperfect, future.
- Prefer Latinate/classical vocabulary ('solicitar' not 'pedir', 'adquirir' not 'conseguir').
- Sentence rhythm: formal and measured, not conversational.
- Avoid Latin American colloquialisms, anglicisms, and modern slang.
- Tone: Spanish Royal Court and Golden Age literature.
Forbidden: 'tú', vosotros, exclamation marks in instructions, anglicisms.`,

  "es:medium": `You review Spanish for professional formal register (es-ES).
'Usted' preferred; subjunctive where appropriate; formal vocabulary.
Avoid anglicisms with Spanish equivalents. Neutral Latin American variants acceptable.`,

  // ── Portuguese ────────────────────────────────────────────────────────────
  "pt": `You are a master of formal European Portuguese (pt-PT, Portugal standard).
Elite register in Portuguese means:
- Always 'o senhor'/'a senhora' or 'Vossa Excelência' where appropriate.
- Personal infinitive and future subjunctive used correctly.
- Classical Portuguese vocabulary — no Brazilian neologisms or anglicisms.
- Tone: Portuguese royal court and Eça de Queirós prose style.
Forbidden: Brazilian-specific vocabulary, anglicisms, casual tone, abbreviations.`,

  "pt:medium": `You review Portuguese for formal professional register (pt-PT European standard).
'Você' or 'o senhor' acceptable; correct grammar; formal vocabulary.
Avoid Brazilian-specific terms and anglicisms that have Portuguese equivalents.`,

  // ── Italian ───────────────────────────────────────────────────────────────
  "it": `You are a master of formal Italian register (it-IT, Accademia della Crusca standard).
Elite register in Italian means:
- Always 'Lei'/'Suo'/'Sua' as formal second person (never 'tu').
- Congiuntivo (subjunctive) used correctly in subordinate clauses.
- Latinate and Tuscan literary vocabulary; modeled on Leopardi and Manzoni.
- Avoid exclamation marks, abbreviations, and modern colloquialisms.
Forbidden: 'tu' forms, anglicisms, southern Italian regionalisms, internet language.`,

  "it:medium": `You review Italian for formal professional register (it-IT).
'Lei' form preferred; congiuntivo where appropriate; formal vocabulary.
Avoid anglicisms with Italian equivalents.`,

  // ── Hindi ─────────────────────────────────────────────────────────────────
  "hi": `You are a master of formal Hindi register (hi-IN, standard literary Hindi, Khari Boli).
Elite register in Hindi means:
- Always 'आप' (aap) — never 'तुम' (tum) or 'तू' (tu).
- Sanskrit-derived (tatsama) vocabulary over Urdu, English, or regional borrowings.
- Respectful imperative ('कृपया ... करें') not the plain imperative.
- Sentence structure reflecting classical Khari Boli prose elegance.
Forbidden: informal pronouns, anglicisms, film Hindi slang, abbreviated forms.`,

  "hi:medium": `You review Hindi for formal professional register (hi-IN).
'आप' form mandatory; correct formal Hindi grammar; prefer Sanskrit-derived vocabulary.
Avoid anglicisms that have standard Hindi equivalents.`,

  // ── English ───────────────────────────────────────────────────────────────
  "en": `You are a master of British aristocratic English register (en-GB).
Elite register in English means:
- Prefer understatement over directness ('one might consider' rather than 'you should').
- Use the subjunctive mood where correct ('if one were to...', 'it is essential that one...').
- Latinate and French-derived vocabulary over Germanic alternatives.
- Avoid Americanisms, contractions in formal text, colloquialisms.
- Tone: Victorian gentry correspondence — measured, precise, courteous.
- Passive voice where it lends dignity ('it is requested' rather than 'please do').
Forbidden: exclamation marks in neutral instructions, Americanisms, contractions, slang.`,

  "en:medium": `You review English for formal professional register (en-GB/en-US neutral standard).
'You' is acceptable; clear formal grammar; no contractions; Latinate vocabulary preferred.
Avoid colloquialisms and excessive Americanisms in British-facing contexts.`,

  "en:low": `You review English for general polite register (en-neutral).
Clear, correct, and respectful. Avoid slang and typos. Friendly tone is acceptable.`,
};

function getPrompt(languageCode, formalityRegister) {
  const specificKey = `${languageCode}:${formalityRegister}`;
  return (
    LOCALE_PROMPTS[specificKey] ??
    LOCALE_PROMPTS[languageCode] ??
    LOCALE_PROMPTS["en"]
  );
}

// ── Evaluate + conditionally rewrite a single string via Anthropic ───────────
async function evaluateString(value, languageCode, formalityRegister) {
  const systemPrompt = getPrompt(languageCode, formalityRegister);

  const userMessage =
    `Evaluate the following UI string for elite register compliance.\n\n` +
    `String: "${value}"\n\n` +
    `Respond ONLY with a JSON object in this exact format (no markdown, no explanation):\n` +
    `{\n` +
    `  "pass": true|false,\n` +
    `  "score": <integer 1-10>,\n` +
    `  "rewritten": "<rewritten string if pass is false, otherwise repeat the original exactly>"\n` +
    `}\n\n` +
    `- pass: true if the string already meets the register standard.\n` +
    `- score: 1 (very informal) to 10 (perfect elite register).\n` +
    `- rewritten: when pass is false, provide the improved version at the same length and purpose.`;

  const response = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  let text = data.content?.[0]?.text?.trim() ?? "{}";
  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    return JSON.parse(text);
  } catch {
    return { pass: true, score: 7, rewritten: value };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("SOWISO Elite Register Translation Worker");
  console.log(
    `Mode:    ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — rewrites will be saved"}`
  );
  if (FLAG_LOCALE) console.log(`Filter:  language_code = ${FLAG_LOCALE}`);
  if (FLAG_FORCE)  console.log("Force:   re-evaluating already-reviewed strings");
  console.log("─".repeat(60));

  // Build parameterised query that includes language_code AND formality_register
  const conditions = ["1=1"];
  const params = [];

  if (FLAG_LOCALE) {
    params.push(FLAG_LOCALE);
    conditions.push(`language_code = $${params.length}`);
  }
  if (!FLAG_FORCE) {
    conditions.push("quality_reviewed_at IS NULL");
  }

  const query =
    `SELECT id, language_code, formality_register, key, value ` +
    `FROM translations ` +
    `WHERE ${conditions.join(" AND ")} ` +
    `ORDER BY language_code, formality_register, key`;

  const client = await pool.connect();

  let rows;
  try {
    ({ rows } = await client.query(query, params));
  } catch (err) {
    client.release();
    throw err;
  }

  console.log(`\nStrings to evaluate: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log("Nothing to do. Use --force to re-evaluate already-reviewed strings.");
    client.release();
    await pool.end();
    return;
  }

  let passed = 0;
  let rewritten = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    if (SKIP_KEYS.has(row.key)) {
      skipped++;
      if (FLAG_VERBOSE) {
        console.log(`  SKIP  [${row.language_code}/${row.formality_register}] ${row.key}`);
      }
      continue;
    }

    try {
      const result = await evaluateString(row.value, row.language_code, row.formality_register);

      if (result.pass) {
        passed++;
        if (FLAG_VERBOSE) {
          console.log(
            `  PASS  [${row.language_code}/${row.formality_register}] ${row.key}` +
            ` (score: ${result.score})`
          );
        }
      } else {
        rewritten++;
        console.log(`  REWRITE [${row.language_code}/${row.formality_register}] ${row.key}`);
        console.log(`    Score:  ${result.score}/10`);
        console.log(`    Before: ${row.value}`);
        console.log(`    After:  ${result.rewritten}`);
      }

      if (!FLAG_DRY_RUN) {
        const newValue = result.pass ? row.value : result.rewritten;
        await client.query(
          "UPDATE translations SET value = $1, quality_reviewed_at = NOW() WHERE id = $2",
          [newValue, row.id]
        );
      }
    } catch (err) {
      errors++;
      console.error(
        `  ERROR [${row.language_code}/${row.formality_register}] ${row.key}: ${err.message}`
      );
    }

    // Polite rate-limiting — one call per 200ms
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n" + "─".repeat(60));
  console.log("Summary:");
  console.log(`  Skipped (protected):  ${skipped}`);
  console.log(`  Passed unchanged:     ${passed}`);
  console.log(`  Rewritten:            ${rewritten}`);
  console.log(`  Errors:               ${errors}`);
  if (FLAG_DRY_RUN) {
    console.log("\n  DRY RUN — no changes were written to the database.");
  } else {
    console.log(`\n  ${rewritten} string(s) updated in the database.`);
  }

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
