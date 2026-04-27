#!/usr/bin/env node
/**
 * SOWISO Register Calibration Worker
 *
 * Rewrites module-content strings to the correct language register for the
 * module being studied — not for the membership level of the user.
 *
 * Mapping:
 *   --module standard  →  warm, direct, accessible middle-class register
 *   --module elite     →  formal, refined, prestige-class register
 *
 * The mapping is absolute: a paying elite member studying a standard module
 * gets middle-class language. A standard member exploring an elite module
 * gets elite language. No mixing.
 *
 * SCOPE — only explicit module-content key prefixes are processed:
 *   scenario.*, situation.*, counsel_advice.*, advice.*, learntrack.*,
 *   track.*, question.*, hint.*, lesson.*, exercise.*, module.*, content.*
 * UI labels (counsel.*, nav.*, home.*, etc.) are never touched.
 *
 * LOCALES — only the 9 supported calibration locales are processed:
 *   nl, nl-BE, fr, fr-BE, en, en-GB, de, es, it.
 * Rows with other language codes are skipped with a warning unless
 * --locale explicitly names that code (user takes responsibility).
 *
 * Usage (see TRANSLATION_WORKER.md for full docs):
 *   node scripts/register-calibration-worker.mjs --module <standard|elite> [options]
 *
 * Options:
 *   --module <standard|elite>   REQUIRED — the module register to apply
 *   --locale <code>             Only process this language_code or region_link
 *   --dry-run                   Print planned rewrites without touching the DB
 *   --verbose                   Show every evaluated string, even those that pass
 *   --force                     Re-evaluate strings already stamped with
 *                               quality_reviewed_at
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const _require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { Pool } = _require("pg");

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flagArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const FLAG_MODULE  = flagArg("--module");
const FLAG_LOCALE  = flagArg("--locale");
const FLAG_DRY_RUN = args.includes("--dry-run");
const FLAG_VERBOSE = args.includes("--verbose");
const FLAG_FORCE   = args.includes("--force");

if (!FLAG_MODULE || !["standard", "elite"].includes(FLAG_MODULE)) {
  console.error(
    "Error: --module <standard|elite> is required.\n\n" +
    "  node scripts/register-calibration-worker.mjs --module standard\n" +
    "  node scripts/register-calibration-worker.mjs --module elite\n"
  );
  process.exit(1);
}

// ── Environment guards ────────────────────────────────────────────────────────
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

// ── Keys that must never be rewritten ────────────────────────────────────────
const SKIP_KEYS = new Set(["app.name", "app.established", "atelier.duration"]);

// ── Module-content key allowlist ──────────────────────────────────────────────
// ONLY keys whose prefix appears in this list are processed.
// This is an explicit allowlist — anything not matching is skipped.
// UI labels (counsel.*, nav.*, home.*, atelier.*, etc.) are naturally excluded
// because they do not start with any of these prefixes.
//
// Note: "counsel_advice." covers Counsel advice content rows.
//       "counsel." (without underscore) covers UI label rows and is NOT listed.
const CONTENT_KEY_PREFIXES = [
  "scenario.",
  "situation.",
  "counsel_advice.",
  "advice.",
  "learntrack.",
  "track.",
  "question.",
  "hint.",
  "lesson.",
  "exercise.",
  "module.",
  "content.",
];

function isContentKey(key) {
  if (SKIP_KEYS.has(key)) return false;
  for (const prefix of CONTENT_KEY_PREFIXES) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

// ── Supported calibration locales ─────────────────────────────────────────────
// Prompt sets exist for these 9 targets (stored as base language_code values).
// nl-BE / fr-BE / en-GB are handled via region_link lookup inside getSystemPrompt.
const SUPPORTED_BASE_CODES = new Set(["nl", "fr", "en", "de", "es", "it"]);

function isSupportedLocale(languageCode) {
  return SUPPORTED_BASE_CODES.has(languageCode);
}

// ── Module-register → locale-specific system prompts ─────────────────────────
//
// Resolution order for getSystemPrompt(languageCode, regionLink):
//   1. "<regionLink>"   e.g. "nl-BE"   (most specific — region variant)
//   2. "<languageCode>" e.g. "nl"       (base language fallback)
//   3. "en"             hard fallback (should never be reached for supported locales)
//
// Both registers have complete prompt sets for all 9 supported locales.

const PROMPTS_STANDARD = {
  // ── Dutch (Netherlands) ───────────────────────────────────────────────────
  "nl": `Je herschrijft teksten naar toegankelijke, warme, directe Nederlandse middenstandstaal.
Gebruik 'jij'/'jou'/'jouw' of een vriendelijk 'u' — geen formeel 'u' als standaard.
Woordkeuze: alledaags, concreet, hartelijk. Vermijd jargon, Latijns vocabulaire en elitaire fraseringen.
Zinnen: kort en helder. Spreektaal mag wanneer het de tekst levendiger maakt.
Toon: warm, bemoedigend, direct — als een goedbedoelende buur of collega.`,

  // ── Belgian Dutch / Flemish ───────────────────────────────────────────────
  "nl-BE": `Je herschrijft teksten naar toegankelijke, warme, directe Vlaamse middenstandstaal.
Gebruik Vlaamse spreektaalconventies: 'ge'/'gij' mag in informele context, anders vriendelijk 'u'.
Woordkeuze: Vlaams-alledaags, concreet, hartelijk. Vermijd Hollandse idiomen en elitaire fraseringen.
Zinnen: kort en helder. Toon: warm, menselijk en direct — typisch Vlaamse nuchterheid.`,

  // ── French (France) ───────────────────────────────────────────────────────
  "fr": `Tu réécris les textes dans un français courant, chaleureux et direct — le registre des classes moyennes.
Tutoie ou vouvoie selon le contexte ; préfère 'vous' pour la politesse sans rigidité.
Vocabulaire : concret, quotidien, sans termes latins ni jargon élitiste.
Phrases : courtes, claires, vivantes. Ton : bienveillant, direct, comme un bon collègue.`,

  // ── Belgian French ────────────────────────────────────────────────────────
  "fr-BE": `Tu réécris les textes dans un français belge courant, chaleureux et direct.
Emploie les belgicismes naturels quand ils enrichissent le texte (septante, nonante, etc.).
Vouvoiement poli mais pas rigide. Vocabulaire : concret, quotidien, sans élitisme.
Ton : convivial, direct, avec la chaleur typique de la culture belge.`,

  // ── English (catch-all / American default) ────────────────────────────────
  "en": `You rewrite text in warm, plain, direct everyday English — the register of the middle class.
Use 'you' naturally; contractions are fine ('you're', 'it's', 'don't').
Vocabulary: concrete, familiar, no Latinate jargon or elite phrasing.
Sentences: short and clear. Tone: friendly, encouraging, approachable — like a helpful colleague.`,

  // ── British English ───────────────────────────────────────────────────────
  "en-GB": `You rewrite text in warm, plain, direct everyday British English — the register of the middle class.
Use 'you' naturally; contractions are fine. Vocabulary: concrete, familiar British idiom.
Avoid Americanisms and Latinate jargon. Tone: friendly, straightforward, no-nonsense.`,

  // ── German ────────────────────────────────────────────────────────────────
  "de": `Du schreibst Texte in zugängliches, warmes, direktes Deutsch — das Register der Mittelschicht.
'Du' oder höfliches 'Sie', je nach Kontext. Kein 'Sie' als einzige Option.
Wortschatz: alltagsnah, konkret, herzlich. Keine Latein-Fremdwörter, kein Bürokratenjargon.
Sätze: kurz und klar. Ton: freundlich, ermutigend, wie ein guter Kollege.`,

  // ── Spanish ───────────────────────────────────────────────────────────────
  "es": `Reescribes textos en español corriente, cálido y directo — el registro de la clase media.
Usa 'tú' o 'usted' según el contexto; sin rigidez formal.
Vocabulario: cotidiano, concreto, sin latinismos ni frases elitistas.
Frases: cortas y claras. Tono: amable, alentador, como un buen compañero.`,

  // ── Italian ───────────────────────────────────────────────────────────────
  "it": `Riscrivi i testi in italiano corrente, caldo e diretto — il registro della classe media.
Usa 'tu' o 'Lei' a seconda del contesto; nessuna rigidità formale.
Vocabolario: quotidiano, concreto, senza latinismi o frasi elitarie.
Frasi: brevi e chiare. Tono: amichevole, incoraggiante, come un buon collega.`,
};

const PROMPTS_ELITE = {
  // ── Dutch (Netherlands) ───────────────────────────────────────────────────
  "nl": `U herschrijft teksten naar formeel, verfijnd elitetaal in het Nederlands (nl-NL).
Altijd 'u'/'uw'. Latijns en Frans-geleend vocabulaire waar passend. Geen verkleinwoorden,
geen anglicismen, geen spreektaal. Aanvoegende wijs (conjunctief) waar klassiek Nederlands dat vereist.
Toon: gereserveerd, waardig, als briefwisseling van de Nederlandse adel.`,

  // ── Belgian Dutch / Flemish ───────────────────────────────────────────────
  "nl-BE": `U herschrijft teksten naar formeel, verfijnd elitetaal in het Vlaams (nl-BE).
Altijd 'u'/'uw'. Vlaams literair vocabulaire; geen Hollandse uitdrukkingen.
Geen anglicismen, geen verkleinwoorden, geen spreektaal.
Toon: Vlaamse culturele grandeur — klassiek, gemeten, waardig.`,

  // ── French (France) ───────────────────────────────────────────────────────
  "fr": `Vous réécrivez les textes dans un registre élitiste formel et raffiné en français (fr-FR, standard Académie française).
Toujours 'vous'/'votre/vos'. Vocabulaire de prestige ('demeurer', 'acquérir', 'solliciter').
Subjonctif correctement et librement employé. Aucun anglicisme, aucune ellipse, aucune familiarité.
Ton : salon parisien du XVIIIe siècle — précis, élégant, autoritaire.`,

  // ── Belgian French ────────────────────────────────────────────────────────
  "fr-BE": `Vous réécrivez les textes dans un registre élitiste formel et raffiné en français belge (fr-BE).
'Vous'/'votre' obligatoire. Vocabulaire de prestige de la tradition littéraire belge.
Subjonctif correctement employé. Aucun anglicisme, aucune familiarité.
Ton : noblesse belge — raffiné, mesuré, empreint de dignité bourgeoise francophone.`,

  // ── English (catch-all / American default) ────────────────────────────────
  "en": `You rewrite text in formal, refined elite English (en-GB aristocratic standard as default).
Subjunctive mood ('if one were to…'), Latinate vocabulary, no contractions in formal sentences.
Understatement, passive voice where it lends dignity. Avoid Americanisms, slang, exclamation marks.
Tone: Victorian gentry correspondence — measured, precise, courteous.`,

  // ── British English ───────────────────────────────────────────────────────
  "en-GB": `You rewrite text in formal, refined elite British English.
Subjunctive mood, Latinate vocabulary, no contractions, understatement, passive voice for dignity.
Avoid Americanisms, slang, colloquialisms, exclamation marks in neutral instructions.
Tone: British aristocratic correspondence — Victorian gentry, measured and precise.`,

  // ── German ────────────────────────────────────────────────────────────────
  "de": `Sie schreiben Texte in formalem, verfeinerten Elitedeutsch (de-DE Duden-Hochdeutsch-Standard).
Immer 'Sie'/'Ihnen'/'Ihr'. Konjunktiv II für Bitten und Hypothetisches.
Klassische lateinische Komposita, tadellose Duden-Grammatik, keine Anglizismen, keine Elision.
Ton: Preußische Verwaltungspräzision verbunden mit der literarischen Würde der Goethezeit.`,

  // ── Spanish ───────────────────────────────────────────────────────────────
  "es": `Usted reescribe textos en español formal, refinado y elitista (es-ES, estándar RAE).
Siempre 'usted'/'ustedes' con concordancia verbal en tercera persona.
Vocabulario latinizante ('solicitar', 'adquirir', 'residir'). Subjuntivo empleado con libertad.
Sin coloquialismos latinoamericanos, sin anglicismos. Tono: Corte Real española y Siglo de Oro.`,

  // ── Italian ───────────────────────────────────────────────────────────────
  "it": `Lei riscrive i testi in italiano formale, raffinato ed elitario (it-IT, standard Accademia della Crusca).
Sempre 'Lei'/'Suo'/'Sua'. Congiuntivo usato correttamente e liberamente.
Vocabolario latinista e toscano letterario. Nessun anglicismo, nessuna abbreviazione.
Tono: Leopardi e Manzoni — periodico, elegante, toscano.`,
};

const MODULE_PROMPTS = {
  standard: PROMPTS_STANDARD,
  elite:    PROMPTS_ELITE,
};

function getSystemPrompt(languageCode, regionLink) {
  const prompts = MODULE_PROMPTS[FLAG_MODULE];
  // Resolution: most-specific (region variant) → base language code
  const keys = [regionLink, languageCode].filter(Boolean);
  for (const key of keys) {
    if (prompts[key]) return prompts[key];
  }
  // Should not be reached for supported locales; hard fallback to English
  return prompts["en"];
}

// ── Evaluate + optionally rewrite a single string ────────────────────────────
async function evaluateString(value, languageCode, regionLink) {
  const systemPrompt = getSystemPrompt(languageCode, regionLink);
  const registerLabel = FLAG_MODULE === "standard" ? "middle-class register" : "elite register";

  const userMessage =
    `Evaluate the following module-content string for ${registerLabel} compliance.\n\n` +
    `String: "${value}"\n\n` +
    `Respond ONLY with a JSON object (no markdown, no explanation outside the JSON):\n` +
    `{\n` +
    `  "pass": true|false,\n` +
    `  "score": <integer 1-10>,\n` +
    `  "rewritten": "<improved string when pass is false; repeat original when pass is true>"\n` +
    `}\n\n` +
    `pass: true if the string already meets the ${registerLabel} standard.\n` +
    `score: 1 (completely wrong register) to 10 (perfect register).\n` +
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
  text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return parsed;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("SOWISO Register Calibration Worker");
  console.log(`Module:  ${FLAG_MODULE.toUpperCase()} (${FLAG_MODULE === "standard" ? "warm, direct middle-class language" : "formal, refined elite language"})`);
  console.log(
    `Mode:    ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — rewrites will be saved"}`
  );

  const isFullLocale = FLAG_LOCALE ? FLAG_LOCALE.includes("-") : false;
  if (FLAG_LOCALE) {
    console.log(
      isFullLocale
        ? `Filter:  region_link = ${FLAG_LOCALE}`
        : `Filter:  language_code = ${FLAG_LOCALE}`
    );
  } else {
    console.log(`Filter:  supported locales only (${[...SUPPORTED_BASE_CODES].join(", ")})`);
  }
  if (FLAG_FORCE) console.log("Force:   re-evaluating already-reviewed strings");
  console.log("─".repeat(60));

  const conditions = ["1=1"];
  const params = [];

  if (FLAG_LOCALE) {
    params.push(FLAG_LOCALE);
    if (isFullLocale) {
      conditions.push(`region_link = $${params.length}`);
    } else {
      conditions.push(`language_code = $${params.length}`);
    }
  }
  if (!FLAG_FORCE) {
    conditions.push("quality_reviewed_at IS NULL");
  }

  const query =
    `SELECT id, language_code, formality_register, region_link, key, value ` +
    `FROM translations ` +
    `WHERE ${conditions.join(" AND ")} ` +
    `ORDER BY language_code, key`;

  const client = await pool.connect();
  let rows;
  try {
    ({ rows } = await client.query(query, params));
  } catch (err) {
    client.release();
    throw err;
  }

  // ── Scope filter 1: only module-content keys (explicit allowlist) ──────────
  // ── Scope filter 2: only supported calibration locales ───────────────────
  let skippedContent = 0;
  let skippedLocale  = 0;
  let skippedKeys    = 0;

  const contentRows = rows.filter((row) => {
    // Skip explicitly protected keys
    if (SKIP_KEYS.has(row.key)) {
      skippedKeys++;
      return false;
    }

    // Skip keys not in the module-content allowlist
    if (!isContentKey(row.key)) {
      skippedContent++;
      return false;
    }

    // When no --locale is given, restrict to the 9 supported calibration locales
    // to prevent silent English-fallback processing of unsupported languages.
    if (!FLAG_LOCALE && !isSupportedLocale(row.language_code)) {
      skippedLocale++;
      return false;
    }

    return true;
  });

  console.log(`\nStrings fetched from DB:         ${rows.length}`);
  console.log(`  Skipped — protected keys:       ${skippedKeys}`);
  console.log(`  Skipped — not module content:   ${skippedContent}`);
  console.log(`  Skipped — unsupported locale:   ${skippedLocale}`);
  console.log(`Content strings to calibrate:    ${contentRows.length}\n`);

  if (skippedLocale > 0 && !FLAG_LOCALE) {
    console.log(
      `  Note: ${skippedLocale} row(s) skipped because their language_code is not in the\n` +
      `  supported calibration set. To process a specific locale explicitly,\n` +
      `  pass --locale <code>.\n`
    );
  }

  if (contentRows.length === 0) {
    console.log("Nothing to process.");
    console.log("Tips:");
    console.log("  • Use --force to re-evaluate already-reviewed strings.");
    console.log("  • Check that the DB contains keys matching module-content prefixes:");
    console.log("   ", CONTENT_KEY_PREFIXES.join(", "));
    client.release();
    await pool.end();
    return;
  }

  let passed     = 0;
  let rewritten  = 0;
  let parseErrors = 0;
  let apiErrors   = 0;

  for (const row of contentRows) {
    const label = `[${row.language_code}${row.region_link ? "/" + row.region_link : ""}] ${row.key}`;

    let result;
    try {
      result = await evaluateString(row.value, row.language_code, row.region_link);
    } catch (err) {
      apiErrors++;
      console.error(`  API ERROR  ${label}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    if (result === null) {
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

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n" + "─".repeat(60));
  console.log("Summary:");
  console.log(`  Module register:             ${FLAG_MODULE}`);
  console.log(`  Content strings processed:   ${contentRows.length}`);
  console.log(`  Passed unchanged:            ${passed}`);
  console.log(`  Rewritten:                   ${rewritten}`);
  console.log(`  Parse errors (skipped):      ${parseErrors}`);
  console.log(`  API errors (skipped):        ${apiErrors}`);
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
