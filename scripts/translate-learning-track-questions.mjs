#!/usr/bin/env node
/**
 * SOWISO Learning-Track Question NL Translator
 *
 * Translates every English (lang='en') row in learning_track_questions to
 * Dutch (lang='nl'), inserting a new row that mirrors the source row but with
 * NL question_text, historical_context, options[*].text, options[*].motivation.
 *
 * Idempotent at slot granularity: for each (region, register, pillar, phase,
 * level, demographic) "slot", if NL row count >= EN row count we skip.
 *
 * Usage:
 *   node scripts/translate-learning-track-questions.mjs [--limit N] [--dry-run]
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

const SWEEPER_NAME = "ltq-translation";
const MODEL = "claude-haiku-4-5";

let totalInputTokens = 0;
let totalOutputTokens = 0;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const pg = require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool } = pg;

const args = process.argv.slice(2);
const FLAG_LIMIT = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1], 10) : null;
const FLAG_DRY = args.includes("--dry-run");

const SYSTEM_PROMPT = `You are a professional translator for SOWISO, an elite Belgian-rooted etiquette academy.
Translate English etiquette training questions into formal Dutch (Nederlands).
Register: dignified, measured, "u/uw" forms, Latinate vocabulary, no anglicisms, no curly quotes.
Preserve all etiquette nuance, cultural specificity, and proper nouns (city names, dish names, etc.) untranslated where they are loanwords.

CRITICAL JSON RULES:
- Output ONLY the raw JSON object — no markdown fences, no preamble, no commentary.
- All string values are valid JSON: escape every internal double-quote as \\".
- Use single quotes (') for in-text apostrophes/contractions; never typographic quotes.`;

function userPrompt(row) {
  const payload = {
    question_text: row.question_text,
    historical_context: row.historical_context ?? null,
    options: (row.options ?? []).map((o, i) => ({
      index: i,
      text: o.text,
      motivation: o.motivation,
    })),
  };
  return `Translate this etiquette training question to formal Dutch.

Input:
${JSON.stringify(payload, null, 2)}

Return ONLY this JSON shape (same option order, same indices, NO answer_tier field):
{
  "question_text": "<NL>",
  "historical_context": ${row.historical_context ? '"<NL>"' : "null"},
  "options": [
    { "index": 0, "text": "<NL>", "motivation": "<NL>" }
  ]
}`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function callAnthropic(system, user) {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
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
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic ${res.status}: ${txt.substring(0, 300)}`);
  }
  const data = await res.json();
  totalInputTokens += Number(data.usage?.input_tokens ?? 0) || 0;
  totalOutputTokens += Number(data.usage?.output_tokens ?? 0) || 0;
  return data.content?.[0]?.text?.trim() ?? "";
}

function parseTranslation(raw, row) {
  let text = raw;
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) text = m[0];
  try { text = jsonrepair(text); } catch { /* let JSON.parse complain */ }
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) {
    process.stderr.write(`parse fail: ${e.message}\n`);
    return null;
  }
  if (typeof parsed.question_text !== "string" || !parsed.question_text.trim()) return null;
  if (!Array.isArray(parsed.options) || parsed.options.length !== (row.options?.length ?? 0)) return null;
  const options = row.options.map((orig, i) => {
    const t = parsed.options.find((o) => o.index === i) ?? parsed.options[i];
    return {
      text: t?.text ?? orig.text,
      answer_tier: orig.answer_tier,
      motivation: t?.motivation ?? orig.motivation,
    };
  });
  return {
    question_text: parsed.question_text,
    historical_context: typeof parsed.historical_context === "string" ? parsed.historical_context : null,
    options,
  };
}

async function main() {
  const startedAt = new Date();
  console.log("LTQ NL Translator");
  console.log(`Mode: ${FLAG_DRY ? "DRY-RUN" : "LIVE"}  Model: ${MODEL}`);
  console.log("─".repeat(60));

  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(`[ltq-translate] daily budget reached: $${budget.spent.toFixed(4)} / $${budget.budget}. Skipping.`);
    await recordWorkerRun({
      sweeper: SWEEPER_NAME, startedAt, itemsProcessed: 0,
      inputTokens: 0, outputTokens: 0, model: MODEL, status: "budget_capped",
      metadata: { spent: budget.spent, budget: budget.budget },
    });
    await closeWorkerCostPool(); await pool.end(); return;
  }

  // Compute slots that still need work: EN > NL count.
  const slotsRes = await pool.query(`
    SELECT region_code, register, COALESCE(research_pillar,'') AS research_pillar,
           phase, level, demographic,
           COUNT(*) FILTER (WHERE lang='en') AS en_count,
           COUNT(*) FILTER (WHERE lang='nl') AS nl_count
      FROM learning_track_questions
     GROUP BY 1,2,3,4,5,6
    HAVING COUNT(*) FILTER (WHERE lang='en') > COUNT(*) FILTER (WHERE lang='nl')
     ORDER BY 1,2,4,5
  `);
  console.log(`Slots needing work: ${slotsRes.rows.length}`);

  let translated = 0, skipped = 0, failed = 0;
  let stop = false;

  for (const slot of slotsRes.rows) {
    if (stop) break;
    const enQ = await pool.query(
      `SELECT id, region_code, register, research_pillar, phase, level, demographic,
              question_text, historical_context, options, interest_tags
         FROM learning_track_questions
        WHERE lang='en' AND region_code=$1 AND register=$2
          AND COALESCE(research_pillar,'')=$3 AND phase=$4 AND level=$5 AND demographic=$6
        ORDER BY id
        OFFSET $7`,
      [slot.region_code, slot.register, slot.research_pillar,
       slot.phase, slot.level, slot.demographic, Number(slot.nl_count)]
    );

    for (const row of enQ.rows) {
      if (FLAG_LIMIT && translated >= FLAG_LIMIT) { stop = true; break; }
      process.stdout.write(
        `[${slot.region_code}/${slot.register}/p${slot.phase}/l${slot.level}/${slot.demographic}] #${row.id} → NL … `
      );
      let raw;
      try { raw = await callAnthropic(SYSTEM_PROMPT, userPrompt(row)); }
      catch (err) { console.log(`API ERR: ${err.message}`); failed++; continue; }

      const result = parseTranslation(raw, row);
      if (!result) { console.log("PARSE FAIL"); failed++; continue; }

      if (FLAG_DRY) {
        console.log(`OK (dry) "${result.question_text.substring(0, 60)}…"`);
        translated++; continue;
      }

      try {
        const ins = await pool.query(
          `INSERT INTO learning_track_questions
             (register, research_pillar, phase, level, region_code, demographic,
              question_text, historical_context, options, lang, interest_tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'nl',$10::jsonb)
           ON CONFLICT (question_hash) DO NOTHING
           RETURNING id`,
          [row.register, row.research_pillar, row.phase, row.level, row.region_code, row.demographic,
           result.question_text, result.historical_context,
           JSON.stringify(result.options), JSON.stringify(row.interest_tags ?? [])]
        );
        if (ins.rowCount === 0) { console.log("DUP (skip)"); skipped++; }
        else { console.log(`OK #${ins.rows[0].id}`); translated++; }
      } catch (err) {
        console.log(`DB ERR: ${err.message}`); failed++;
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  console.log("─".repeat(60));
  console.log(`Translated: ${translated}  Skipped(dup): ${skipped}  Failed: ${failed}`);
  console.log(`Tokens: in=${totalInputTokens}  out=${totalOutputTokens}`);

  await recordWorkerRun({
    sweeper: SWEEPER_NAME, startedAt,
    itemsProcessed: translated,
    inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
    model: MODEL,
    status: failed > 0 ? "partial" : "ok",
    metadata: { skipped, failed, dryRun: FLAG_DRY, limit: FLAG_LIMIT },
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
