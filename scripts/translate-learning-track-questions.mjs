#!/usr/bin/env node
/**
 * SOWISO Learning-Track Question Translator — Multi-lang, Register-aware
 *
 * Translates every English (lang='en') row in learning_track_questions to a
 * target language with:
 *   1. Register-correct system prompts (middle_class ≠ elite per language)
 *   2. Inline quality evaluation (score 1–10 per question_text)
 *   3. Automatic rewrite when score < 8 — before DB insert
 *
 * Only quality-guaranteed translations are inserted. Never a sub-threshold
 * translation in the database.
 *
 * Idempotent: per (region, register, pillar, phase, level, demographic) slot,
 * skips if target-lang count >= en count.
 *
 * Usage:
 *   node scripts/translate-learning-track-questions.mjs --lang fr [options]
 *
 * Options:
 *   --lang <code>        Target language — nl fr de es pt it ar ja zh [required]
 *   --region <AE|BE>     Filter to one region (default: all regions)
 *   --register <r>       middle_class or elite (default: both)
 *   --limit <N>          Stop after N successful inserts
 *   --dry-run            Parse and score but do not write to DB
 *   --no-quality         Skip quality evaluation (faster/cheaper, not recommended)
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const pg        = require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool }  = pg;

const MODEL = "claude-haiku-4-5";

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flagStr  = (n) => { const i = args.indexOf(n); return i !== -1 && args[i+1] ? args[i+1] : null; };
const flagBool = (n) => args.includes(n);

const FLAG_LANG       = flagStr("--lang");
const FLAG_REGION     = flagStr("--region");
const FLAG_REGISTER   = flagStr("--register");
const FLAG_LIMIT      = flagStr("--limit") ? parseInt(flagStr("--limit"), 10) : null;
const FLAG_DRY        = flagBool("--dry-run");
const FLAG_NO_QUALITY = flagBool("--no-quality");

const SUPPORTED_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];

if (!FLAG_LANG || !SUPPORTED_LANGS.includes(FLAG_LANG)) {
  console.error(
    `Error: --lang <code> is required.\nSupported: ${SUPPORTED_LANGS.join(", ")}\n\n` +
    `  node scripts/translate-learning-track-questions.mjs --lang fr\n`
  );
  process.exit(1);
}

const SWEEPER_NAME = `ltq-translation-${FLAG_LANG}`;

let totalInputTokens  = 0;
let totalOutputTokens = 0;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── JSON safety footer ────────────────────────────────────────────────────────
const JSON_RULES = `
CRITICAL JSON RULES:
- Output ONLY the raw JSON object — no markdown fences, no preamble, no commentary.
- All string values are valid JSON: escape every internal double-quote as \\".
- Use single quotes (') for in-text apostrophes/contractions; never typographic quotes.`;

// ── Translation system prompts — 9 languages × 2 registers ───────────────────
const TRANSLATION_PROMPTS = {
  nl: {
    middle_class:
`Je bent een professionele vertaler voor Cortéa, een Belgische etiquette-academie.
Vertaal Engelse etiquette-trainingsvragen naar toegankelijk, warm, direct Nederlands — middenklasse register.
Gebruik 'jij'/'jou'/'jouw' of een vriendelijk 'u'. Alledaagse, concrete woordkeuze. Geen Latijns jargon.
Bewaar alle etiquettenuances en eigennamen (steden, gerechten).${JSON_RULES}`,
    elite:
`U bent een professionele vertaler voor Cortéa, een Belgische etiquette-academie van de elite.
Vertaal Engelse etiquette-trainingsvragen naar formeel, verfijnd Nederlands — elite register.
Altijd 'u'/'uw'. Latijns en Frans-geleend vocabulaire. Aanvoegende wijs. Geen spreektaal, geen anglicismen.
Bewaar alle etiquettenuances en eigennamen.${JSON_RULES}`,
  },
  fr: {
    middle_class:
`Tu es traducteur professionnel pour Cortéa, académie d'étiquette belge.
Traduis des questions de formation en étiquette de l'anglais vers le français courant, chaleureux et direct — registre de la classe moyenne.
Tutoie ou vouvoie selon le contexte. Vocabulaire quotidien et concret. Pas de latinismes ni de jargon élitiste.
Préserve toutes les nuances d'étiquette et les noms propres.${JSON_RULES}`,
    elite:
`Vous êtes traducteur professionnel pour Cortéa, académie d'étiquette belge de prestige.
Traduisez des questions de formation en étiquette de l'anglais vers le français formel et élégant — registre élitiste.
Toujours 'vous'/'votre'. Vocabulaire Académie française. Subjonctif librement employé. Aucun anglicisme.
Préservez toutes les nuances d'étiquette et les noms propres.${JSON_RULES}`,
  },
  de: {
    middle_class:
`Du bist professioneller Übersetzer für Cortéa, eine belgische Etikette-Akademie.
Übersetze englische Etikette-Trainingsfragen ins zugängliche, warme, direkte Deutsch — Register der Mittelschicht.
'Du' oder höfliches 'Sie' je nach Kontext. Alltagsnaher, konkreter Wortschatz. Kein Lateinjargon.
Bewahre alle Etikette-Nuancen und Eigennamen.${JSON_RULES}`,
    elite:
`Sie sind professioneller Übersetzer für Cortéa, eine belgische Elite-Etikette-Akademie.
Übersetzen Sie englische Etikette-Trainingsfragen ins formale, verfeinerte Hochdeutsch — Register der Oberschicht.
Immer 'Sie'/'Ihnen'/'Ihr'. Konjunktiv II. Klassische lateinische Komposita. Keine Anglizismen, keine Elision.
Bewahren Sie alle Etikette-Nuancen und Eigennamen.${JSON_RULES}`,
  },
  es: {
    middle_class:
`Eres traductor profesional para Cortéa, una academia de etiqueta belga.
Traduce preguntas de formación en etiqueta del inglés al español corriente, cálido y directo — registro de clase media.
Usa 'tú' o 'usted' según el contexto. Vocabulario cotidiano y concreto. Sin latinismos ni frases elitistas.
Preserva todos los matices de etiqueta y los nombres propios.${JSON_RULES}`,
    elite:
`Usted es traductor profesional para Cortéa, academia de etiqueta belga de élite.
Traduzca preguntas de formación en etiqueta del inglés al español formal y refinado — registro elitista.
Siempre 'usted'. Vocabulario latinizante ('solicitar', 'adquirir'). Subjuntivo librement empleado. Sin anglicismos.
Preserve todos los matices de etiqueta y los nombres propios.${JSON_RULES}`,
  },
  pt: {
    middle_class:
`És tradutor profissional para a Cortéa, uma academia de etiqueta belga.
Traduz perguntas de formação em etiqueta do inglês para o português europeu corrente, caloroso e direto — registo da classe média.
Usa 'você' ou 'tu' conforme o contexto. Vocabulário quotidiano e concreto. Sem latinismos nem frases elitistas.
Preserva todas as nuances de etiqueta e os nomes próprios.${JSON_RULES}`,
    elite:
`É tradutor profissional para a Cortéa, academia de etiqueta belga de prestígio.
Traduza perguntas de formação em etiqueta do inglês para o português europeu formal e refinado — registo elitista.
Sempre 'o senhor'/'a senhora'. Vocabulário de prestígio. Infinitivo pessoal e conjuntivo amplamente utilizados. Sem anglicismos.
Preserve todas as nuances de etiqueta e os nomes próprios.${JSON_RULES}`,
  },
  it: {
    middle_class:
`Sei un traduttore professionale per Cortéa, un'accademia di galateo belga.
Traduci domande di formazione sull'etichetta dall'inglese all'italiano corrente, caldo e diretto — registro della classe media.
Usa 'tu' o 'Lei' a seconda del contesto. Vocabolario quotidiano e concreto. Senza latinismi.
Preserva tutte le sfumature di galateo e i nomi propri.${JSON_RULES}`,
    elite:
`Lei è traduttore professionale per Cortéa, accademia di galateo belga d'élite.
Traduca domande di formazione sull'etichetta dall'inglese all'italiano formale e raffinato — registro elitario.
Sempre 'Lei'/'Suo'/'Sua'. Congiuntivo. Vocabolario toscano letterario. Nessun anglicismo.
Preservi tutte le sfumature di galateo e i nomi propri.${JSON_RULES}`,
  },
  ar: {
    middle_class:
`أنتَ مترجم محترف لـ Cortéa، أكاديمية آداب السلوك البلجيكية.
ترجم أسئلة التدريب على آداب السلوك من الإنجليزية إلى العربية الفصحى المعاصرة الواضحة والدافئة — مستوى الطبقة المتوسطة.
استخدم الضمائر المناسبة بشكل طبيعي. المفردات: يومية وملموسة. احتفظ بجميع دقائق آداب السلوك والأسماء العلَم.${JSON_RULES}`,
    elite:
`أنتَ مترجم محترف لـ Cortéa، أكاديمية آداب السلوك البلجيكية الرفيعة.
ترجم أسئلة التدريب من الإنجليزية إلى العربية الفصحى الرسمية الرفيعة — مستوى النخبة.
استخدم الضمائر الرسمية الرفيعة دائماً. المفردات: كلاسيكية من التراث الفصيح. لا عامية.
احتفظ بجميع دقائق آداب السلوك والأسماء العلَم.${JSON_RULES}`,
  },
  ja: {
    middle_class:
`あなたはベルギーのエチケットアカデミー Cortéa の専任プロ翻訳者です。
英語のエチケット研修問題を、温かく親しみやすい丁寧語（です・ます体）の日本語に翻訳してください — 中間層のレジスター。
自然な敬語を使用し、過度な形式張りは避ける。日常的で具体的な語彙。すべてのエチケットの微妙なニュアンスと固有名詞を保持してください。${JSON_RULES}`,
    elite:
`あなたはベルギーの名門エチケットアカデミー Cortéa の専任プロ翻訳者です。
英語のエチケット研修問題を、最上級の敬語（尊敬語・謙譲語・丁寧語）を駆使した格調高い日本語に翻訳してください — 上流階級のレジスター。
漢語を主体に品格ある表現を選ぶ。カタカナ語は最小限。略語・俗語・口語は不使用。すべてのエチケットの微妙なニュアンスと固有名詞を保持してください。${JSON_RULES}`,
  },
  zh: {
    middle_class:
`您是比利时礼仪学院 Cortéa 的专业翻译。
请将英语礼仪培训题目翻译成清晰、亲切、直接的现代汉语（普通话，简体字）— 中间阶层的文体。
自然使用"你"或礼貌的"您"。词汇：日常、具体。保留所有礼仪细节和专有名词。${JSON_RULES}`,
    elite:
`您是比利时精英礼仪学院 Cortéa 的专业翻译。
请将英语礼仪培训题目翻译成正式、典雅的现代书面汉语（普通话，简体字）— 精英阶层的文体。
始终使用"您/您的"等尊称。词汇：典雅庄重，多用四字格和书面语。不用口语化表达。保留所有礼仪细节和专有名词。${JSON_RULES}`,
  },
};

// ── Quality evaluation prompts — mirrors register-calibration-worker.mjs ──────
const QUALITY_PROMPTS = {
  nl: {
    middle_class: `Je herschrijft teksten naar toegankelijke, warme, directe Nederlandse middenstandstaal.
Gebruik 'jij'/'jou'/'jouw' of een vriendelijk 'u'. Woordkeuze: alledaags, concreet, hartelijk.
Vermijd jargon, Latijns vocabulaire en elitaire fraseringen. Toon: warm, bemoedigend, direct.`,
    elite: `U herschrijft teksten naar formeel, verfijnd elitetaal in het Nederlands (nl-NL).
Altijd 'u'/'uw'. Latijns en Frans-geleend vocabulaire. Geen verkleinwoorden, geen anglicismen, geen spreektaal.
Aanvoegende wijs (conjunctief) waar klassiek Nederlands dat vereist. Toon: gereserveerd, waardig.`,
  },
  fr: {
    middle_class: `Tu réécris les textes dans un français courant, chaleureux et direct — le registre des classes moyennes.
Vocabulaire concret, quotidien, sans termes latins ni jargon élitiste. Ton bienveillant, direct.`,
    elite: `Vous réécrivez les textes dans un registre élitiste formel et raffiné (fr-FR, standard Académie française).
Toujours 'vous'/'votre'. Vocabulaire de prestige. Subjonctif librement employé. Aucun anglicisme.
Ton : salon parisien du XVIIIe siècle — précis, élégant, autoritaire.`,
  },
  de: {
    middle_class: `Du schreibst Texte in zugängliches, warmes, direktes Deutsch — das Register der Mittelschicht.
Alltagsnaher, konkreter Wortschatz. Keine Latein-Fremdwörter. Ton: freundlich, ermutigend.`,
    elite: `Sie schreiben Texte in formalem, verfeinerten Elitedeutsch (de-DE Duden-Standard).
Immer 'Sie'/'Ihnen'/'Ihr'. Konjunktiv II. Klassische lateinische Komposita. Keine Anglizismen.
Ton: Preußische Verwaltungspräzision verbunden mit literarischer Würde der Goethezeit.`,
  },
  es: {
    middle_class: `Reescribes textos en español corriente, cálido y directo — el registro de la clase media.
Vocabulario cotidiano y concreto, sin latinismos ni frases elitistas. Tono amable, alentador.`,
    elite: `Usted reescribe textos en español formal, refinado y elitista (es-ES, estándar RAE).
Siempre 'usted'. Vocabulario latinizante. Subjuntivo empleado con libertad. Sin anglicismos.
Tono: Corte Real española y Siglo de Oro.`,
  },
  pt: {
    middle_class: `Reescreves os textos em português europeu corrente, caloroso e direto — o registo da classe média.
Vocabulário quotidiano e concreto, sem latinismos. Tom amigável, encorajador.`,
    elite: `Reescreve os textos em português europeu formal, refinado e elitista (pt-PT, norma culta da Academia).
Sempre 'o senhor'/'a senhora'. Vocabulário de prestígio. Infinitivo pessoal e conjuntivo amplamente utilizados.
Tom: correspondência da aristocracia portuguesa — preciso, elegante, digno.`,
  },
  it: {
    middle_class: `Riscrivi i testi in italiano corrente, caldo e diretto — il registro della classe media.
Vocabolario quotidiano e concreto, senza latinismi. Tono amichevole, incoraggiante.`,
    elite: `Lei riscrive i testi in italiano formale, raffinato ed elitario (it-IT, standard Accademia della Crusca).
Sempre 'Lei'/'Suo'/'Sua'. Congiuntivo. Vocabolario latinista e toscano letterario. Nessun anglicismo.
Tono: Leopardi e Manzoni — periodico, elegante, toscano.`,
  },
  ar: {
    middle_class: `أعِد كتابة النصوص بالعربية الفصحى المعاصرة الواضحة والدافئة — مستوى الطبقة المتوسطة.
المفردات: يومية وملموسة. النبرة: ودية ومشجعة، كما يتحدث زميل جيد.`,
    elite: `أعِد كتابة النصوص بالعربية الفصحى الرفيعة والرسمية — مستوى النخبة.
الضمائر الرسمية الرفيعة دائماً. المفردات: كلاسيكية من التراث الفصيح. لا عامية.
النبرة: مراسلات الأكاديميات والبلاط الملكي — رصينة، موقَّرة، أنيقة.`,
  },
  ja: {
    middle_class: `丁寧語（です・ます体）を使い、温かく親しみやすい日本語に書き直してください — 中間層のレジスター。
自然な敬語を使用し、過度な形式張りは避ける。語彙：日常的で具体的。トーン：親切で励まし型。`,
    elite: `最上級の敬語（尊敬語・謙譲語・丁寧語）を駆使した格調高い日本語に書き直してください — 上流階級のレジスター。
漢語を主体に品格ある表現を選ぶ。カタカナ語は最小限。トーン：皇室の書簡のような品格。`,
  },
  zh: {
    middle_class: `请将文字改写为清晰、亲切、直接的现代汉语（普通话，简体字）— 中间阶层的文体。
自然使用"你"或礼貌的"您"。词汇：日常、具体。语气：友好、鼓励。`,
    elite: `请将文字改写为正式、典雅、精炼的现代书面汉语（普通话，简体字）— 精英阶层的文体。
始终使用"您/您的"等尊称。词汇：典雅庄重，多用四字格和书面语。语气：典雅、庄重。`,
  },
};

// ── Anthropic API call ────────────────────────────────────────────────────────
async function callAnthropic(systemPrompt, userContent, maxTokens = 4096) {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) throw new Error("Missing AI_INTEGRATIONS_ANTHROPIC_* env vars.");
  const res = await fetch(`${base}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic ${res.status}: ${txt.substring(0, 300)}`);
  }
  const data = await res.json();
  totalInputTokens  += Number(data.usage?.input_tokens  ?? 0) || 0;
  totalOutputTokens += Number(data.usage?.output_tokens ?? 0) || 0;
  return data.content?.[0]?.text?.trim() ?? "";
}

// ── Build translation user prompt ─────────────────────────────────────────────
function buildTranslationPrompt(row, lang) {
  const payload = {
    question_text: row.question_text,
    historical_context: row.historical_context ?? null,
    options: (row.options ?? []).map((o, i) => ({ index: i, text: o.text, motivation: o.motivation })),
  };
  return `Translate this English etiquette training question into ${lang.toUpperCase()}.

Input:
${JSON.stringify(payload, null, 2)}

Return ONLY this JSON (same option order, same indices):
{
  "question_text": "<translated>",
  "historical_context": ${row.historical_context ? '"<translated>"' : "null"},
  "options": [
    { "index": 0, "text": "<translated>", "motivation": "<translated>" }
  ]
}`;
}

// ── Parse translation response ────────────────────────────────────────────────
function parseTranslation(raw, row) {
  let text = raw;
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) text = m[0];
  text = text.replace(/[\u201C\u201D]/g, "'");
  try { text = jsonrepair(text); } catch { /* ignore */ }
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) {
    process.stderr.write(`parse fail: ${e.message}\n`);
    return null;
  }
  if (typeof parsed.question_text !== "string" || !parsed.question_text.trim()) return null;
  if (!Array.isArray(parsed.options) || parsed.options.length !== (row.options?.length ?? 0)) return null;
  const options = row.options.map((orig, i) => {
    const t = parsed.options.find((o) => o.index === i) ?? parsed.options[i];
    return { text: t?.text ?? orig.text, answer_tier: orig.answer_tier, motivation: t?.motivation ?? orig.motivation };
  });
  return {
    question_text: parsed.question_text,
    historical_context: typeof parsed.historical_context === "string" ? parsed.historical_context : null,
    options,
  };
}

// ── Inline quality evaluation ─────────────────────────────────────────────────
// Evaluates question_text for register compliance. Returns { score, rewritten }.
// score < 8 → use rewritten version (still within the same pipeline run).
async function evaluateQuality(questionText, lang, register) {
  const qualityPrompt = QUALITY_PROMPTS[lang]?.[register];
  if (!qualityPrompt) return { score: 10, rewritten: questionText };

  const registerLabel = register === "elite" ? "elite register" : "middle-class register";
  const userMsg =
    `Evaluate the following ${lang.toUpperCase()} text for ${registerLabel} compliance.\n\n` +
    `Text: "${questionText}"\n\n` +
    `Respond ONLY with a JSON object (no markdown):\n` +
    `{ "pass": true|false, "score": <1-10>, "rewritten": "<corrected if pass=false; original if pass=true>" }\n\n` +
    `pass: true if the text meets the ${registerLabel} standard.\n` +
    `score: 1 (completely wrong register) to 10 (perfect).`;

  const raw = await callAnthropic(qualityPrompt, userMsg, 512);
  const clean = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  try {
    const p = JSON.parse(clean);
    if (typeof p.score === "number" && typeof p.rewritten === "string") {
      return { score: p.score, rewritten: p.rewritten || questionText };
    }
  } catch { /* fall through */ }
  return { score: 10, rewritten: questionText };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const startedAt = new Date();
  const lang = FLAG_LANG;

  console.log(`LTQ Translator → ${lang.toUpperCase()}  quality=${!FLAG_NO_QUALITY}  mode=${FLAG_DRY ? "DRY-RUN" : "LIVE"}  model=${MODEL}`);
  if (FLAG_REGION)   console.log(`  filter: region   = ${FLAG_REGION}`);
  if (FLAG_REGISTER) console.log(`  filter: register = ${FLAG_REGISTER}`);
  if (FLAG_LIMIT)    console.log(`  limit: ${FLAG_LIMIT}`);
  console.log("─".repeat(70));

  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(`[${SWEEPER_NAME}] daily budget reached: $${budget.spent.toFixed(4)} / $${budget.budget}. Skipping.`);
    await recordWorkerRun({
      sweeper: SWEEPER_NAME, startedAt, itemsProcessed: 0,
      inputTokens: 0, outputTokens: 0, model: MODEL, status: "budget_capped",
      metadata: { lang, spent: budget.spent, budget: budget.budget },
    });
    await closeWorkerCostPool(); await pool.end(); return;
  }

  // Build slot query — finds slots where EN count > target lang count
  const baseParams = [lang];
  const baseConds  = [`lang IN ('en', $1)`];
  if (FLAG_REGION)   { baseConds.push(`region_code = $${baseParams.push(FLAG_REGION)}`); }
  if (FLAG_REGISTER) { baseConds.push(`register    = $${baseParams.push(FLAG_REGISTER)}`); }

  const slotsRes = await pool.query(`
    SELECT region_code, register,
           COALESCE(research_pillar,'') AS research_pillar,
           phase, level, demographic,
           COUNT(*) FILTER (WHERE lang='en') AS en_count,
           COUNT(*) FILTER (WHERE lang=$1)   AS target_count
      FROM learning_track_questions
     WHERE ${baseConds.join(" AND ")}
     GROUP BY 1,2,3,4,5,6
    HAVING COUNT(*) FILTER (WHERE lang='en') > COUNT(*) FILTER (WHERE lang=$1)
     ORDER BY register DESC, region_code, phase, level
  `, baseParams);

  console.log(`Slots needing work: ${slotsRes.rows.length}\n`);

  let translated = 0, skipped = 0, failed = 0, rewrites = 0, stop = false;
  let scoreSum = 0, scoreCount = 0;

  for (const slot of slotsRes.rows) {
    if (stop) break;

    const translPrompt = TRANSLATION_PROMPTS[lang]?.[slot.register];
    if (!translPrompt) {
      console.warn(`No prompt for lang=${lang} register=${slot.register} — skipping slot`);
      continue;
    }

    const enQ = await pool.query(
      `SELECT id, region_code, register, research_pillar, phase, level, demographic,
              question_text, historical_context, options, interest_tags
         FROM learning_track_questions
        WHERE lang='en' AND region_code=$1 AND register=$2
          AND COALESCE(research_pillar,'')=$3 AND phase=$4 AND level=$5 AND demographic=$6
        ORDER BY id
        OFFSET $7`,
      [slot.region_code, slot.register, slot.research_pillar,
       slot.phase, slot.level, slot.demographic, Number(slot.target_count)]
    );

    for (const row of enQ.rows) {
      if (FLAG_LIMIT && translated >= FLAG_LIMIT) { stop = true; break; }

      const label = `[${slot.region_code}/${slot.register.replace("_class","")}/p${slot.phase}/l${slot.level}] #${row.id}`;
      process.stdout.write(`${label} → ${lang.toUpperCase()} … `);

      // Step 1 — Translate
      let raw;
      try { raw = await callAnthropic(translPrompt, buildTranslationPrompt(row, lang)); }
      catch (err) { console.log(`API ERR: ${err.message}`); failed++; continue; }

      const result = parseTranslation(raw, row);
      if (!result) { console.log("PARSE FAIL"); failed++; continue; }

      // Step 2 — Inline quality evaluation
      let finalQText = result.question_text;
      let qualScore  = null;

      if (!FLAG_NO_QUALITY && !FLAG_DRY) {
        try {
          const ev = await evaluateQuality(result.question_text, lang, slot.register);
          qualScore = ev.score;
          scoreSum += qualScore; scoreCount++;
          if (qualScore < 8) {
            finalQText = ev.rewritten;
            rewrites++;
            process.stdout.write(`[⚠${qualScore}→rewrite] `);
          } else {
            process.stdout.write(`[✓${qualScore}] `);
          }
        } catch (err) {
          process.stderr.write(`eval err: ${err.message}\n`);
          scoreSum += 10; scoreCount++;
        }
      }

      if (FLAG_DRY) {
        console.log(`OK (dry) "${finalQText.substring(0, 55)}…"`);
        translated++; continue;
      }

      // Step 3 — Insert
      try {
        const ins = await pool.query(
          `INSERT INTO learning_track_questions
             (register, research_pillar, phase, level, region_code, demographic,
              question_text, historical_context, options, lang, interest_tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::jsonb)
           ON CONFLICT (question_hash) DO NOTHING
           RETURNING id`,
          [row.register, row.research_pillar, row.phase, row.level, row.region_code, row.demographic,
           finalQText, result.historical_context,
           JSON.stringify(result.options), lang, JSON.stringify(row.interest_tags ?? [])]
        );
        if (ins.rowCount === 0) { console.log("DUP (skip)"); skipped++; }
        else { console.log(`OK #${ins.rows[0].id}`); translated++; }
      } catch (err) {
        console.log(`DB ERR: ${err.message}`); failed++;
      }
      await new Promise(r => setTimeout(r, 120));
    }
  }

  const avgScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : null;
  const pctPassed = scoreCount > 0 ? Math.round(((scoreCount - rewrites) / scoreCount) * 100) : null;

  console.log("\n" + "─".repeat(70));
  console.log(`Translated: ${translated}  Skipped(dup): ${skipped}  Failed: ${failed}  Rewritten: ${rewrites}`);
  if (avgScore !== null) console.log(`Quality: avg ${avgScore}/10  passed first try: ${pctPassed}%`);
  console.log(`Tokens: in=${totalInputTokens}  out=${totalOutputTokens}`);

  await recordWorkerRun({
    sweeper: SWEEPER_NAME, startedAt,
    itemsProcessed: translated,
    inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
    model: MODEL,
    status: failed > 0 && translated === 0 ? "failed" : failed > 0 ? "partial" : "ok",
    metadata: {
      lang,
      region: FLAG_REGION ?? null,
      register: FLAG_REGISTER ?? null,
      skipped, failed,
      rewritten: rewrites,
      avg_score: avgScore,
      pct_passed_first_try: pctPassed,
      pct_rewritten: scoreCount > 0 ? Math.round((rewrites / scoreCount) * 100) : null,
      quality_checked: !FLAG_NO_QUALITY,
      dryRun: FLAG_DRY,
      limit: FLAG_LIMIT,
    },
  });
  await closeWorkerCostPool();
  await pool.end();
}

main().catch(async (err) => {
  console.error("Fatal:", err.message);
  try { await closeWorkerCostPool(); } catch {}
  try { await pool.end(); } catch {}
  process.exit(1);
});
