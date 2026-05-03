/**
 * AI cost / token-usage telemetry for the background sweepers.
 *
 * Every sweeper that calls Anthropic accumulates input/output tokens during
 * its pass and, on completion, calls `recordWorkerRun` to:
 *   1. Insert a row into `worker_runs` so spend is queryable in SQL.
 *   2. Emit a structured pino "ai-cost" log line for live ops visibility.
 *
 * `isOverDailyBudget` lets a sweeper short-circuit a tick when today's
 * cumulative spend has hit the configured cap, so a runaway loop cannot
 * exceed budget.
 *
 * Pricing is in USD per million tokens. The per-model map is deliberately
 * tiny — when an unknown model is reported we fall back to the default rate
 * rather than zero so spend is never under-counted.
 */

import { db, workerRunsTable } from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { logger } from "./logger";

const DEFAULT_MODEL = "claude-haiku-4-5";

export const PRICING_USD_PER_MTOK: Record<
  string,
  { input: number; output: number }
> = {
  // Anthropic public pricing for Claude Haiku 4.5: $1 / $5 per MTok.
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export function estimateUsd(
  model: string | undefined,
  inputTokens: number,
  outputTokens: number,
): number {
  const p =
    PRICING_USD_PER_MTOK[model ?? DEFAULT_MODEL] ??
    PRICING_USD_PER_MTOK[DEFAULT_MODEL]!;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

/**
 * Anthropic /messages responses include a `usage` block with input/output
 * token counts. This is a small typed extractor so call sites stay tidy.
 */
export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

export function extractUsage(data: unknown): AnthropicUsage {
  const u = (data as { usage?: { input_tokens?: number; output_tokens?: number } } | null)?.usage;
  return {
    input_tokens: Number(u?.input_tokens ?? 0) || 0,
    output_tokens: Number(u?.output_tokens ?? 0) || 0,
  };
}

export type WorkerRunStatus = "ok" | "budget_capped" | "failed" | "partial";

export interface RecordWorkerRunInput {
  sweeper: string;
  startedAt: Date;
  itemsProcessed: number;
  inputTokens: number;
  outputTokens: number;
  model?: string;
  status?: WorkerRunStatus;
  metadata?: Record<string, unknown>;
}

export async function recordWorkerRun(
  input: RecordWorkerRunInput,
): Promise<void> {
  const finishedAt = new Date();
  const elapsedMs = finishedAt.getTime() - input.startedAt.getTime();
  const model = input.model ?? DEFAULT_MODEL;
  const usd = estimateUsd(model, input.inputTokens, input.outputTokens);
  const status: WorkerRunStatus = input.status ?? "ok";

  try {
    await db.insert(workerRunsTable).values({
      sweeper: input.sweeper,
      started_at: input.startedAt,
      finished_at: finishedAt,
      elapsed_ms: elapsedMs,
      items_processed: input.itemsProcessed,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      estimated_usd: usd,
      model,
      status,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    logger.warn(
      { err, sweeper: input.sweeper },
      "worker-cost: failed to insert worker_runs row",
    );
  }

  logger.info(
    {
      sweeper: input.sweeper,
      elapsedMs,
      itemsProcessed: input.itemsProcessed,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedUsd: Number(usd.toFixed(6)),
      model,
      status,
    },
    "ai-cost worker_run",
  );
}

export async function getDailySpendUsd(sweeper: string): Promise<number> {
  const rows = await db
    .select({
      usd: sql<number>`COALESCE(SUM(${workerRunsTable.estimated_usd}), 0)::float8`,
    })
    .from(workerRunsTable)
    .where(
      and(
        eq(workerRunsTable.sweeper, sweeper),
        gte(workerRunsTable.started_at, sql`date_trunc('day', NOW())`),
      ),
    );
  return Number(rows[0]?.usd ?? 0);
}

/**
 * Resolve the per-day USD cap for a sweeper.
 *   AI_DAILY_BUDGET_USD_<UPPER_SNAKE_SWEEPER>  (per-sweeper override)
 *   AI_DAILY_BUDGET_USD                        (global default)
 * Returns Infinity when no cap is configured.
 */
export function getDailyBudgetUsd(sweeper: string): number {
  const envKey = `AI_DAILY_BUDGET_USD_${sweeper.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
  const perSweeper = process.env[envKey];
  if (perSweeper && !Number.isNaN(Number(perSweeper))) return Number(perSweeper);
  const global = process.env.AI_DAILY_BUDGET_USD;
  if (global && !Number.isNaN(Number(global))) return Number(global);
  return Number.POSITIVE_INFINITY;
}

export interface BudgetStatus {
  over: boolean;
  spent: number;
  budget: number;
}

export async function checkDailyBudget(sweeper: string): Promise<BudgetStatus> {
  const budget = getDailyBudgetUsd(sweeper);
  if (!Number.isFinite(budget)) return { over: false, spent: 0, budget };
  const spent = await getDailySpendUsd(sweeper);
  return { over: spent >= budget, spent, budget };
}
