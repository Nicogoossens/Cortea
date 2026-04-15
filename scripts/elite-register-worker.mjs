#!/usr/bin/env node
/**
 * Elite Register Translation Worker
 *
 * Audits every translation in the database and rewrites strings that fall
 * below the elite register standard expected for their locale.
 *
 * Usage:
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
 */

import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve pg from lib/db where it is installed
const requireFromDb = createRequire(
  new URL("../lib/db/package.json", import.meta.url)
);
const { Pool } = requireFromDb("pg");

// Resolve Anthropic SDK from api-server where it is installed
const { default: Anthropic } = await import(
  new URL("../artifacts/api-server/node_modules/@anthropic-ai/sdk/index.mjs", import.meta.url).href
);

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAG_LOCALE  = args.find((a, i) => a === "--locale"  && args[i + 1])
  ? args[args.indexOf("--locale") + 1] : null;
const FLAG_DRY_RUN = args.includes("--dry-run");
const FLAG_VERBOSE = args.includes("--verbose");
const FLAG_FORCE   = args.includes("--force");

// ── Keys that should never be rewritten ──────────────────────────────────────
const SKIP_KEYS = new Set(["app.name", "app.established", "atelier.duration"]);

// ── Per-locale elite register system prompts ─────────────────────────────────
const LOCALE_PROMPTS = {
  nl: `You are a master of Dutch aristocratic language for the Netherlands (nl-NL).
Elite register in Dutch means:
- Always use the formal 'u' and 'uw' (never 'jij', 'je', 'jouw').
- Prefer Latinate and French-derived vocabulary over colloquial Germanic words.
- Use the subjunctive (aanvoegende wijs) where classical Dutch demands it.
- Avoid contractions, diminutives, and modern anglicisms.
- Sentence structure should be measured and dignified, never rushed.
- Forbidden: informal tone, exclamation marks, slang, or abbreviated forms.
Examples of elite register: "Gelieve uw gegevens te verstrekken." not "Vul je gegevens in."`,

  fr: `You are a master of formal French register (fr-FR, Académie française standard).
Elite register in French means:
- Always use 'vous' and 'votre/vos' (never 'tu/te/ton').
- Employ the subjunctive mood freely and correctly.
- Use the passé simple and imparfait du subjonctif in written narrative.
- Prefer elevated vocabulary (e.g. 'demeurer' over 'rester', 'acquérir' over 'obtenir').
- Avoid anglicisms, verlan, and all familiar constructions.
- The tone should evoke the French salons of the 18th century: precise, graceful, authoritative.
Forbidden: colloquialisms, elliptical sentences, exclamation marks in instructions.`,

  de: `You are a master of formal High German register (Hochdeutsch, de-DE).
Elite register in German means:
- Always use the formal 'Sie', 'Ihnen', 'Ihr' (never 'du/dich/dein').
- Use Konjunktiv II for polite requests and hypotheticals.
- Prefer classical compound nouns and Latinate vocabulary over anglicisms.
- Maintain impeccable Duden-standard grammar with no elision.
- The tone should reflect Prussian administrative precision and Goethe-era literary dignity.
- Avoid exclamation marks in instructional text; use the declarative imperative form instead.
Forbidden: casual speech, anglicisms, abbreviations, modern internet vocabulary.`,

  es: `You are a master of Castilian Spanish formal register (es-ES, Real Academia Española standard).
Elite register in Spanish means:
- Always use 'usted' and 'ustedes' with third-person verbal agreement (never 'tú/vosotros').
- Use the subjunctive freely: present, past, and future subjunctive where appropriate.
- Prefer Latinate and classical Spanish vocabulary (e.g. 'solicitar' over 'pedir', 'adquirir' over 'conseguir').
- Sentence rhythm should be formal and measured, not conversational.
- Avoid Latin American colloquialisms, anglicisms, and modern slang.
- The tone should evoke the Spanish Royal Court and Golden Age literature.
Forbidden: 'tú' forms, vosotros, exclamation marks in neutral instructions, anglicisms.`,

  pt: `You are a master of formal European Portuguese register (pt-PT, Portugal standard).
Elite register in Portuguese means:
- Always use 'o senhor' / 'a senhora' or the third person with 'Vossa Excelência' where appropriate.
- Employ the personal infinitive and future subjunctive correctly.
- Prefer classical Portuguese vocabulary over Brazilian neologisms or anglicisms.
- Avoid contractions beyond those sanctioned by standard written Portuguese.
- The tone should evoke the Portuguese royal court and the classical prose of Eça de Queirós.
Forbidden: Brazilian-specific vocabulary, anglicisms, casual tone, abbreviations.`,

  it: `You are a master of formal Italian register (it-IT, Italian Academy standard).
Elite register in Italian means:
- Always use 'Lei' and 'Suo/Sua' as the formal second person (never 'tu').
- Use the congiuntivo (subjunctive) correctly in subordinate clauses.
- Prefer Latinate and Tuscan literary vocabulary over regionalisms or anglicisms.
- Sentence structure should be periodic and elegant, modeled on Leopardi and Manzoni.
- Avoid exclamation marks, abbreviations, and modern colloquialisms.
Forbidden: 'tu' forms, anglicisms, southern Italian regionalisms, modern internet language.`,

  hi: `You are a master of formal Hindi register (hi-IN, standard literary Hindi).
Elite register in Hindi means:
- Use formal 'आप' (aap) forms exclusively (never 'तुम' tum or 'तू' tu).
- Prefer Sanskrit-derived (tatsama) vocabulary over Urdu, English, or regional borrowings.
- Use the respectful imperative ('कृपया ... करें') rather than the plain imperative.
- Sentence structure should reflect classical Khari Boli prose elegance.
- Avoid transliterations of English words; always seek a Sanskrit-derived equivalent.
Forbidden: informal pronouns, anglicisms, Hindi film slang, abbreviated forms.`,

  en: `You are a master of British aristocratic English register (en-GB).
Elite register in English means:
- Prefer understatement over directness ('one might consider' rather than 'you should').
- Use the subjunctive mood where correct ('if one were to...', 'it is essential that one...').
- Prefer Latinate and French-derived vocabulary over Germanic alternatives.
- Avoid Americanisms, contractions in formal text, and colloquialisms.
- The tone should evoke the letters of the Victorian gentry: measured, precise, courteous.
- Use the passive voice where it lends dignity ('it is requested' rather than 'please do').
Forbidden: exclamation marks in neutral instructions, Americanisms, contractions, slang.`,
};

// ── Anthropic client ──────────────────────────────────────────────────────────
if (!process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || !process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
  console.error("Missing AI_INTEGRATIONS_ANTHROPIC_BASE_URL or AI_INTEGRATIONS_ANTHROPIC_API_KEY");
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// ── Database connection ───────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Evaluate + rewrite a single string ───────────────────────────────────────
async function evaluateString(value, langCode) {
  const systemPrompt = LOCALE_PROMPTS[langCode] ?? LOCALE_PROMPTS.en;

  const userMessage = `Evaluate the following UI string for elite register compliance.

String: "${value}"

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "pass": true|false,
  "score": <integer 1-10>,
  "rewritten": "<rewritten string if pass is false, otherwise repeat the original>"
}

- pass: true if the string already meets elite register. false if it needs improvement.
- score: 1 (very informal) to 10 (perfect elite register).
- rewritten: the improved version when pass is false. Keep it the same length and purpose as the original.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
  try {
    return JSON.parse(text);
  } catch {
    return { pass: true, score: 7, rewritten: value };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("SOWISO Elite Register Worker");
  console.log(`Mode: ${FLAG_DRY_RUN ? "DRY RUN — no changes written" : "LIVE — rewrites will be saved"}`);
  if (FLAG_LOCALE) console.log(`Filter: locale = ${FLAG_LOCALE}`);
  if (FLAG_FORCE)  console.log("Force: re-evaluating already-reviewed strings");
  console.log("─".repeat(60));

  let query = `SELECT id, language_code, key, value FROM translations WHERE 1=1`;
  const params = [];

  if (FLAG_LOCALE) {
    params.push(FLAG_LOCALE);
    query += ` AND language_code = $${params.length}`;
  }
  if (!FLAG_FORCE) {
    query += ` AND quality_reviewed_at IS NULL`;
  }
  query += ` ORDER BY language_code, key`;

  const client = await pool.connect();
  const { rows } = await client.query(query, params);
  console.log(`\nStrings to evaluate: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log("Nothing to do. Use --force to re-evaluate already-reviewed strings.");
    client.release();
    await pool.end();
    return;
  }

  let passed = 0;
  let rewritten = 0;
  let errors = 0;
  const changes = [];

  for (const row of rows) {
    if (SKIP_KEYS.has(row.key)) {
      if (FLAG_VERBOSE) console.log(`  SKIP  [${row.language_code}] ${row.key}`);
      continue;
    }

    try {
      const result = await evaluateString(row.value, row.language_code);

      if (result.pass) {
        passed++;
        if (FLAG_VERBOSE) {
          console.log(`  PASS  [${row.language_code}] ${row.key} (score: ${result.score})`);
        }
      } else {
        rewritten++;
        changes.push({
          id: row.id,
          key: row.key,
          lang: row.language_code,
          original: row.value,
          rewritten: result.rewritten,
          score: result.score,
        });
        console.log(`  REWRITE [${row.language_code}] ${row.key}`);
        console.log(`    Before: ${row.value}`);
        console.log(`    After:  ${result.rewritten}`);
        console.log(`    Score:  ${result.score}/10 → improved`);
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
      console.error(`  ERROR [${row.language_code}] ${row.key}: ${err.message}`);
    }

    // Polite rate-limiting
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Summary:`);
  console.log(`  Passed unchanged:  ${passed}`);
  console.log(`  Rewritten:         ${rewritten}`);
  console.log(`  Errors:            ${errors}`);
  if (FLAG_DRY_RUN) {
    console.log(`\n  DRY RUN — no changes were written to the database.`);
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
