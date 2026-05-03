#!/usr/bin/env node
/**
 * SOWISO Learning-Track Question Generator
 *
 * Generates Atelier `learning_track_questions` rows for a target region by
 * mirroring the slot inventory of an existing source region (default: BE) and
 * asking Claude to author culturally-accurate questions for the target region.
 *
 * Each "slot" is a unique combination of:
 *   (register, research_pillar, phase, level, demographic, lang)
 *
 * For every slot present in the source region, the script asks Claude to
 * generate N questions for the target region. The script writes the rows
 * directly via INSERT ... ON CONFLICT DO NOTHING (uses the table's
 * question_hash unique index, so re-runs are idempotent).
 *
 * Usage:
 *   node scripts/generate-learning-track-questions.mjs --region AE [flags]
 *
 * Flags:
 *   --region <code>      Target region (required, e.g. AE, JP, US)
 *   --source <code>      Source region whose slot inventory we mirror (default: BE)
 *   --register <name>    Only do this register (middle_class | elite)
 *   --pillar <code>      Only do this pillar (P1..P5)
 *   --level <n>          Only do this level (1..5)
 *   --max-per-slot <n>   Cap questions per slot (default: copy source count)
 *   --batch-size <n>     Questions per Claude call (default: 10)
 *   --lang <code>        Language to generate (default: en)
 *   --dry-run            Print the plan + first slot's output, do not write
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

const SWEEPER_NAME = "ltq-generation";
const MODEL = "claude-haiku-4-5";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dbPkgPath = path.resolve(__dirname, "../lib/db/package.json");
const pg = require(path.resolve(path.dirname(dbPkgPath), "node_modules/pg"));
const { Pool } = pg;

// ── CLI ────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const FLAG_REGION   = (flag("--region") ?? "").toUpperCase();
const FLAG_SOURCE   = (flag("--source") ?? "BE").toUpperCase();
const FLAG_REGISTER = flag("--register");
const FLAG_PILLAR   = flag("--pillar");
const FLAG_LEVEL    = flag("--level") ? parseInt(flag("--level"), 10) : null;
const FLAG_MAX      = flag("--max-per-slot") ? parseInt(flag("--max-per-slot"), 10) : null;
const FLAG_BATCH    = flag("--batch-size") ? parseInt(flag("--batch-size"), 10) : 10;
const FLAG_LANG     = flag("--lang") ?? "en";
const FLAG_DRY_RUN  = args.includes("--dry-run");

if (!FLAG_REGION) {
  console.error("Error: --region is required (e.g. --region AE)");
  process.exit(1);
}

let totalInputTokens = 0;
let totalOutputTokens = 0;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Anthropic ──────────────────────────────────────────────────────────────────
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
  totalInputTokens  += Number(data.usage?.input_tokens  ?? 0) || 0;
  totalOutputTokens += Number(data.usage?.output_tokens ?? 0) || 0;
  return data.content?.[0]?.text?.trim() ?? "";
}

// ── Region context (compass_regions) ───────────────────────────────────────────
async function fetchRegionContext(regionCode) {
  const { rows } = await pool.query(
    `SELECT content FROM compass_regions WHERE region_code = $1 AND is_published = true LIMIT 1`,
    [regionCode],
  );
  if (rows.length === 0) return null;
  const content = rows[0].content || {};
  // Prefer en-GB, then any en*, then anything available.
  const langKey =
    content["en-GB"] ? "en-GB" :
    Object.keys(content).find((k) => k.toLowerCase().startsWith("en")) ??
    Object.keys(content)[0];
  return langKey ? content[langKey] : null;
}

// ── Slot inventory from source region ──────────────────────────────────────────
async function fetchSlotInventory(sourceRegion) {
  const { rows } = await pool.query(
    `SELECT register, research_pillar, phase, level, demographic, COUNT(*)::int AS n
       FROM learning_track_questions
      WHERE region_code = $1 AND lang = 'en'
      GROUP BY register, research_pillar, phase, level, demographic
      ORDER BY register, research_pillar, phase, level, demographic`,
    [sourceRegion],
  );
  return rows;
}

// ── Sample source questions for few-shot ───────────────────────────────────────
async function fetchSampleSource(sourceRegion, slot, n = 3) {
  const { rows } = await pool.query(
    `SELECT question_text, historical_context, options
       FROM learning_track_questions
      WHERE region_code = $1
        AND register = $2 AND research_pillar = $3 AND phase = $4
        AND level = $5 AND demographic = $6 AND lang = 'en'
      ORDER BY RANDOM()
      LIMIT $7`,
    [sourceRegion, slot.register, slot.research_pillar, slot.phase, slot.level, slot.demographic, n],
  );
  return rows;
}

// ── Prompt builders ────────────────────────────────────────────────────────────
const PILLAR_THEMES = {
  P1: "Communication, correspondence, and digital etiquette (greetings, emails, voice, messaging)",
  P2: "Hospitality and dining (table manners, hosting, gifting, restaurants, alcohol)",
  P3: "Dress, grooming, and presence (appropriate attire, formal wear, public appearance)",
  P4: "Status, hierarchy, and social positioning (rank, deference, business etiquette)",
  P5: "Public conduct and ceremonial occasions (ceremonies, faith-adjacent, civic events)",
};

const REGISTER_NOTES = {
  middle_class: "Pragmatic, broadly accepted middle-class etiquette. Aspirational but achievable; avoid overly aristocratic flourishes.",
  elite:        "Discreet upper-class / ambassador-grade etiquette. Restrained, refined; never showy.",
};

const DEMOGRAPHIC_NOTES = {
  common:        "Default: applies to adults broadly, not gender-specific.",
  men_50plus:    "Adult men 50+. Reflect mature professional / paternal contexts where appropriate.",
  women_30_50:   "Women aged 30-50. Reflect mid-career / family contexts where appropriate.",
};

function buildSystemPrompt(regionCode, regionContext, slot, count) {
  const pillarTheme   = PILLAR_THEMES[slot.research_pillar] ?? "General etiquette";
  const registerNote  = REGISTER_NOTES[slot.register]      ?? "";
  const demoNote      = DEMOGRAPHIC_NOTES[slot.demographic] ?? "";

  let ctxBlock = "";
  if (regionContext) {
    const c = regionContext;
    const dosArr   = Array.isArray(c.dos)   ? c.dos.slice(0, 5)   : [];
    const dontsArr = Array.isArray(c.donts) ? c.donts.slice(0, 5) : [];
    ctxBlock = `
REGION CONTEXT — ${regionCode} (${c.region_name ?? regionCode}):
- Core value: ${c.core_value ?? "(unknown)"}
- Biggest taboo: ${c.biggest_taboo ?? "(unknown)"}
- Dining: ${c.dining_etiquette ?? "(unknown)"}
- Language: ${c.language_notes ?? "(unknown)"}
- Gifting: ${c.gift_protocol ?? "(unknown)"}
- Dress: ${c.dress_code ?? "(unknown)"}
- Sample DOs: ${dosArr.join(" | ")}
- Sample DON'Ts: ${dontsArr.join(" | ")}
`.trim();
  }

  return `You are a senior etiquette researcher for SOWISO Atelier authoring multiple-choice etiquette questions for ${regionCode}.

PILLAR FOCUS: ${slot.research_pillar} — ${pillarTheme}
PHASE: ${slot.phase} (foundational level set)
LEVEL: ${slot.level} (1=basic awareness, 5=advanced subtlety)
REGISTER: ${slot.register} — ${registerNote}
DEMOGRAPHIC: ${slot.demographic} — ${demoNote}

${ctxBlock}

Author ${count} self-contained scenario-based multiple-choice questions. Each question must:
- Pose a realistic scenario set in ${regionCode} or with a host/counterpart from ${regionCode}.
- Be answerable without external knowledge (the scenario gives you what you need).
- Have EXACTLY 3 options: one tier-1 (the right move), one tier-2 (close but not ideal), one tier-3 (clearly wrong).
- Include a one-sentence motivation per option explaining WHY it sits in that tier — concrete, not preachy.
- Be culturally accurate for ${regionCode}; never copy a Belgian or generic-Western frame.
- Vary scenarios across questions (don't repeat the same setup with different wording).

OUTPUT — return ONLY a single JSON object with this exact shape, no markdown fences, no preamble:
{
  "questions": [
    {
      "question_text": "string",
      "historical_context": "string or null (one sentence of cultural why-this-matters; null if not applicable)",
      "options": [
        { "text": "string", "answer_tier": 1, "motivation": "string" },
        { "text": "string", "answer_tier": 2, "motivation": "string" },
        { "text": "string", "answer_tier": 3, "motivation": "string" }
      ]
    }
  ]
}

CRITICAL JSON RULES:
- All string values must be valid JSON: escape inner double-quotes as \\".
- Do NOT use typographic/curly quotes inside string values; use ASCII quotes only.
- Return ONLY the raw JSON object. No markdown fences, no preamble, no trailing prose.`;
}

function buildUserPrompt(slot, sourceSamples, count) {
  let samplesBlock = "";
  if (sourceSamples.length > 0) {
    samplesBlock = `
For TONE/FORMAT REFERENCE only (these are from a different region — do NOT copy their cultural content, only mirror their structure and length):

${sourceSamples.map((s, i) => `Sample ${i + 1}:
Q: ${s.question_text}
${(s.options ?? []).map((o) => `  [tier ${o.answer_tier}] ${o.text}\n     motivation: ${o.motivation}`).join("\n")}
`).join("\n")}
`;
  }
  return `Generate ${count} fresh ${slot.register} questions for pillar ${slot.research_pillar}, level ${slot.level}, demographic ${slot.demographic}.${samplesBlock}`;
}

// ── Parse Claude response ──────────────────────────────────────────────────────
function parseGenerated(raw) {
  let text = raw;
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) text = m[0];
  else text = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  try { text = jsonrepair(text); } catch { /* let JSON.parse report */ }
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.questions)) throw new Error("response missing questions[] array");
  return parsed.questions.filter((q) => {
    if (typeof q.question_text !== "string" || !q.question_text.trim()) return false;
    if (!Array.isArray(q.options) || q.options.length !== 3) return false;
    const tiers = q.options.map((o) => o.answer_tier).sort();
    if (tiers[0] !== 1 || tiers[1] !== 2 || tiers[2] !== 3) return false;
    return q.options.every((o) =>
      typeof o.text === "string" && o.text.trim() &&
      typeof o.motivation === "string" && o.motivation.trim()
    );
  });
}

// ── Insert questions ───────────────────────────────────────────────────────────
async function insertBatch(slot, regionCode, lang, questions) {
  if (questions.length === 0) return 0;
  const values = [];
  const placeholders = [];
  for (const q of questions) {
    const base = values.length;
    const p = (n) => `$${base + n}`;
    placeholders.push(
      `(${p(1)}, ${p(2)}, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)}, ${p(8)}, ${p(9)}::jsonb, ${p(10)}::jsonb, ${p(11)})`,
    );
    values.push(
      slot.register,
      slot.research_pillar,
      slot.phase,
      slot.level,
      regionCode,
      slot.demographic,
      q.question_text.trim(),
      q.historical_context && typeof q.historical_context === "string" ? q.historical_context.trim() : null,
      JSON.stringify(q.options),
      JSON.stringify([]),
      lang,
    );
  }
  const sql = `
    INSERT INTO learning_track_questions
      (register, research_pillar, phase, level, region_code, demographic,
       question_text, historical_context, options, interest_tags, lang)
    VALUES ${placeholders.join(",\n")}
    ON CONFLICT (question_hash) DO NOTHING
    RETURNING id
  `;
  const { rows } = await pool.query(sql, values);
  return rows.length;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const runStartedAt = new Date();
  console.log("SOWISO Learning-Track Question Generator");
  console.log(`Target region : ${FLAG_REGION}`);
  console.log(`Source region : ${FLAG_SOURCE} (slot inventory mirror)`);
  console.log(`Language      : ${FLAG_LANG}`);
  console.log(`Batch size    : ${FLAG_BATCH}`);
  console.log(`Mode          : ${FLAG_DRY_RUN ? "DRY RUN — no DB writes" : "LIVE"}`);
  console.log("─".repeat(60));

  const budget = await checkDailyBudget(SWEEPER_NAME);
  if (budget.over) {
    console.warn(`[ltq-gen] Daily AI budget reached: $${budget.spent.toFixed(4)} of $${budget.budget}. Aborting.`);
    await recordWorkerRun({
      sweeper: SWEEPER_NAME, startedAt: runStartedAt, status: "budget_capped", model: MODEL,
      metadata: { spent: budget.spent, budget: budget.budget, region: FLAG_REGION },
    });
    await closeWorkerCostPool();
    await pool.end();
    return;
  }

  const regionContext = await fetchRegionContext(FLAG_REGION);
  if (!regionContext) {
    console.warn(`[ltq-gen] No compass content for ${FLAG_REGION}; questions will be generated with minimal cultural framing.`);
  } else {
    console.log(`[ltq-gen] Compass context loaded: "${(regionContext.core_value ?? "").substring(0, 60)}…"`);
  }

  let slots = await fetchSlotInventory(FLAG_SOURCE);
  console.log(`[ltq-gen] Source ${FLAG_SOURCE} has ${slots.length} slots, ${slots.reduce((a, s) => a + s.n, 0)} total questions.`);

  if (FLAG_REGISTER) slots = slots.filter((s) => s.register === FLAG_REGISTER);
  if (FLAG_PILLAR)   slots = slots.filter((s) => s.research_pillar === FLAG_PILLAR);
  if (FLAG_LEVEL)    slots = slots.filter((s) => s.level === FLAG_LEVEL);
  console.log(`[ltq-gen] After filters: ${slots.length} slots to generate.`);

  let totalGenerated = 0;
  let totalInserted = 0;
  let totalFailed = 0;

  for (const [si, slot] of slots.entries()) {
    const target = FLAG_MAX ? Math.min(FLAG_MAX, slot.n) : slot.n;
    console.log(`\n[${si + 1}/${slots.length}] ${slot.register}/${slot.research_pillar}/L${slot.level}/${slot.demographic} → ${target} questions`);

    const sourceSamples = await fetchSampleSource(FLAG_SOURCE, slot, 3);

    let producedForSlot = 0;
    let attemptsLeft = Math.ceil(target / FLAG_BATCH) + 2;

    while (producedForSlot < target && attemptsLeft > 0) {
      attemptsLeft--;
      const remaining = target - producedForSlot;
      const askFor = Math.min(remaining, FLAG_BATCH);
      const sysPrompt = buildSystemPrompt(FLAG_REGION, regionContext, slot, askFor);
      const usrPrompt = buildUserPrompt(slot, sourceSamples, askFor);

      let raw;
      try {
        raw = await callAnthropic(sysPrompt, usrPrompt);
      } catch (err) {
        console.log(`  ! API error: ${err.message}`);
        totalFailed++;
        continue;
      }

      let questions;
      try {
        questions = parseGenerated(raw);
      } catch (err) {
        console.log(`  ! Parse error: ${err.message} (raw len=${raw.length})`);
        totalFailed++;
        continue;
      }

      if (questions.length === 0) {
        console.log(`  ! No valid questions in response`);
        totalFailed++;
        continue;
      }

      // Cap to remaining
      questions = questions.slice(0, remaining);

      if (FLAG_DRY_RUN) {
        console.log(`  ✓ DRY RUN — generated ${questions.length} questions:`);
        questions.slice(0, 2).forEach((q, i) => {
          console.log(`    ${i + 1}. ${q.question_text.substring(0, 100)}…`);
          q.options.forEach((o) => console.log(`       [tier ${o.answer_tier}] ${o.text.substring(0, 70)}…`));
        });
        producedForSlot += questions.length;
        totalGenerated += questions.length;
        // For dry-run, only do one batch per slot to save tokens.
        break;
      }

      const inserted = await insertBatch(slot, FLAG_REGION, FLAG_LANG, questions);
      console.log(`  ✓ ${questions.length} generated, ${inserted} inserted (${questions.length - inserted} duplicates)`);
      producedForSlot += questions.length;
      totalGenerated += questions.length;
      totalInserted  += inserted;

      await new Promise((r) => setTimeout(r, 200));
    }

    if (producedForSlot < target) {
      console.log(`  ⚠ slot ended at ${producedForSlot}/${target} (attempts exhausted)`);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Generated: ${totalGenerated}   Inserted: ${totalInserted}   Failed batches: ${totalFailed}`);
  console.log(`Tokens — input: ${totalInputTokens}   output: ${totalOutputTokens}`);

  await recordWorkerRun({
    sweeper: SWEEPER_NAME,
    startedAt: runStartedAt,
    itemsProcessed: totalInserted,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    model: MODEL,
    status: totalFailed > 0 ? "partial" : "ok",
    metadata: {
      region: FLAG_REGION,
      source: FLAG_SOURCE,
      slots: slots.length,
      generated: totalGenerated,
      dryRun: FLAG_DRY_RUN,
    },
  });
  await closeWorkerCostPool();
  await pool.end();
}

main().catch(async (err) => {
  console.error("Fatal error:", err.stack ?? err.message);
  try { await pool.end(); } catch {}
  try { await closeWorkerCostPool(); } catch {}
  process.exit(1);
});
