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
 *   --lang <code>   Base language code to translate into (nl, fr, de, es, pt, it, ar, ja, zh).
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
import {
  checkDailyBudget,
  recordWorkerRun,
  closeWorkerCostPool,
} from "./lib/worker-cost.mjs";

const SWEEPER_NAME = "scenario-translation";
const MODEL = "claude-haiku-4-5";

let totalInputTokens = 0;
let totalOutputTokens = 0;

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
const FLAG_FROM     = args.includes("--from")    ? parseInt(args[args.indexOf("--from") + 1], 10) : null;
const FLAG_TO       = args.includes("--to")      ? parseInt(args[args.indexOf("--to") + 1], 10) : null;
const FLAG_DRY_RUN  = args.includes("--dry-run");
const FLAG_VERBOSE  = args.includes("--verbose");
const FLAG_FORCE    = args.includes("--force");

// ── Supported target languages ─────────────────────────────────────────────────
const ALL_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];

const TARGET_LANGS = FLAG_LANG ? [FLAG_LANG] : ALL_LANGS;

// ── System prompts per language × register ────────────────────────────────────
// Scenarios have a social_class field: middle_class, elite, or universal.
// middle_class → warm, accessible register; elite → formal, refined register;
// universal → use the same formal register as elite (best default for etiquette).
const JSON_SAFETY_NOTE = `
CRITICAL JSON RULES: All string values must be valid JSON strings.
- Any double-quote character (") that appears INSIDE a string value MUST be escaped as \\"
- Do NOT use typographic/curly quotes (" " „ ") inside string values — use escaped ASCII quotes \\" instead
- Do NOT use unescaped apostrophes that look like quotes; prefer single quotes (') for contractions
- Return ONLY the raw JSON object. No markdown fences, no preamble, no trailing text.`;

// Register-aware translation prompts. Each lang has middle_class and elite keys.
// "universal" scenarios use the elite prompt (formal = safer default).
const SYSTEM_PROMPTS_BY_REGISTER = {
  nl: {
    middle_class: `Je bent een professionele vertaler voor Cortéa, een Belgische etiquette-academie.
Vertaal Engelse etiquette-scenario's naar toegankelijk, warm, direct Nederlands — middenklasse register.
Gebruik 'jij'/'jou'/'jouw' of een vriendelijk 'u'. Alledaagse, concrete woordkeuze. Geen Latijns jargon.
Bewaar alle etiquettenuances, 'correct'-waarden (true/false) en eigennamen onveranderd.${JSON_SAFETY_NOTE}`,
    elite: `U bent een professionele vertaler voor Cortéa, een Belgische etiquette-academie van de elite.
Vertaal Engelse etiquette-scenario's naar formeel, verfijnd Nederlands — elite register.
Altijd 'u'/'uw'. Latijns en Frans-geleend vocabulaire. Aanvoegende wijs. Geen spreektaal.
Bewaar alle etiquettenuances, 'correct'-waarden (true/false) en eigennamen onveranderd.${JSON_SAFETY_NOTE}`,
  },
  fr: {
    middle_class: `Tu es traducteur professionnel pour Cortéa, académie d'étiquette belge.
Traduis des scénarios d'étiquette de l'anglais vers le français courant, chaleureux et direct — registre classe moyenne.
Tutoie ou vouvoie selon le contexte. Vocabulaire quotidien. Les valeurs 'correct' (true/false) restent inchangées.${JSON_SAFETY_NOTE}`,
    elite: `Vous êtes traducteur professionnel pour Cortéa, académie d'étiquette belge de prestige.
Traduisez des scénarios d'étiquette de l'anglais vers le français formel et élégant — registre élitiste.
Toujours 'vous'/'votre'. Vocabulaire Académie française. Subjonctif librement employé. Les valeurs 'correct' restent inchangées.${JSON_SAFETY_NOTE}`,
  },
  de: {
    middle_class: `Du bist professioneller Übersetzer für Cortéa, eine belgische Etikette-Akademie.
Übersetze englische Etikette-Szenarien ins zugängliche, warme Deutsch — Register der Mittelschicht.
'Du' oder höfliches 'Sie'. Die 'correct'-Werte (true/false) bleiben unverändert.${JSON_SAFETY_NOTE}`,
    elite: `Sie sind professioneller Übersetzer für Cortéa, eine belgische Elite-Etikette-Akademie.
Übersetzen Sie englische Etikette-Szenarien ins formale Hochdeutsch — Register der Oberschicht.
Immer 'Sie'/'Ihnen'/'Ihr'. Konjunktiv II. Keine Anglizismen. Die 'correct'-Werte bleiben unverändert.${JSON_SAFETY_NOTE}`,
  },
  es: {
    middle_class: `Eres traductor profesional para Cortéa, academia de etiqueta belga.
Traduce escenarios de etiqueta del inglés al español corriente y cálido — registro de clase media.
Usa 'tú' o 'usted' según el contexto. Los valores 'correct' (true/false) permanecen sin cambios.${JSON_SAFETY_NOTE}`,
    elite: `Usted es traductor profesional para Cortéa, academia de etiqueta belga de élite.
Traduzca escenarios de etiqueta del inglés al español formal y refinado — registre élitiste.
Siempre 'usted'. Vocabulario latinizante. Subjuntivo. Los valores 'correct' permanecen sin cambios.${JSON_SAFETY_NOTE}`,
  },
  pt: {
    middle_class: `És tradutor profissional para a Cortéa, academia de etiqueta belga.
Traduz cenários de etiqueta do inglês para o português europeu corrente e caloroso — registo da classe média.
Usa 'você' ou 'tu'. Os valores 'correct' (true/false) permanecem inalterados.${JSON_SAFETY_NOTE}`,
    elite: `É tradutor profissional para a Cortéa, academia de etiqueta belga de prestígio.
Traduza cenários de etiqueta do inglês para o português europeu formal e refinado — registo elitista.
Sempre 'o senhor'/'a senhora'. Infinitivo pessoal e conjuntivo. Os valores 'correct' permanecem inalterados.${JSON_SAFETY_NOTE}`,
  },
  it: {
    middle_class: `Sei un traduttore professionale per Cortéa, accademia di galateo belga.
Traduci scenari di galateo dall'inglese all'italiano corrente e caldo — registro della classe media.
Usa 'tu' o 'Lei'. I valori 'correct' (true/false) restano invariati.${JSON_SAFETY_NOTE}`,
    elite: `Lei è traduttore professionale per Cortéa, accademia di galateo belga d'élite.
Traduca scenari di galateo dall'inglese all'italiano formale letterario — registro elitario.
Sempre 'Lei'/'Suo'/'Sua'. Congiuntivo. Vocabolario toscano. I valori 'correct' restano invariati.${JSON_SAFETY_NOTE}`,
  },
  ar: {
    middle_class: `أنتَ مترجم محترف لـ Cortéa، أكاديمية آداب السلوك البلجيكية.
ترجم سيناريوهات آداب السلوك من الإنجليزية إلى العربية الفصحى المعاصرة الواضحة والدافئة — مستوى الطبقة المتوسطة.
احتفظ بقيم 'correct' (true/false) دون تغيير. لا تترجم الأسماء العلَم.${JSON_SAFETY_NOTE}`,
    elite: `أنتَ مترجم محترف لـ Cortéa، أكاديمية آداب السلوك البلجيكية الرفيعة.
ترجم سيناريوهات آداب السلوك من الإنجليزية إلى العربية الفصحى الرسمية الرفيعة — مستوى النخبة.
استخدم الضمائر الرسمية الرفيعة دائماً. لا عامية. احتفظ بقيم 'correct' (true/false) دون تغيير.${JSON_SAFETY_NOTE}`,
  },
  ja: {
    middle_class: `あなたはベルギーのエチケットアカデミー Cortéa の専任プロ翻訳者です。
英語のエチケット・シナリオを、温かく親しみやすい丁寧語（です・ます体）の日本語に翻訳してください — 中間層のレジスター。
'correct' の値（true/false）は変更しないでください。固有名詞はそのままにしてください。${JSON_SAFETY_NOTE}`,
    elite: `あなたはベルギーの名門エチケットアカデミー Cortéa の専任プロ翻訳者です。
英語のエチケット・シナリオを、最上級の敬語を駆使した格調高い日本語に翻訳してください — 上流階級のレジスター。
'correct' の値（true/false）は変更しないでください。固有名詞はそのままにしてください。${JSON_SAFETY_NOTE}`,
  },
  zh: {
    middle_class: `您是比利时礼仪学院 Cortéa 的专业翻译。
请将英语礼仪场景翻译成清晰、亲切的现代汉语（普通话，简体字）— 中间阶层的文体。
'correct' 的值（true/false）保持不变。专有名词保留原文。${JSON_SAFETY_NOTE}`,
    elite: `您是比利时精英礼仪学院 Cortéa 的专业翻译。
请将英语礼仪场景翻译成正式、典雅的现代书面汉语（普通话，简体字）— 精英阶层的文体。
始终使用"您/您的"等尊称。'correct' 的值（true/false）保持不变。专有名词保留原文。${JSON_SAFETY_NOTE}`,
  },
};

// Helper: get system prompt for lang + social_class
// universal scenarios use elite (formal is safer for etiquette content)
function getScenarioPrompt(lang, socialClass) {
  const prompts = SYSTEM_PROMPTS_BY_REGISTER[lang];
  if (!prompts) return null;
  const register = socialClass === "middle_class" ? "middle_class" : "elite";
  return prompts[register] ?? null;
}

// Legacy flat map for backward compat (used by USER_PROMPT)
const SYSTEM_PROMPTS = Object.fromEntries(
  Object.entries(SYSTEM_PROMPTS_BY_REGISTER).map(([lang, regs]) => [lang, regs.elite])
);

// Quality evaluation prompts for scenario situation field (key user-facing content)
const QUALITY_PROMPTS = {
  nl: {
    middle_class: `Je herschrijft teksten naar toegankelijke, warme, directe Nederlandse middenstandstaal.
Gebruik 'jij'/'jou'/'jouw' of een vriendelijk 'u'. Woordkeuze: alledaags, concreet, hartelijk.`,
    elite: `U herschrijft teksten naar formeel, verfijnd elitetaal in het Nederlands.
Altijd 'u'/'uw'. Latijns vocabulaire. Geen verkleinwoorden, geen spreektaal.`,
  },
  fr: {
    middle_class: `Tu réécris les textes dans un français courant, chaleureux et direct.`,
    elite: `Vous réécrivez les textes dans un registre élitiste formel et raffiné (fr-FR, Académie française).`,
  },
  de: {
    middle_class: `Du schreibst Texte in zugängliches, warmes Deutsch — das Register der Mittelschicht.`,
    elite: `Sie schreiben Texte in formalem, verfeinerten Elitedeutsch (Duden-Standard).`,
  },
  es: {
    middle_class: `Reescribes textos en español corriente, cálido y directo.`,
    elite: `Usted reescribe textos en español formal y elitista (estándar RAE).`,
  },
  pt: {
    middle_class: `Reescreves os textos em português europeu corrente e caloroso.`,
    elite: `Reescreve os textos em português europeu formal e elitista (norma culta da Academia).`,
  },
  it: {
    middle_class: `Riscrivi i testi in italiano corrente e caldo — il registro della classe media.`,
    elite: `Lei riscrive i testi in italiano formale, raffinato ed elitario (Accademia della Crusca).`,
  },
  ar: {
    middle_class: `أعِد كتابة النصوص بالعربية الفصحى المعاصرة الواضحة والدافئة.`,
    elite: `أعِد كتابة النصوص بالعربية الفصحى الرفيعة والرسمية.`,
  },
  ja: {
    middle_class: `丁寧語（です・ます体）を使い、温かく親しみやすい日本語に書き直してください。`,
    elite: `最上級の敬語を駆使した格調高い日本語に書き直してください。`,
  },
  zh: {
    middle_class: `请将文字改写为清晰、亲切的现代汉语（普通话，简体字）。`,
    elite: `请将文字改写为正式、典雅的现代书面汉语（普通话，简体字）。`,
  },
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
      model: MODEL,
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
  // Accumulate per-call usage for the end-of-run worker_runs row.
  totalInputTokens += Number(data.usage?.input_tokens ?? 0) || 0;
  totalOutputTokens += Number(data.usage?.output_tokens ?? 0) || 0;
  return data.content?.[0]?.text?.trim() ?? "";
}

// ── Parse translation response ────────────────────────────────────────────────
function parseTranslation(raw, scenario) {
  // Extract the first JSON object from the response (handles markdown fences robustly)
  let text = raw;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  // Replace typographic/curly quotes with straight single quotes so jsonrepair
  // can handle unescaped inner double-quotes produced by the model (e.g. Chinese "…")
  text = text.replace(/[\u201C\u201D]/g, "'");

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
  const runStartedAt = new Date();
  console.log("SOWISO Scenario Translation Worker");
  console.log(`Mode:    ${FLAG_DRY_RUN ? "DRY RUN — no database writes" : "LIVE — translations will be saved"}`);
  if (FLAG_LANG) console.log(`Filter:  lang = ${FLAG_LANG}`);
  if (FLAG_ID)   console.log(`Filter:  scenario id = ${FLAG_ID}`);
  if (FLAG_FORCE) console.log("Force:   re-translating already-translated scenarios");
  console.log("─".repeat(60));

  // Daily USD budget cap: refuse to start if today's spend is already over.
  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(
      `[scenario-translate] Daily AI budget reached for ${SWEEPER_NAME}: spent $${budget.spent.toFixed(4)} of $${budget.budget}. Skipping run.`,
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

  const conditions = ["1=1"];
  const params = [];

  if (FLAG_ID) {
    params.push(FLAG_ID);
    conditions.push(`id = $${params.length}`);
  }
  if (FLAG_FROM) {
    params.push(FLAG_FROM);
    conditions.push(`id >= $${params.length}`);
  }
  if (FLAG_TO) {
    params.push(FLAG_TO);
    conditions.push(`id <= $${params.length}`);
  }

  const query =
    `SELECT id, title, content_json, title_i18n, content_i18n, social_class ` +
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
  let qualityRewrites = 0;
  let qualScoreSum = 0;
  let qualScoreCount = 0;

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

      // Register-aware system prompt (universal → elite register)
      const systemPrompt = getScenarioPrompt(lang, row.social_class);
      if (!systemPrompt) {
        console.warn(`  [WARN] No system prompt for lang=${lang} register=${row.social_class} — skipping`);
        skipped++;
        continue;
      }

      const registerLabel = row.social_class === "middle_class" ? "mid" : "elite";
      process.stdout.write(`  Translating scenario ${row.id} [${registerLabel}] (${row.title.substring(0, 35)}…) → ${lang} … `);

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

      // Inline quality evaluation on situation field (key user-facing copy)
      let finalSituation = result.content.situation;
      let qualScore = null;
      if (!FLAG_DRY_RUN) {
        const qPrompt = QUALITY_PROMPTS[lang]?.[row.social_class === "middle_class" ? "middle_class" : "elite"];
        if (qPrompt) {
          try {
            const qMsg =
              `Evaluate this ${lang.toUpperCase()} text for register compliance.\n\n` +
              `Text: "${result.content.situation}"\n\n` +
              `Respond ONLY with JSON (no markdown):\n` +
              `{ "pass": true|false, "score": <1-10>, "rewritten": "<corrected if pass=false; original if pass=true>" }`;
            const qRaw = await callAnthropic(qPrompt, qMsg);
            const qClean = qRaw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
            const qParsed = JSON.parse(qClean);
            qualScore = typeof qParsed.score === "number" ? qParsed.score : null;
            if (qualScore !== null && qualScore < 8 && typeof qParsed.rewritten === "string" && qParsed.rewritten.trim()) {
              finalSituation = qParsed.rewritten.trim();
              qualityRewrites++;
              process.stdout.write(`[⚠${qualScore}→rw] `);
            } else if (qualScore !== null) {
              process.stdout.write(`[✓${qualScore}] `);
            }
            if (qualScore !== null) { qualScoreSum += qualScore; qualScoreCount++; }
          } catch { /* quality eval non-blocking */ }
        }
      }

      console.log(`OK → "${result.title}"`);
      if (FLAG_VERBOSE) {
        console.log(`    Situation: ${finalSituation.substring(0, 100)}…`);
      }

      titleI18n[lang]   = result.title;
      contentI18n[lang] = { ...result.content, situation: finalSituation };

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

  const avgQualScore = qualScoreCount > 0 ? Math.round((qualScoreSum / qualScoreCount) * 10) / 10 : null;
  console.log(`Quality rewrites: ${qualityRewrites}/${qualScoreCount}  avg score: ${avgQualScore ?? "n/a"}`);

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
      skipped,
      failed,
      dryRun: FLAG_DRY_RUN,
      from: FLAG_FROM,
      to: FLAG_TO,
      quality_rewrites: qualityRewrites,
      avg_quality_score: avgQualScore,
      quality_checked: qualScoreCount > 0,
    },
  });
  await closeWorkerCostPool();
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
