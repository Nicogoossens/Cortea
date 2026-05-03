/**
 * Background sweeper that guarantees automatic register calibration for any
 * `translations` row whose key matches a content prefix and whose
 * `calibrated_module` is NULL — regardless of the write path that produced
 * the row. This is the safety net that satisfies the "no manual CLI step"
 * requirement: even if a future code path or CLI script writes directly to
 * the table, the sweeper will pick the row up on its next pass.
 *
 * Selection logic:
 *   - key matches CONTENT_KEY_PREFIXES (and is not in SKIP_KEYS)
 *   - language_code base is in SUPPORTED_BASE_CODES
 *   - calibrated_module IS NULL
 *
 * Module selection per row:
 *   - formality_register = "low"  → "standard"
 *   - formality_register = "high" → "elite"
 *   - default                     → "standard"
 *
 * The sweeper runs on an interval and is bounded per pass to keep load
 * predictable. It is safe to start more than one process: each row is
 * stamped with calibrated_module on success so subsequent passes skip it.
 */

import { db, translationsTable } from "@workspace/db";
import { and, asc, inArray, isNull, sql, or, like } from "drizzle-orm";
import {
  calibrateTranslationsByIds,
  type CalibrationModule,
} from "./register-calibration";
import { logger } from "./logger";
import { checkDailyBudget, recordWorkerRun } from "./worker-cost";

const SWEEPER_NAME = "register-calibration";

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

// Mirrors SUPPORTED_BASE_CODES in register-calibration.ts. Listed here so
// the sweeper can apply the filter at the SQL boundary, preventing
// unsupported-locale rows from monopolising bounded batches.
const SUPPORTED_BASE_CODES = ["nl", "fr", "en", "de", "es", "it"];

const DEFAULT_BATCH = 25;
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let timer: NodeJS.Timeout | null = null;
let running = false;
let lastRunAt: number | null = null;
let lastProcessed: number = 0;
let lastErrors: number = 0;

export interface CalibrationSweeperStatus {
  enabled: boolean;
  lastRunAt: number | null;
  running: boolean;
  pendingRows: number;
  lastProcessed: number;
  lastErrors: number;
}

export async function getCalibrationSweeperStatus(): Promise<CalibrationSweeperStatus> {
  const prefixConditions = CONTENT_PREFIXES.map((p) => like(translationsTable.key, `${p}%`));
  const prefixOr = prefixConditions.length === 1 ? prefixConditions[0] : or(...prefixConditions);
  let pendingRows = 0;
  try {
    const rows = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(translationsTable)
      .where(
        and(
          isNull(translationsTable.calibrated_module),
          prefixOr,
          inArray(translationsTable.language_code, SUPPORTED_BASE_CODES),
          sql`${translationsTable.key} NOT IN ('app.name', 'app.established', 'atelier.duration')`,
        ),
      );
    pendingRows = rows[0]?.n ?? 0;
  } catch {
    pendingRows = -1;
  }
  return {
    enabled: timer !== null,
    lastRunAt,
    running,
    pendingRows,
    lastProcessed,
    lastErrors,
  };
}

function chooseModule(formalityRegister: string | null | undefined): CalibrationModule {
  if (formalityRegister === "low") return "standard";
  if (formalityRegister === "high") return "elite";
  return "standard";
}

async function runOnce(batchSize: number): Promise<{
  processed: number;
  errors: number;
  inputTokens: number;
  outputTokens: number;
}> {
  const prefixConditions = CONTENT_PREFIXES.map((p) => like(translationsTable.key, `${p}%`));
  const prefixOr = prefixConditions.length === 1 ? prefixConditions[0] : or(...prefixConditions);

  const candidates = await db
    .select({
      id: translationsTable.id,
      formality_register: translationsTable.formality_register,
      language_code: translationsTable.language_code,
    })
    .from(translationsTable)
    .where(
      and(
        isNull(translationsTable.calibrated_module),
        prefixOr,
        // Restrict to supported calibration locales at the SQL boundary so
        // unsupported-locale rows never consume batch slots and never
        // perpetually re-select.
        inArray(translationsTable.language_code, SUPPORTED_BASE_CODES),
        // Skip the small set of immutable keys without a JS filter call.
        sql`${translationsTable.key} NOT IN ('app.name', 'app.established', 'atelier.duration')`,
      ),
    )
    .orderBy(asc(translationsTable.id))
    .limit(batchSize);

  if (candidates.length === 0) {
    return { processed: 0, errors: 0, inputTokens: 0, outputTokens: 0 };
  }

  // Group rows by chosen module so each call processes a homogeneous batch.
  const byModule: Record<CalibrationModule, number[]> = { standard: [], elite: [] };
  for (const c of candidates) {
    byModule[chooseModule(c.formality_register)].push(c.id);
  }

  let processed = 0;
  let errors = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  for (const moduleKey of Object.keys(byModule) as CalibrationModule[]) {
    const ids = byModule[moduleKey];
    if (ids.length === 0) continue;
    try {
      const summary = await calibrateTranslationsByIds(ids, moduleKey);
      processed += summary.passed + summary.rewritten;
      errors += summary.errors;
      inputTokens += summary.usage.input_tokens;
      outputTokens += summary.usage.output_tokens;
    } catch (err) {
      errors += ids.length;
      logger.warn(
        { err, count: ids.length, module: moduleKey },
        "Calibration sweeper: batch failed",
      );
      // We deliberately leave failed rows untouched (calibrated_module stays
      // NULL). The interval itself acts as backoff: rows will be retried on
      // the next pass. No sentinel stamp is written.
    }
  }

  return { processed, errors, inputTokens, outputTokens };
}

export interface SweeperOptions {
  intervalMs?: number;
  batchSize?: number;
  /**
   * When false (default), the sweeper silently no-ops if the Anthropic
   * environment variables are missing. Set true to throw on startup.
   */
  requireAnthropic?: boolean;
}

export function startCalibrationSweeper(opts: SweeperOptions = {}): void {
  if (timer) return;

  const hasAnthropic =
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) &&
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY);

  if (!hasAnthropic) {
    if (opts.requireAnthropic) {
      throw new Error(
        "Calibration sweeper requires AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY.",
      );
    }
    logger.info(
      "Calibration sweeper not started: Anthropic env vars are not configured.",
    );
    return;
  }

  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const batchSize = opts.batchSize ?? DEFAULT_BATCH;

  const tick = async () => {
    if (running) return;
    running = true;
    const startedAt = new Date();
    try {
      // Per-day USD spend cap: short-circuit before we spend another cent if
      // today's accumulated spend has already met or exceeded the budget.
      const budget = await checkDailyBudget(SWEEPER_NAME);
      if (budget.over) {
        logger.warn(
          { spent: budget.spent, budget: budget.budget, sweeper: SWEEPER_NAME },
          "Calibration sweeper: daily budget reached, skipping pass",
        );
        lastProcessed = 0;
        lastErrors = 0;
        lastRunAt = Date.now();
        await recordWorkerRun({
          sweeper: SWEEPER_NAME,
          startedAt,
          itemsProcessed: 0,
          inputTokens: 0,
          outputTokens: 0,
          status: "budget_capped",
          metadata: { spent: budget.spent, budget: budget.budget },
        });
        return;
      }

      const { processed, errors, inputTokens, outputTokens } =
        await runOnce(batchSize);
      lastProcessed = processed;
      lastErrors = errors;
      lastRunAt = Date.now();
      if (processed > 0 || errors > 0) {
        logger.info(
          { processed, errors, batchSize, inputTokens, outputTokens },
          "Calibration sweeper: pass completed",
        );
        await recordWorkerRun({
          sweeper: SWEEPER_NAME,
          startedAt,
          itemsProcessed: processed,
          inputTokens,
          outputTokens,
          status: errors > 0 ? "partial" : "ok",
          metadata: { errors, batchSize },
        });
      }
    } catch (err) {
      logger.warn({ err }, "Calibration sweeper: pass failed");
      await recordWorkerRun({
        sweeper: SWEEPER_NAME,
        startedAt,
        itemsProcessed: 0,
        inputTokens: 0,
        outputTokens: 0,
        status: "failed",
        metadata: { error: err instanceof Error ? err.message : String(err) },
      });
    } finally {
      running = false;
    }
  };

  // Kick off an initial pass shortly after startup, then run on the interval.
  timer = setInterval(tick, intervalMs);
  setTimeout(tick, 30 * 1000).unref();
  if (typeof timer.unref === "function") timer.unref();

  logger.info(
    { intervalMs, batchSize },
    "Calibration sweeper started",
  );
}

export function stopCalibrationSweeper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
