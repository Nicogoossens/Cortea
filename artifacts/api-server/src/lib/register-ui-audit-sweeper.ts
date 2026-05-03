/**
 * Background sweeper that automates the legacy
 * `scripts/elite-register-worker.mjs` flow for the **UI** translation rows
 * (those whose key does NOT match a content prefix). It guarantees that any
 * new or changed `translations` row — for either the elite OR the middle-class
 * register — is automatically evaluated and stamped without manual CLI runs.
 *
 * Companion to `register-calibration-sweeper`, which covers content keys
 * (scenario., counsel_advice., hint., …). Together the two sweepers ensure
 * every translations row gets register-aware treatment for both registers.
 *
 * Per-row register selection mirrors `formalityToRegister`:
 *   - formality_register = "high"   → ELITE
 *   - formality_register = "low"    → MIDDLE_CLASS
 *   - default                       → ELITE
 *
 * The active register is persisted to `calibrated_module` (elite | standard)
 * so subsequent passes skip already-handled rows. Rows that fail mid-batch
 * (API errors, parse errors) are left unstamped and retried next pass.
 */

import { db, translationsTable } from "@workspace/db";
import { and, asc, inArray, isNull, sql, or, like, not } from "drizzle-orm";
import { logger } from "./logger";
import {
  buildRegisterHeader,
  formalityToRegister,
  registerToCalibratedModule,
  type RegisterKey,
} from "./register-context";

// Mirrors register-calibration.ts. Anything matching one of these prefixes is
// a content key and is handled by the content-key sweeper, NOT here.
const CONTENT_PREFIXES = [
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

const SUPPORTED_BASE_CODES = ["nl", "fr", "en", "de", "es", "it", "pt"];
const SKIP_KEYS = ["app.name", "app.established", "atelier.duration"];

const DEFAULT_BATCH = 20;
const DEFAULT_INTERVAL_MS = 7 * 60 * 1000; // 7 min — staggered vs the other two sweepers
const PER_CALL_DELAY_MS = 200;

let timer: NodeJS.Timeout | null = null;
let running = false;

interface AuditRow {
  id: number;
  language_code: string;
  region_link: string | null;
  formality_register: string | null;
  key: string;
  value: string;
}

interface EvalResult {
  pass: boolean;
  score: number;
  rewritten: string;
}

async function evaluateRow(row: AuditRow, register: RegisterKey): Promise<EvalResult | null> {
  const base = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const key = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!base || !key) throw new Error("Anthropic env vars missing");

  const systemPrompt =
    `${buildRegisterHeader(register)}\n\n` +
    `You evaluate a single SOWISO UI translation string for ${register === "elite" ? "elite" : "middle-class"} register compliance ` +
    `in the language identified by code "${row.language_code}"${row.region_link ? ` (region: ${row.region_link})` : ""}.`;

  const userMessage =
    `Evaluate the following UI string for register compliance.\n\n` +
    `String: "${row.value}"\n\n` +
    `Respond ONLY with a JSON object (no markdown, no explanation outside the JSON):\n` +
    `{ "pass": true|false, "score": <integer 1-10>, "rewritten": "<improved string when pass is false; original when true>" }`;

  const response = await fetch(`${base}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
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
    throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  }
  const data = (await response.json()) as { content?: Array<{ text: string }> };
  let text = (data.content?.[0]?.text ?? "").trim();
  text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  try {
    const parsed = JSON.parse(text) as Partial<EvalResult>;
    if (
      typeof parsed.pass !== "boolean" ||
      typeof parsed.score !== "number" ||
      typeof parsed.rewritten !== "string"
    ) {
      return null;
    }
    return { pass: parsed.pass, score: parsed.score, rewritten: parsed.rewritten };
  } catch {
    return null;
  }
}

async function runOnce(batchSize: number): Promise<{
  evaluated: number;
  passed: Record<RegisterKey, number>;
  rewritten: Record<RegisterKey, number>;
  errors: number;
}> {
  const result = {
    evaluated: 0,
    passed: { elite: 0, middle_class: 0 } as Record<RegisterKey, number>,
    rewritten: { elite: 0, middle_class: 0 } as Record<RegisterKey, number>,
    errors: 0,
  };

  // Pick UI rows (NOT content keys) where calibrated_module is still NULL,
  // restricted to languages we have prompts for and excluding immutable keys.
  const prefixConds = CONTENT_PREFIXES.map((p) => like(translationsTable.key, `${p}%`));
  const isContent = prefixConds.length === 1 ? prefixConds[0] : or(...prefixConds);

  const candidates = await db
    .select({
      id: translationsTable.id,
      language_code: translationsTable.language_code,
      region_link: translationsTable.region_link,
      formality_register: translationsTable.formality_register,
      key: translationsTable.key,
      value: translationsTable.value,
    })
    .from(translationsTable)
    .where(
      and(
        isNull(translationsTable.calibrated_module),
        not(isContent!),
        inArray(translationsTable.language_code, SUPPORTED_BASE_CODES),
        sql`${translationsTable.key} NOT IN (${sql.join(SKIP_KEYS.map((k) => sql`${k}`), sql`, `)})`,
      ),
    )
    .orderBy(asc(translationsTable.id))
    .limit(batchSize);

  if (candidates.length === 0) return result;

  for (const row of candidates) {
    const register = formalityToRegister(row.formality_register);
    let evalResult: EvalResult | null;
    try {
      evalResult = await evaluateRow(row, register);
    } catch (err) {
      result.errors++;
      logger.warn(
        { err, id: row.id, lang: row.language_code, register },
        "register-ui-audit: evaluation API error",
      );
      await new Promise((r) => setTimeout(r, PER_CALL_DELAY_MS));
      continue;
    }
    if (evalResult === null) {
      result.errors++;
      await new Promise((r) => setTimeout(r, PER_CALL_DELAY_MS));
      continue;
    }
    result.evaluated++;
    const calibratedModule = registerToCalibratedModule(register);
    if (evalResult.pass) {
      result.passed[register]++;
      await db
        .update(translationsTable)
        .set({ quality_reviewed_at: sql`NOW()`, calibrated_module: calibratedModule })
        .where(sql`${translationsTable.id} = ${row.id}`);
    } else {
      result.rewritten[register]++;
      await db
        .update(translationsTable)
        .set({
          value: evalResult.rewritten,
          quality_reviewed_at: sql`NOW()`,
          calibrated_module: calibratedModule,
        })
        .where(sql`${translationsTable.id} = ${row.id}`);
    }
    await new Promise((r) => setTimeout(r, PER_CALL_DELAY_MS));
  }

  return result;
}

export interface RegisterUiAuditSweeperOptions {
  intervalMs?: number;
  batchSize?: number;
}

export function startRegisterUiAuditSweeper(opts: RegisterUiAuditSweeperOptions = {}): void {
  if (timer) return;

  const hasAnthropic =
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) &&
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY);
  if (!hasAnthropic) {
    logger.info(
      "Register UI audit sweeper not started: Anthropic env vars are not configured.",
    );
    return;
  }

  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const batchSize = opts.batchSize ?? DEFAULT_BATCH;

  const tick = async () => {
    if (running) return;
    running = true;
    const t0 = Date.now();
    try {
      const summary = await runOnce(batchSize);
      if (summary.evaluated > 0 || summary.errors > 0) {
        logger.info(
          {
            elapsedMs: Date.now() - t0,
            evaluated: summary.evaluated,
            passedElite: summary.passed.elite,
            passedMiddleClass: summary.passed.middle_class,
            rewrittenElite: summary.rewritten.elite,
            rewrittenMiddleClass: summary.rewritten.middle_class,
            errors: summary.errors,
            batchSize,
          },
          "register-ui-audit: pass completed",
        );
      }
    } catch (err) {
      logger.warn({ err }, "register-ui-audit: pass failed");
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, intervalMs);
  setTimeout(tick, 45 * 1000).unref();
  if (typeof timer.unref === "function") timer.unref();

  logger.info({ intervalMs, batchSize }, "Register UI audit sweeper started");
}

export function stopRegisterUiAuditSweeper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
