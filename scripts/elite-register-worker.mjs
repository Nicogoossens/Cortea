#!/usr/bin/env node
/**
 * SOWISO Elite Register Translation Worker
 *
 * Audits every translation in the database and rewrites strings that fall
 * below the elite register standard for their locale and formality_register.
 * Both the full locale code (e.g. en-GB vs en-US, nl-NL vs nl-BE) and the
 * formality_register column drive the system prompt used for evaluation.
 *
 * Usage (see TRANSLATION_WORKER.md for full docs):
 *   node scripts/elite-register-worker.mjs [options]
 *
 * Options:
 *   --locale <code>   Only process this language_code (e.g. nl, fr, de)
 *   --dry-run         Print planned rewrites without touching the database
 *   --verbose         Show every string evaluated, even those that pass
 *   --force           Re-evaluate strings already stamped with quality_reviewed_at
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// pg resolved from lib/db — the stable workspace package that depends on it
const _require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { Pool } = _require("pg");

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flagArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const FLAG_LOCALE  = flagArg("--locale");
const FLAG_DRY_RUN = args.includes("--dry-run");
const FLAG_VERBOSE = args.includes("--verbose");
const FLAG_FORCE   = args.includes("--force");

// ── Keys that must never be rewritten ────────────────────────────────────────
const SKIP_KEYS = new Set(["app.name", "app.established", "atelier.duration"]);

// ── Anthropic via env vars (set by Replit AI integration) ────────────────────
const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

if (!ANTHROPIC_BASE || !ANTHROPIC_KEY) {
  console.error(
    "Missing AI_INTEGRATIONS_ANTHROPIC_BASE_URL or AI_INTEGRATIONS_ANTHROPIC_API_KEY.\n" +
    "These are set automatically by the Replit AI integration."
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Per-locale, per-register elite system prompts ─────────────────────────────
// Resolution order for a given row:
//   1. "<locale_code>:<formality_register>"   e.g. "nl-NL:high"
//   2. "<locale_code>"                         e.g. "nl-NL"
//   3. "<base_lang>:<formality_register>"      e.g. "nl:high"
//   4. "<base_lang>"                           e.g. "nl"
//   5. "en" (fallback)
//
// Note: the translations table stores language_code as the base code (nl, fr, …),
// not the full locale. The full locale keys below serve as future-proofing when
// region-specific language codes are introduced into the translations table.

const PROMPTS = {
  // ── British English ───────────────────────────────────────────────────────
  "en-GB": `You evaluate text for British aristocratic English register.
Standards: subjunctive mood ('if one were to…'), understatement, Latinate vocabulary,
no contractions in formal sentences, passive voice where it lends dignity.
Avoid: Americanisms, exclamation marks in neutral instructions, colloquialisms, slang.
Tone: Victorian gentry correspondence — measured, precise, courteous.`,

  "en-GB:medium": `You evaluate text for formal British professional English.
'You' is acceptable; no contractions; formal Latinate vocabulary preferred.
Avoid colloquialisms and Americanisms. Polite imperative is fine.`,

  // ── American English ──────────────────────────────────────────────────────
  "en-US": `You evaluate text for formal American English register.
Standards: clear, confident, professional. No contractions in formal contexts.
Prefer direct Latinate vocabulary over Germanic colloquialisms.
Avoid: slang, casual filler words, exclamation marks in neutral instructions.
Tone: formal American legal/diplomatic prose — authoritative yet accessible.`,

  "en-US:medium": `You evaluate text for professional American English.
Clear, correct, no contractions; plain professional language; avoid slang.`,

  // ── Australian English ────────────────────────────────────────────────────
  "en-AU": `You evaluate text for formal Australian English register.
Standards: formal British-influenced English; avoid colloquialisms ('mate', 'arvo', etc.);
prefer Latinate vocabulary; no contractions in formal text.
Tone: formal Australian government/legal register.`,

  // ── Canadian English ──────────────────────────────────────────────────────
  "en-CA": `You evaluate text for formal Canadian English register.
Standards: formal British-influenced English with neutral North American vocabulary.
No contractions in formal text; formal Latinate vocabulary; avoid slang.`,

  // ── Catch-all English fallback ────────────────────────────────────────────
  "en": `You evaluate text for elite English register (en-GB standard as default).
Prefer subjunctive mood, Latinate vocabulary, no contractions in formal text,
British aristocratic understatement. Avoid Americanisms, slang, exclamation marks.`,

  "en:medium": `You evaluate text for formal professional English.
'You' is acceptable; no contractions; correct grammar; formal vocabulary.`,

  "en:low": `You evaluate text for general polite English. Clear, correct, respectful.
Avoid slang and typos. Friendly tone is acceptable.`,

  // ── Netherlands Dutch ─────────────────────────────────────────────────────
  "nl-NL": `You evaluate text for Dutch aristocratic register (Netherlands, nl-NL).
Standards: always 'u'/'uw'; Latinate and French-derived vocabulary; aanvoegende wijs
(subjunctive) where classical Dutch demands it; no diminutives, no anglicisms.
Avoid: informal pronouns, exclamation marks in instructions, modern internet vocabulary.
Tone: Netherlands gentry correspondence — dignified, periodic, never rushed.`,

  "nl-NL:medium": `You evaluate text for formal Dutch (Netherlands professional register).
'u'/'uw' mandatory; correct Dutchgrammar; Latinate vocabulary preferred; no anglicisms.`,

  // ── Belgian Dutch / Flemish ───────────────────────────────────────────────
  "nl-BE": `You evaluate text for Flemish formal register (Belgian Dutch, nl-BE).
Standards: 'u'/'uw' mandatory; Flemish literary vocabulary (avoid Netherlands-specific idioms);
no French borrowings or anglicisms; formal and dignified.
Tone: Flemish cultural register — refined, classical, measured.`,

  // ── Base Dutch fallback ───────────────────────────────────────────────────
  "nl": `You evaluate text for elite Dutch register (nl-NL standard as default).
Always 'u'/'uw'; Latinate vocabulary; no anglicisms, diminutives, or casual phrasing.
Tone: Netherlands aristocratic correspondence.`,

  "nl:medium": `You evaluate text for formal Dutch professional register.
'u'/'uw' mandatory; correct grammar; no anglicisms or casual phrasing.`,

  "nl:low": `You evaluate text for general polite Dutch. Clear, correct, respectful.
'u' preferred. Avoid slang and anglicisms with Dutch equivalents.`,

  // ── French ───────────────────────────────────────────────────────────────
  "fr-FR": `You evaluate text for elite French register (fr-FR, Académie française standard).
Standards: always 'vous'/'votre/vos'; subjunctive freely and correctly; elevated vocabulary
('demeurer' over 'rester', 'acquérir' over 'obtenir'); no anglicisms, no verlan,
no elliptical sentences, no familiar constructions.
Tone: 18th-century Parisian salon — precise, graceful, authoritative.`,

  "fr-FR:medium": `You evaluate text for formal French professional register.
'vous' mandatory; subjunctive where appropriate; formal Académie vocabulary.
No anglicisms; polite imperative constructions.`,

  "fr": `You evaluate text for elite French register (fr-FR standard as default).
Always 'vous'; subjunctive; Académie française vocabulary; no anglicisms.`,

  "fr:medium": `You evaluate text for formal French professional register.
'vous' mandatory; correct grammar; formal vocabulary; no anglicisms.`,

  // ── German ────────────────────────────────────────────────────────────────
  "de-DE": `You evaluate text for elite German register (de-DE, Duden Hochdeutsch standard).
Standards: always 'Sie'/'Ihnen'/'Ihr'; Konjunktiv II for requests and hypotheticals;
classical Latinate compound nouns; impeccable Duden grammar; no elision; no anglicisms.
Tone: Prussian administrative precision combined with Goethe-era literary dignity.`,

  "de-DE:medium": `You evaluate text for formal German professional register.
'Sie'/'Ihnen' mandatory; Konjunktiv II for requests; correct grammar; no anglicisms.`,

  "de": `You evaluate text for elite German register (de-DE Hochdeutsch standard).
Always 'Sie'; Konjunktiv II; Latinate vocabulary; no anglicisms. Tone: Prussian precision.`,

  "de:medium": `You evaluate text for formal German professional register.
'Sie' mandatory; correct Hochdeutsch grammar; formal vocabulary; no anglicisms.`,

  // ── Spanish ───────────────────────────────────────────────────────────────
  "es-ES": `You evaluate text for elite Castilian Spanish register (es-ES, RAE standard).
Standards: always 'usted'/'ustedes' with third-person verbal agreement; subjunctive
freely (present, imperfect, future); Latinate vocabulary ('solicitar' not 'pedir');
no Latin American colloquialisms, no anglicisms.
Tone: Spanish Royal Court and Golden Age literature.`,

  "es-ES:medium": `You evaluate text for formal Spanish professional register (Castilian).
'usted' preferred; subjunctive where appropriate; RAE vocabulary; no anglicisms.`,

  "es-MX": `You evaluate text for formal Mexican Spanish register (es-MX).
Standards: 'usted' mandatory in formal contexts; subjunctive correctly used;
neutral Latin American vocabulary; avoid Spain-specific idioms and anglicisms.
Tone: formal Mexican official register — dignified and precise.`,

  "es": `You evaluate text for elite Spanish register (es-ES Castilian as default).
Always 'usted'; subjunctive; RAE vocabulary; no anglicisms. Tone: Spanish Royal Court.`,

  "es:medium": `You evaluate text for formal Spanish professional register.
'usted' preferred; correct grammar; formal vocabulary; no anglicisms.`,

  // ── Portuguese ────────────────────────────────────────────────────────────
  "pt-PT": `You evaluate text for elite European Portuguese register (pt-PT).
Standards: 'o senhor'/'a senhora' or 'Vossa Excelência'; personal infinitive and
future subjunctive used correctly; classical Portuguese vocabulary; no Brazilian
neologisms or anglicisms.
Tone: Portuguese royal court and Eça de Queirós prose elegance.`,

  "pt-PT:medium": `You evaluate text for formal European Portuguese professional register.
'você' or 'o senhor' acceptable; personal infinitive; European PT vocabulary.`,

  "pt-BR": `You evaluate text for formal Brazilian Portuguese register (pt-BR).
Standards: 'você' in formal contexts (preferred in BR); subjunctive correctly used;
neutral Brazilian vocabulary; avoid Portugal-specific archaisms and anglicisms.
Tone: formal Brazilian official prose — clear, correct, dignified.`,

  "pt": `You evaluate text for elite European Portuguese register (pt-PT as default).
'o senhor'/'a senhora'; personal infinitive; classical PT vocabulary; no anglicisms.`,

  "pt:medium": `You evaluate text for formal Portuguese professional register.
'você' or 'o senhor' acceptable; correct grammar; formal vocabulary; no anglicisms.`,

  // ── Italian ───────────────────────────────────────────────────────────────
  "it-IT": `You evaluate text for elite Italian register (it-IT, Accademia della Crusca standard).
Standards: always 'Lei'/'Suo'/'Sua'; congiuntivo used correctly; Latinate and Tuscan
literary vocabulary; no anglicisms, no abbreviations, no exclamation marks in instructions.
Tone: Leopardi and Manzoni — periodic, elegant, Tuscan.`,

  "it-IT:medium": `You evaluate text for formal Italian professional register.
'Lei' form mandatory; congiuntivo where appropriate; formal vocabulary; no anglicisms.`,

  "it": `You evaluate text for elite Italian register (it-IT Accademia standard).
Always 'Lei'/'Suo'; congiuntivo; Tuscan literary vocabulary; no anglicisms.`,

  "it:medium": `You evaluate text for formal Italian professional register.
'Lei' mandatory; correct grammar; formal vocabulary; no anglicisms.`,

  // ── Hindi ─────────────────────────────────────────────────────────────────
  "hi-IN": `You evaluate text for elite Hindi register (hi-IN, standard literary Khari Boli).
Standards: always 'आप' (aap); Sanskrit-derived (tatsama) vocabulary exclusively;
respectful imperative ('कृपया ... करें'); classical Khari Boli sentence structure.
Avoid: 'तुम'/'तू', Urdu borrowings, English loanwords, film-Hindi slang.`,

  "hi-IN:medium": `You evaluate text for formal Hindi professional register.
'आप' mandatory; tatsama vocabulary preferred; correct formal Hindi grammar.`,

  "hi": `You evaluate text for elite Hindi register (hi-IN standard as default).
Always 'आप'; tatsama vocabulary; respectful imperative. Avoid anglicisms and slang.`,

  "hi:medium": `You evaluate text for formal Hindi professional register.
'आप' mandatory; correct formal grammar; prefer Sanskrit-derived vocabulary.`,
};

function getSystemPrompt(languageCode, formalityRegister, regionLink) {
  // Attempt most-specific to least-specific key resolution
  const locale = regionLink ?? languageCode;
  const keys = [
    `${locale}:${formalityRegister}`,
    `${locale}`,
    `${languageCode}:${formalityRegister}`,
    `${languageCode}`,
    "en",
  ];
  for (const key of keys) {
    if (PROMPTS[key]) return PROMPTS[key];
  }
  return PROMPTS["en"];
}

// ── Evaluate + optionally rewrite a single string ────────────────────────────
async function evaluateString(value, languageCode, formalityRegister, regionLink) {
  const systemPrompt = getSystemPrompt(languageCode, formalityRegister, regionLink);

  const userMessage =
    `Evaluate the following UI string for register compliance.\n\n` +
    `String: "${value}"\n\n` +
    `Respond ONLY with a JSON object (no markdown, no explanation outside the JSON):\n` +
    `{\n` +
    `  "pass": true|false,\n` +
    `  "score": <integer 1-10>,\n` +
    `  "rewritten": "<improved string when pass is false; repeat original when pass is true>"\n` +
    `}\n\n` +
    `pass: true if the string already meets the register standard.\n` +
    `score: 1 (very informal) to 10 (perfect register).\n` +
    `rewritten: improved version at the same purpose and approximate length when pass is false.`;

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
    const errBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  let text = data.content?.[0]?.text?.trim() ?? "";
  // Strip markdown code fences that the model occasionally inserts
  text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Return null to signal a parse failure — caller will skip stamping
    return null;
  }
  return parsed;
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

  const conditions = ["1=1"];
  const params = [];

  if (FLAG_LOCALE) {
    params.push(FLAG_LOCALE);
    conditions.push(`language_code = $${params.length}`);
  }
  if (!FLAG_FORCE) {
    conditions.push("quality_reviewed_at IS NULL");
  }

  // Select formality_register and region_link so the prompt resolver can be precise
  const query =
    `SELECT id, language_code, formality_register, region_link, key, value ` +
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
  let parseErrors = 0;
  let apiErrors = 0;

  for (const row of rows) {
    const label = `[${row.language_code}/${row.formality_register}] ${row.key}`;

    if (SKIP_KEYS.has(row.key)) {
      skipped++;
      if (FLAG_VERBOSE) console.log(`  SKIP  ${label}`);
      continue;
    }

    let result;
    try {
      result = await evaluateString(
        row.value,
        row.language_code,
        row.formality_register,
        row.region_link
      );
    } catch (err) {
      apiErrors++;
      console.error(`  API ERROR  ${label}: ${err.message}`);
      // Do not stamp quality_reviewed_at on API errors
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    if (result === null) {
      // JSON parse failure — skip silently (do not stamp as reviewed)
      parseErrors++;
      console.warn(`  PARSE SKIP ${label}: model did not return parseable JSON`);
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    if (result.pass) {
      passed++;
      if (FLAG_VERBOSE) {
        console.log(`  PASS  ${label} (score: ${result.score})`);
      }
    } else {
      rewritten++;
      console.log(`  REWRITE ${label}`);
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

    // Polite rate-limiting — one call per 200ms
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n" + "─".repeat(60));
  console.log("Summary:");
  console.log(`  Skipped (protected keys):  ${skipped}`);
  console.log(`  Passed unchanged:          ${passed}`);
  console.log(`  Rewritten:                 ${rewritten}`);
  console.log(`  Parse errors (skipped):    ${parseErrors}`);
  console.log(`  API errors (skipped):      ${apiErrors}`);
  if (FLAG_DRY_RUN) {
    console.log("\n  DRY RUN — no changes were written to the database.");
  } else {
    console.log(`\n  ${rewritten} string(s) updated; ${parseErrors + apiErrors} skipped without stamp.`);
  }

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
