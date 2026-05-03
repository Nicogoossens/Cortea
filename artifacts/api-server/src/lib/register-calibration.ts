/**
 * Register Calibration — shared library
 *
 * Encapsulates the calibration logic from scripts/register-calibration-worker.mjs
 * so it can be invoked on-demand from API endpoints (e.g. immediately after the
 * admin CRUD flow saves new module-content translation rows). The CLI worker
 * remains the batch-processing entry point; this library is the in-process
 * equivalent for one-off, ID-targeted calibration.
 *
 * Mapping:
 *   "standard"  →  warm, direct, accessible middle-class register
 *   "elite"     →  formal, refined, prestige-class register
 *
 * The mapping is absolute and independent of the user's membership tier.
 */

import { db, translationsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";

export type CalibrationModule = "standard" | "elite";

// ── Keys that must never be rewritten ────────────────────────────────────────
const SKIP_KEYS = new Set(["app.name", "app.established", "atelier.duration"]);

// ── Module-content key allowlist ──────────────────────────────────────────────
// Only keys whose prefix appears in this list are processed.
// UI labels (counsel.*, nav.*, home.*, atelier.*) are naturally excluded.
// Note: "counsel_advice." covers Counsel advice content rows;
//       "counsel." (without underscore) is a UI prefix and is NOT listed.
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

export function isContentKey(key: string): boolean {
  if (SKIP_KEYS.has(key)) return false;
  for (const prefix of CONTENT_KEY_PREFIXES) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

// ── Supported calibration locales ─────────────────────────────────────────────
const SUPPORTED_BASE_CODES = new Set(["nl", "fr", "en", "de", "es", "it"]);

export function isSupportedLocale(languageCode: string): boolean {
  return SUPPORTED_BASE_CODES.has(languageCode);
}

// ── Module-register → locale-specific system prompts ─────────────────────────
//
// Resolution order: regionLink (e.g. "nl-BE") → languageCode (e.g. "nl") → "en".
// Mirrors scripts/register-calibration-worker.mjs verbatim so that CLI and API
// produce identical results.

const PROMPTS_STANDARD: Record<string, string> = {
  "nl": `Je herschrijft teksten naar toegankelijke, warme, directe Nederlandse middenstandstaal.
Gebruik 'jij'/'jou'/'jouw' of een vriendelijk 'u' — geen formeel 'u' als standaard.
Woordkeuze: alledaags, concreet, hartelijk. Vermijd jargon, Latijns vocabulaire en elitaire fraseringen.
Zinnen: kort en helder. Spreektaal mag wanneer het de tekst levendiger maakt.
Toon: warm, bemoedigend, direct — als een goedbedoelende buur of collega.`,

  "nl-BE": `Je herschrijft teksten naar toegankelijke, warme, directe Vlaamse middenstandstaal.
Gebruik Vlaamse spreektaalconventies: 'ge'/'gij' mag in informele context, anders vriendelijk 'u'.
Woordkeuze: Vlaams-alledaags, concreet, hartelijk. Vermijd Hollandse idiomen en elitaire fraseringen.
Zinnen: kort en helder. Toon: warm, menselijk en direct — typisch Vlaamse nuchterheid.`,

  "fr": `Tu réécris les textes dans un français courant, chaleureux et direct — le registre des classes moyennes.
Tutoie ou vouvoie selon le contexte ; préfère 'vous' pour la politesse sans rigidité.
Vocabulaire : concret, quotidien, sans termes latins ni jargon élitiste.
Phrases : courtes, claires, vivantes. Ton : bienveillant, direct, comme un bon collègue.`,

  "fr-BE": `Tu réécris les textes dans un français belge courant, chaleureux et direct.
Emploie les belgicismes naturels quand ils enrichissent le texte (septante, nonante, etc.).
Vouvoiement poli mais pas rigide. Vocabulaire : concret, quotidien, sans élitisme.
Ton : convivial, direct, avec la chaleur typique de la culture belge.`,

  "en": `You rewrite text in warm, plain, direct everyday English — the register of the middle class.
Use 'you' naturally; contractions are fine ('you're', 'it's', 'don't').
Vocabulary: concrete, familiar, no Latinate jargon or elite phrasing.
Sentences: short and clear. Tone: friendly, encouraging, approachable — like a helpful colleague.`,

  "en-GB": `You rewrite text in warm, plain, direct everyday British English — the register of the middle class.
Use 'you' naturally; contractions are fine. Vocabulary: concrete, familiar British idiom.
Avoid Americanisms and Latinate jargon. Tone: friendly, straightforward, no-nonsense.`,

  "de": `Du schreibst Texte in zugängliches, warmes, direktes Deutsch — das Register der Mittelschicht.
'Du' oder höfliches 'Sie', je nach Kontext. Kein 'Sie' als einzige Option.
Wortschatz: alltagsnah, konkret, herzlich. Keine Latein-Fremdwörter, kein Bürokratenjargon.
Sätze: kurz und klar. Ton: freundlich, ermutigend, wie ein guter Kollege.`,

  "es": `Reescribes textos en español corriente, cálido y directo — el registro de la clase media.
Usa 'tú' o 'usted' según el contexto; sin rigidez formal.
Vocabulario: cotidiano, concreto, sin latinismos ni frases elitistas.
Frases: cortas y claras. Tono: amable, alentador, como un buen compañero.`,

  "it": `Riscrivi i testi in italiano corrente, caldo e diretto — il registro della classe media.
Usa 'tu' o 'Lei' a seconda del contesto; nessuna rigidità formale.
Vocabolario: quotidiano, concreto, senza latinismi o frasi elitarie.
Frasi: brevi e chiare. Tono: amichevole, incoraggiante, come un buon collega.`,
};

const PROMPTS_ELITE: Record<string, string> = {
  "nl": `U herschrijft teksten naar formeel, verfijnd elitetaal in het Nederlands (nl-NL).
Altijd 'u'/'uw'. Latijns en Frans-geleend vocabulaire waar passend. Geen verkleinwoorden,
geen anglicismen, geen spreektaal. Aanvoegende wijs (conjunctief) waar klassiek Nederlands dat vereist.
Toon: gereserveerd, waardig, als briefwisseling van de Nederlandse adel.`,

  "nl-BE": `U herschrijft teksten naar formeel, verfijnd elitetaal in het Vlaams (nl-BE).
Altijd 'u'/'uw'. Vlaams literair vocabulaire; geen Hollandse uitdrukkingen.
Geen anglicismen, geen verkleinwoorden, geen spreektaal.
Toon: Vlaamse culturele grandeur — klassiek, gemeten, waardig.`,

  "fr": `Vous réécrivez les textes dans un registre élitiste formel et raffiné en français (fr-FR, standard Académie française).
Toujours 'vous'/'votre/vos'. Vocabulaire de prestige ('demeurer', 'acquérir', 'solliciter').
Subjonctif correctement et librement employé. Aucun anglicisme, aucune ellipse, aucune familiarité.
Ton : salon parisien du XVIIIe siècle — précis, élégant, autoritaire.`,

  "fr-BE": `Vous réécrivez les textes dans un registre élitiste formel et raffiné en français belge (fr-BE).
'Vous'/'votre' obligatoire. Vocabulaire de prestige de la tradition littéraire belge.
Subjonctif correctement employé. Aucun anglicisme, aucune familiarité.
Ton : noblesse belge — raffiné, mesuré, empreint de dignité bourgeoise francophone.`,

  "en": `You rewrite text in formal, refined elite English (en-GB aristocratic standard as default).
Subjunctive mood ('if one were to…'), Latinate vocabulary, no contractions in formal sentences.
Understatement, passive voice where it lends dignity. Avoid Americanisms, slang, exclamation marks.
Tone: Victorian gentry correspondence — measured, precise, courteous.`,

  "en-GB": `You rewrite text in formal, refined elite British English.
Subjunctive mood, Latinate vocabulary, no contractions, understatement, passive voice for dignity.
Avoid Americanisms, slang, colloquialisms, exclamation marks in neutral instructions.
Tone: British aristocratic correspondence — Victorian gentry, measured and precise.`,

  "de": `Sie schreiben Texte in formalem, verfeinerten Elitedeutsch (de-DE Duden-Hochdeutsch-Standard).
Immer 'Sie'/'Ihnen'/'Ihr'. Konjunktiv II für Bitten und Hypothetisches.
Klassische lateinische Komposita, tadellose Duden-Grammatik, keine Anglizismen, keine Elision.
Ton: Preußische Verwaltungspräzision verbunden mit der literarischen Würde der Goethezeit.`,

  "es": `Usted reescribe textos en español formal, refinado y elitista (es-ES, estándar RAE).
Siempre 'usted'/'ustedes' con concordancia verbal en tercera persona.
Vocabulario latinizante ('solicitar', 'adquirir', 'residir'). Subjuntivo empleado con libertad.
Sin coloquialismos latinoamericanos, sin anglicismos. Tono: Corte Real española y Siglo de Oro.`,

  "it": `Lei riscrive i testi in italiano formale, raffinato ed elitario (it-IT, standard Accademia della Crusca).
Sempre 'Lei'/'Suo'/'Sua'. Congiuntivo usato correttamente e liberamente.
Vocabolario latinista e toscano letterario. Nessun anglicismo, nessuna abbreviazione.
Tono: Leopardi e Manzoni — periodico, elegante, toscano.`,
};

const MODULE_PROMPTS: Record<CalibrationModule, Record<string, string>> = {
  standard: PROMPTS_STANDARD,
  elite: PROMPTS_ELITE,
};

function getSystemPrompt(
  module: CalibrationModule,
  languageCode: string,
  regionLink: string | null
): string {
  const prompts = MODULE_PROMPTS[module];
  const keys = [regionLink, languageCode].filter(Boolean) as string[];
  for (const key of keys) {
    if (prompts[key]) return prompts[key];
  }
  return prompts["en"];
}

// ── Anthropic evaluator ───────────────────────────────────────────────────────

interface EvaluationResult {
  pass: boolean;
  score: number;
  rewritten: string;
}

async function evaluateString(
  value: string,
  module: CalibrationModule,
  languageCode: string,
  regionLink: string | null
): Promise<EvaluationResult | null> {
  const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const anthropicKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!anthropicBase || !anthropicKey) {
    throw new Error(
      "AI_INTEGRATIONS_ANTHROPIC_BASE_URL or AI_INTEGRATIONS_ANTHROPIC_API_KEY not configured."
    );
  }

  const systemPrompt = getSystemPrompt(module, languageCode, regionLink);
  const registerLabel =
    module === "standard" ? "middle-class register" : "elite register";

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

  const response = await fetch(`${anthropicBase}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
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

  const data = (await response.json()) as {
    content?: Array<{ type: string; text: string }>;
  };
  let text = data.content?.[0]?.text?.trim() ?? "";
  text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(text) as Partial<EvaluationResult>;
    if (
      typeof parsed.pass !== "boolean" ||
      typeof parsed.score !== "number" ||
      typeof parsed.rewritten !== "string"
    ) {
      return null;
    }
    return {
      pass: parsed.pass,
      score: parsed.score,
      rewritten: parsed.rewritten,
    };
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export type RowOutcome =
  | { id: number; status: "passed"; score: number }
  | {
      id: number;
      status: "rewritten";
      score: number;
      before: string;
      after: string;
    }
  | {
      id: number;
      status: "skipped";
      reason: "not_content_key" | "unsupported_locale" | "not_found";
    }
  | { id: number; status: "error"; reason: "api_error" | "parse_error"; message?: string };

export interface CalibrationSummary {
  module: CalibrationModule;
  dryRun: boolean;
  total: number;
  passed: number;
  rewritten: number;
  skipped: number;
  errors: number;
  results: RowOutcome[];
}

export interface CalibrateOptions {
  dryRun?: boolean;
  /**
   * When true, allow processing rows whose calibrated_module already matches
   * the requested module. Default is false (skip already-calibrated rows).
   */
  force?: boolean;
}

/**
 * Calibrate a specific set of translation rows by ID.
 *
 * Rows are evaluated against the requested module register. Rows that are not
 * module-content keys, that are in an unsupported locale, or that do not exist
 * are skipped without error. On success, the row's `value`, `quality_reviewed_at`
 * and `calibrated_module` columns are updated (unless `dryRun` is true).
 */
export async function calibrateTranslationsByIds(
  ids: number[],
  module: CalibrationModule,
  options: CalibrateOptions = {}
): Promise<CalibrationSummary> {
  const dryRun = options.dryRun ?? false;
  const force = options.force ?? false;

  const summary: CalibrationSummary = {
    module,
    dryRun,
    total: ids.length,
    passed: 0,
    rewritten: 0,
    skipped: 0,
    errors: 0,
    results: [],
  };

  if (ids.length === 0) return summary;

  const rows = await db
    .select({
      id: translationsTable.id,
      language_code: translationsTable.language_code,
      region_link: translationsTable.region_link,
      key: translationsTable.key,
      value: translationsTable.value,
      calibrated_module: translationsTable.calibrated_module,
    })
    .from(translationsTable)
    .where(inArray(translationsTable.id, ids));

  const rowsById = new Map(rows.map((r) => [r.id, r]));

  for (const id of ids) {
    const row = rowsById.get(id);
    if (!row) {
      summary.skipped++;
      summary.results.push({ id, status: "skipped", reason: "not_found" });
      continue;
    }

    if (!isContentKey(row.key)) {
      summary.skipped++;
      summary.results.push({ id, status: "skipped", reason: "not_content_key" });
      continue;
    }

    if (!isSupportedLocale(row.language_code)) {
      summary.skipped++;
      summary.results.push({ id, status: "skipped", reason: "unsupported_locale" });
      continue;
    }

    if (!force && row.calibrated_module === module) {
      // Already calibrated to the requested register — treat as passed.
      summary.passed++;
      summary.results.push({ id, status: "passed", score: 10 });
      continue;
    }

    let result: EvaluationResult | null;
    try {
      result = await evaluateString(
        row.value,
        module,
        row.language_code,
        row.region_link
      );
    } catch (err) {
      summary.errors++;
      summary.results.push({
        id,
        status: "error",
        reason: "api_error",
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    if (result === null) {
      summary.errors++;
      summary.results.push({ id, status: "error", reason: "parse_error" });
      continue;
    }

    if (result.pass) {
      summary.passed++;
      summary.results.push({ id, status: "passed", score: result.score });
      if (!dryRun) {
        await db
          .update(translationsTable)
          .set({
            quality_reviewed_at: sql`NOW()`,
            calibrated_module: module,
          })
          .where(eq(translationsTable.id, id));
      }
    } else {
      summary.rewritten++;
      summary.results.push({
        id,
        status: "rewritten",
        score: result.score,
        before: row.value,
        after: result.rewritten,
      });
      if (!dryRun) {
        await db
          .update(translationsTable)
          .set({
            value: result.rewritten,
            quality_reviewed_at: sql`NOW()`,
            calibrated_module: module,
          })
          .where(eq(translationsTable.id, id));
      }
    }
  }

  return summary;
}

// ── In-memory JSONB map calibration ──────────────────────────────────────────
//
// Some content tables store translations in a JSONB column (e.g.
// `culture_protocols.rule_cc_i18n`, `scenarios.content_i18n`) instead of
// individual rows in `translations`. This helper calibrates such a map in
// memory without touching the database, so the caller can decide what to do
// with the result (typically: write the calibrated map back to the JSONB
// column once it has changed).
//
// Locales whose base code is not in SUPPORTED_BASE_CODES are passed through
// unchanged. All eligible locales are evaluated in parallel.

export interface I18nMapCalibrationResult {
  calibrated: Record<string, string>;
  unchanged: number;
  rewritten: number;
  skipped: number;
  errors: number;
  changed: boolean;
}

export async function calibrateI18nMap(
  map: Record<string, string>,
  module: CalibrationModule
): Promise<I18nMapCalibrationResult> {
  const calibrated: Record<string, string> = { ...map };
  let unchanged = 0;
  let rewritten = 0;
  let skipped = 0;
  let errors = 0;

  const tasks = Object.entries(map).map(async ([code, value]) => {
    if (typeof value !== "string" || value.length === 0) {
      skipped++;
      return;
    }
    const baseCode = code.split("-")[0];
    if (!isSupportedLocale(baseCode)) {
      skipped++;
      return;
    }
    const regionLink = code.includes("-") ? code : null;
    try {
      const result = await evaluateString(value, module, baseCode, regionLink);
      if (result === null) {
        errors++;
        return;
      }
      if (result.pass) {
        unchanged++;
      } else {
        calibrated[code] = result.rewritten;
        rewritten++;
      }
    } catch {
      errors++;
    }
  });

  await Promise.all(tasks);

  return {
    calibrated,
    unchanged,
    rewritten,
    skipped,
    errors,
    changed: rewritten > 0,
  };
}
