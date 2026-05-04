/**
 * Script-side companion to artifacts/api-server/src/lib/worker-cost.ts.
 *
 * Used by the worker scripts that get spawned by the sweepers
 * (translate-ui.mjs, scenario-translate.mjs, register-calibration-worker.mjs)
 * to record their per-run token usage and USD spend in the same `worker_runs`
 * table the in-process sweepers write to. Uses pg directly so the scripts
 * stay free of the @workspace/db drizzle import path.
 *
 * Pricing must stay in lockstep with worker-cost.ts.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require = createRequire(new URL("../../lib/db/package.json", import.meta.url));
const { Pool } = _require("pg");

const DEFAULT_MODEL = "claude-haiku-4-5";

export const PRICING_USD_PER_MTOK = {
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export function estimateUsd(model, inputTokens, outputTokens) {
  const p =
    PRICING_USD_PER_MTOK[model ?? DEFAULT_MODEL] ??
    PRICING_USD_PER_MTOK[DEFAULT_MODEL];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

export function extractUsage(data) {
  const u = data?.usage;
  return {
    input_tokens: Number(u?.input_tokens ?? 0) || 0,
    output_tokens: Number(u?.output_tokens ?? 0) || 0,
  };
}

let sharedPool = null;
let _poolUrl = null;

/**
 * Override the DB URL used for worker_runs writes.
 * Worker scripts call this once at startup with getDbUrl(FLAG_TARGET) so that
 * run logging follows the same environment as content writes (dev or prod).
 * Must be called before the first startWorkerRun / recordWorkerRun / checkDailyBudget.
 */
export function initWorkerCostPool(url) {
  if (sharedPool) {
    // Close the old pool so getPool() re-creates with the new URL.
    sharedPool.end().catch(() => {});
    sharedPool = null;
  }
  _poolUrl = url;
}

function getPool() {
  if (!sharedPool) {
    const url = _poolUrl ?? process.env.DATABASE_URL;
    if (!url) {
      throw new Error("worker-cost: DATABASE_URL not set");
    }
    sharedPool = new Pool({ connectionString: url });
  }
  return sharedPool;
}

export function getDailyBudgetUsd(sweeper) {
  const envKey = `AI_DAILY_BUDGET_USD_${sweeper.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
  const perSweeper = process.env[envKey];
  if (perSweeper && !Number.isNaN(Number(perSweeper))) return Number(perSweeper);
  const global = process.env.AI_DAILY_BUDGET_USD;
  if (global && !Number.isNaN(Number(global))) return Number(global);
  return Number.POSITIVE_INFINITY;
}

export async function getDailySpendUsd(sweeper) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(estimated_usd), 0)::float8 AS usd
       FROM worker_runs
      WHERE sweeper = $1
        AND started_at >= date_trunc('day', NOW())`,
    [sweeper],
  );
  return Number(rows[0]?.usd ?? 0);
}

export async function checkDailyBudget(sweeper) {
  const budget = getDailyBudgetUsd(sweeper);
  if (!Number.isFinite(budget)) return { over: false, spent: 0, budget };
  let spent = 0;
  try {
    spent = await getDailySpendUsd(sweeper);
  } catch (err) {
    // If the worker_runs table is missing (fresh db) we'd rather proceed than
    // block all AI work, so swallow and treat as zero spend.
    process.stderr.write(
      `[worker-cost] daily-spend lookup failed for ${sweeper}: ${err.message}\n`,
    );
    return { over: false, spent: 0, budget };
  }
  return { over: spent >= budget, spent, budget };
}

/**
 * Insert a "started" row into worker_runs with finished_at = NULL.
 * Call this at the very start of a worker script so active-run detection works.
 * Returns the inserted row id (or null on error).
 */
export async function startWorkerRun({ sweeper, metadata }) {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `INSERT INTO worker_runs
         (sweeper, started_at, items_processed, input_tokens, output_tokens,
          estimated_usd, model, status, metadata)
       VALUES ($1, NOW(), 0, 0, 0, 0, $2, 'running', $3)
       RETURNING id`,
      [sweeper, DEFAULT_MODEL, metadata ? JSON.stringify(metadata) : null],
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    process.stderr.write(
      `[worker-cost] startWorkerRun failed for ${sweeper}: ${err.message}\n`,
    );
    return null;
  }
}

export async function recordWorkerRun({
  sweeper,
  startedAt,
  itemsProcessed = 0,
  inputTokens = 0,
  outputTokens = 0,
  model,
  status = "ok",
  metadata,
}) {
  const finishedAt = new Date();
  const elapsedMs = finishedAt.getTime() - new Date(startedAt).getTime();
  const m = model ?? DEFAULT_MODEL;
  const usd = estimateUsd(m, inputTokens, outputTokens);
  const pool = getPool();
  try {
    // Try to UPDATE an existing open "running" row for this sweeper first.
    // startWorkerRun() inserts these at launch time with finished_at = NULL.
    // PostgreSQL UPDATE doesn't support ORDER BY/LIMIT, so use a subquery.
    const { rowCount } = await pool.query(
      `UPDATE worker_runs
          SET finished_at    = $1,
              elapsed_ms     = $2,
              items_processed= $3,
              input_tokens   = $4,
              output_tokens  = $5,
              estimated_usd  = $6,
              model          = $7,
              status         = $8,
              metadata       = COALESCE($9::jsonb, metadata)
        WHERE id = (
          SELECT id FROM worker_runs
           WHERE sweeper = $10
             AND finished_at IS NULL
             AND status = 'running'
           ORDER BY started_at DESC
           LIMIT 1
        )`,
      [
        finishedAt,
        elapsedMs,
        itemsProcessed,
        inputTokens,
        outputTokens,
        usd,
        m,
        status,
        metadata ? JSON.stringify(metadata) : null,
        sweeper,
      ],
    );
    // Fall back to INSERT if no open row was found.
    if (!rowCount || rowCount === 0) {
      await pool.query(
        `INSERT INTO worker_runs
           (sweeper, started_at, finished_at, elapsed_ms, items_processed,
            input_tokens, output_tokens, estimated_usd, model, status, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          sweeper,
          new Date(startedAt),
          finishedAt,
          elapsedMs,
          itemsProcessed,
          inputTokens,
          outputTokens,
          usd,
          m,
          status,
          metadata ? JSON.stringify(metadata) : null,
        ],
      );
    }
  } catch (err) {
    process.stderr.write(
      `[worker-cost] failed to record worker_runs row for ${sweeper}: ${err.message}\n`,
    );
  }
  // Structured single-line summary so the parent sweeper's stdout pipe can
  // re-surface it through pino without having to parse arbitrary log spew.
  process.stdout.write(
    `__AI_COST__ ${JSON.stringify({
      sweeper,
      elapsedMs,
      itemsProcessed,
      inputTokens,
      outputTokens,
      estimatedUsd: Number(usd.toFixed(6)),
      model: m,
      status,
    })}\n`,
  );
  return { elapsedMs, estimatedUsd: usd };
}

export async function closeWorkerCostPool() {
  if (sharedPool) {
    try {
      await sharedPool.end();
    } catch {
      /* ignore */
    }
    sharedPool = null;
  }
}
