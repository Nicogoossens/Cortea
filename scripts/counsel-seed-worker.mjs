#!/usr/bin/env node
/**
 * SOWISO Counsel Seed Worker
 *
 * Distils Atelier learning_track_questions for a given region into structured
 * Counsel-domain knowledge seeds, then evaluates them with a second Claude
 * pass and stores the result in `counsel_region_seeds` (status: draft).
 *
 * Usage:
 *   node scripts/counsel-seed-worker.mjs --region <code> [flags]
 *
 * Flags:
 *   --region <code>    Target region code (required, e.g. AE, JP)
 *   --domain <name>    Only one domain (gastronomy, business, eloquence,
 *                      formal_events, dress_code, cultural_knowledge)
 *   --max-questions <n> Cap on questions sampled per domain (default: 60)
 *   --skip-eval        Skip the second-pass evaluation
 *   --dry-run          Print the distillate, do not write to DB
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

const SWEEPER_NAME = "counsel-seed";
const MODEL = "claude-haiku-4-5";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require = createRequire(import.meta.url);
const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const pg = _require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool } = pg;

// ── CLI ────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const FLAG_REGION   = (flag("--region") ?? "").toUpperCase();
const FLAG_DOMAIN   = flag("--domain");
const FLAG_MAX      = flag("--max-questions") ? parseInt(flag("--max-questions"), 10) : 60;
const FLAG_SKIP_EVAL = args.includes("--skip-eval");
const FLAG_DRY_RUN  = args.includes("--dry-run");

if (!FLAG_REGION) {
  console.error("Error: --region is required");
  process.exit(1);
}

// Counsel domains (must match VALID_COUNSEL_DOMAINS in routes/counsel.ts).
const COUNSEL_DOMAINS = [
  "gastronomy",
  "business",
  "eloquence",
  "formal_events",
  "dress_code",
  "cultural_knowledge",
];

/**
 * Map Counsel domains to the research_pillar(s) most likely to contain
 * relevant Atelier questions. Each domain pulls from one or two pillars.
 *
 * Pillar themes:
 *   P1 — communication / correspondence / digital
 *   P2 — hospitality / dining / gifting
 *   P3 — dress / grooming / presence
 *   P4 — status / hierarchy / business etiquette
 *   P5 — public conduct / ceremonies (when present)
 */
const DOMAIN_TO_PILLARS = {
  gastronomy:          ["P2"],
  business:            ["P1", "P4"],
  eloquence:           ["P1"],
  formal_events:       ["P4", "P5"],
  dress_code:          ["P3"],
  cultural_knowledge:  ["P5", "P2"],
};

let totalInputTokens = 0;
let totalOutputTokens = 0;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Anthropic ──────────────────────────────────────────────────────────────────
async function callAnthropic(systemPrompt, userPrompt, maxTokens = 4096) {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) throw new Error("Anthropic env vars missing");
  const response = await fetch(`${base}/messages`, {
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
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);
  const data = await response.json();
  totalInputTokens  += Number(data.usage?.input_tokens  ?? 0) || 0;
  totalOutputTokens += Number(data.usage?.output_tokens ?? 0) || 0;
  return data.content?.[0]?.text?.trim() ?? "";
}

function parseJson(raw) {
  let text = raw;
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) text = m[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  try { text = jsonrepair(text); } catch { /* ignore */ }
  return JSON.parse(text);
}

// ── Fetch Atelier Q&A for a domain ─────────────────────────────────────────────
async function fetchQuestionsForDomain(regionCode, domain) {
  const pillars = DOMAIN_TO_PILLARS[domain] ?? [];
  if (pillars.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT register, research_pillar, level, question_text, options
       FROM learning_track_questions
      WHERE region_code = $1
        AND research_pillar = ANY($2::text[])
        AND lang = 'en'
      ORDER BY RANDOM()
      LIMIT $3`,
    [regionCode, pillars, FLAG_MAX],
  );
  return rows;
}

// ── Build distillation prompt ──────────────────────────────────────────────────
const DOMAIN_DESCRIPTIONS = {
  gastronomy:         "fine dining, hosting, gifting, alcohol, table manners",
  business:           "boardroom conduct, negotiation, client relations, professional hierarchy",
  eloquence:          "speech, written correspondence, digital messaging, registers of address",
  formal_events:      "galas, ceremonies, state functions, weddings, religious observances",
  dress_code:         "appropriate attire, grooming, public appearance, formal wear",
  cultural_knowledge: "cultural traditions, faith-adjacent customs, taboos, history-as-etiquette",
};

function buildDistillPrompt(regionCode, domain, questions) {
  const desc = DOMAIN_DESCRIPTIONS[domain] ?? domain;
  const qaBlock = questions.map((q, i) => {
    const tier1 = (q.options ?? []).find((o) => o.answer_tier === 1);
    const tier3 = (q.options ?? []).find((o) => o.answer_tier === 3);
    return `Q${i + 1} (${q.register}/${q.research_pillar}/L${q.level}): ${q.question_text}
  RIGHT MOVE: ${tier1?.text ?? "(none)"}
  WRONG MOVE: ${tier3?.text ?? "(none)"}`;
  }).join("\n\n");

  const system = `You are a senior etiquette researcher. Distil the following ${regionCode} Atelier Q&A about "${domain}" (${desc}) into a concise, actionable knowledge base for an etiquette mentor's reference.

Return ONLY a single JSON object with this exact shape, no markdown fences:
{
  "summary":         "1-2 sentences framing how ${regionCode} treats this domain",
  "principles":      ["3-6 culturally specific guiding principles, each one sentence"],
  "do_examples":     ["3-6 concrete recommended behaviours, each one short sentence"],
  "avoid_examples":  ["3-6 concrete behaviours to avoid, each one short sentence"],
  "register_notes":  "1-2 sentences on tone, formality, register conventions for this domain in ${regionCode}"
}

Stay strictly within ${regionCode}. Synthesise across the questions; do not quote them verbatim. Be concrete, not preachy. Use ASCII quotes only inside string values.`;

  const user = `Atelier Q&A for ${regionCode} / ${domain} (${questions.length} items):\n\n${qaBlock}\n\nProduce the distillate now.`;

  return { system, user };
}

// ── Build evaluation prompt (second pass) ──────────────────────────────────────
function buildEvalPrompt(regionCode, domain, distillate) {
  const system = `You are an etiquette content reviewer. Score the following knowledge distillate for ${regionCode} / ${domain} on three axes:
- completeness    (0-100): does it cover the domain breadth?
- register fit    (0-100): is the tone calibrated for an elevated etiquette mentor?
- setting coverage(0-100): does it cover the realistic settings (formal/informal, business/social) one encounters in this domain?

Return ONLY this JSON object, no fences:
{
  "completeness":    <0-100 integer>,
  "register_fit":    <0-100 integer>,
  "setting_coverage":<0-100 integer>,
  "overall":         <0-100 integer, the average rounded to integer>,
  "notes":           "1-2 sentences flagging weaknesses or gaps; empty string if none"
}`;
  const user = `Region: ${regionCode}\nDomain: ${domain}\n\nDistillate:\n${JSON.stringify(distillate, null, 2)}\n\nScore now.`;
  return { system, user };
}

// ── Upsert ─────────────────────────────────────────────────────────────────────
async function upsertSeed(regionCode, domain, content, evalResult) {
  const evalScore = evalResult ? Number(evalResult.overall ?? 0) : null;
  const evalNotes = evalResult ? String(evalResult.notes ?? "") : null;
  const reviewedAt = evalResult ? new Date() : null;
  const { rows } = await pool.query(
    `INSERT INTO counsel_region_seeds
       (region_code, domain, content, eval_score, eval_notes, status, seeded_at, reviewed_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, 'draft', NOW(), $6)
     ON CONFLICT (region_code, domain) DO UPDATE SET
       content = EXCLUDED.content,
       eval_score = EXCLUDED.eval_score,
       eval_notes = EXCLUDED.eval_notes,
       seeded_at = NOW(),
       reviewed_at = EXCLUDED.reviewed_at,
       -- preserve 'active' status; only revert to draft if it was draft/reviewed
       status = CASE
         WHEN counsel_region_seeds.status = 'active' THEN 'active'
         ELSE 'draft'
       END
     RETURNING id, status`,
    [regionCode, domain, JSON.stringify(content), evalScore, evalNotes, reviewedAt],
  );
  return rows[0];
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const runStartedAt = new Date();
  console.log("SOWISO Counsel Seed Worker");
  console.log(`Region: ${FLAG_REGION}`);
  console.log(`Mode  : ${FLAG_DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log("─".repeat(60));

  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(`[counsel-seed] Daily budget reached: $${budget.spent.toFixed(4)} of $${budget.budget}.`);
    await recordWorkerRun({
      sweeper: SWEEPER_NAME, startedAt: runStartedAt, status: "budget_capped", model: MODEL,
      metadata: { region: FLAG_REGION, spent: budget.spent, budget: budget.budget },
    });
    await closeWorkerCostPool();
    await pool.end();
    return;
  }

  const domains = FLAG_DOMAIN ? [FLAG_DOMAIN] : COUNSEL_DOMAINS;
  const invalid = domains.filter((d) => !COUNSEL_DOMAINS.includes(d));
  if (invalid.length > 0) {
    console.error(`Invalid domain(s): ${invalid.join(", ")}`);
    process.exit(1);
  }

  let drafts = 0;
  let evaluated = 0;
  let failed = 0;

  for (const domain of domains) {
    console.log(`\n[${domain}] gathering questions…`);
    const questions = await fetchQuestionsForDomain(FLAG_REGION, domain);
    if (questions.length === 0) {
      console.log(`  ! no questions found for ${FLAG_REGION} pillars=${(DOMAIN_TO_PILLARS[domain] ?? []).join(",")} — skipping`);
      continue;
    }
    console.log(`  fetched ${questions.length} Q&A items`);

    const { system: ds, user: du } = buildDistillPrompt(FLAG_REGION, domain, questions);
    let distillate;
    try {
      const raw = await callAnthropic(ds, du, 4096);
      distillate = parseJson(raw);
    } catch (err) {
      console.log(`  ! distillation error: ${err.message}`);
      failed++;
      continue;
    }
    console.log(`  ✓ distilled: ${(distillate.summary ?? "").substring(0, 80)}…`);

    let evalResult = null;
    if (!FLAG_SKIP_EVAL) {
      try {
        const { system: es, user: eu } = buildEvalPrompt(FLAG_REGION, domain, distillate);
        const rawEval = await callAnthropic(es, eu, 512);
        evalResult = parseJson(rawEval);
        evaluated++;
        console.log(`  ✓ eval: overall=${evalResult.overall} (complete=${evalResult.completeness}, reg=${evalResult.register_fit}, settings=${evalResult.setting_coverage})`);
      } catch (err) {
        console.log(`  ! eval error: ${err.message} — will save distillate without score`);
      }
    }

    if (FLAG_DRY_RUN) {
      console.log(`  DRY RUN — would write seed`);
      console.log(JSON.stringify(distillate, null, 2));
      continue;
    }

    try {
      const row = await upsertSeed(FLAG_REGION, domain, distillate, evalResult);
      console.log(`  ✓ upserted seed id=${row.id} status=${row.status}`);
      drafts++;
    } catch (err) {
      console.log(`  ! upsert error: ${err.message}`);
      failed++;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Seeds written: ${drafts}   Evaluated: ${evaluated}   Failed: ${failed}`);
  console.log(`Tokens — input: ${totalInputTokens}   output: ${totalOutputTokens}`);

  await recordWorkerRun({
    sweeper: SWEEPER_NAME,
    startedAt: runStartedAt,
    itemsProcessed: drafts,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    model: MODEL,
    status: failed > 0 ? "partial" : "ok",
    metadata: { region: FLAG_REGION, domains, dryRun: FLAG_DRY_RUN },
  });
  await closeWorkerCostPool();
  await pool.end();
}

main().catch(async (err) => {
  console.error("Fatal:", err.stack ?? err.message);
  try { await pool.end(); } catch {}
  try { await closeWorkerCostPool(); } catch {}
  process.exit(1);
});
