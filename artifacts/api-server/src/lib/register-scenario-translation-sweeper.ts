/**
 * Background sweeper that guarantees automatic scenario translation for any
 * `scenarios` row whose `content_i18n` is NULL — regardless of the write path
 * that produced the row (admin import, post-merge seed, ad-hoc SQL, future
 * code paths).
 *
 * This is the safety net that satisfies the "no manual CLI step" requirement
 * for scenario content. The companion register-calibration-sweeper handles
 * `translations` rows; this sweeper handles `scenarios.{title,content}_i18n`.
 *
 * Strategy:
 *   - On a fixed interval, count scenarios with content_i18n IS NULL.
 *   - When > 0 and no child currently running, spawn the existing
 *     `scripts/scenario-translate.mjs` worker as a detached child process.
 *   - The api-server process (long-lived) keeps the child alive even when
 *     interactive shell sessions close, which is why this works where ad-hoc
 *     `nohup ... &` invocations from a shell did not.
 *   - Only one child runs at a time; subsequent ticks no-op until it exits.
 */

import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { db, scenariosTable } from "@workspace/db";
import { isNull, sql } from "drizzle-orm";
import { logger } from "./logger";

const DEFAULT_BATCH = 25;
const DEFAULT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const CHILD_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes — covers worst-case batch

let timer: NodeJS.Timeout | null = null;
let child: ChildProcess | null = null;
let childStartedAt: number = 0;
let childTimer: NodeJS.Timeout | null = null;

/**
 * Resolve the path to scripts/scenario-translate.mjs robustly across launch
 * modes: dev (tsx, source files), prod (esbuild bundle in dist/), and any
 * future repo restructure. Walks up from the current file/cwd looking for the
 * scripts/ directory, so it works regardless of process.cwd().
 */
function resolveWorkerScript(): string {
  const candidates: string[] = [];
  try {
    // When this module is loaded from source (tsx), import.meta.url points
    // into artifacts/api-server/src/lib/. Walk up until we find scripts/.
    const here = path.dirname(fileURLToPath(import.meta.url));
    let dir = here;
    for (let i = 0; i < 8; i++) {
      candidates.push(path.join(dir, "scripts", "scenario-translate.mjs"));
      dir = path.dirname(dir);
    }
  } catch {
    // import.meta.url not available — fall through to cwd-based candidates.
  }
  // Also try cwd-relative locations as a last resort.
  candidates.push(path.resolve(process.cwd(), "scripts/scenario-translate.mjs"));
  candidates.push(path.resolve(process.cwd(), "../../scripts/scenario-translate.mjs"));
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    `Could not locate scripts/scenario-translate.mjs. Tried: ${candidates.join(", ")}`,
  );
}

async function countPending(): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(scenariosTable)
    .where(isNull(scenariosTable.content_i18n));
  return rows[0]?.n ?? 0;
}

async function findPendingRange(
  batch: number,
): Promise<{ from: number; to: number } | null> {
  const rows = await db
    .select({ id: scenariosTable.id })
    .from(scenariosTable)
    .where(isNull(scenariosTable.content_i18n))
    .orderBy(scenariosTable.id)
    .limit(batch);
  if (rows.length === 0) return null;
  return { from: rows[0]!.id, to: rows[rows.length - 1]!.id };
}

function clearChild(): void {
  child = null;
  if (childTimer) {
    clearTimeout(childTimer);
    childTimer = null;
  }
}

function spawnWorker(from: number, to: number): void {
  let scriptPath: string;
  try {
    scriptPath = resolveWorkerScript();
  } catch (err) {
    logger.warn({ err }, "Scenario translation sweeper: cannot locate worker script");
    return;
  }
  const args = [scriptPath, "--from", String(from), "--to", String(to)];
  const proc = spawn(process.execPath, args, {
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  child = proc;
  childStartedAt = Date.now();
  logger.info(
    { pid: proc.pid, from, to, scriptPath },
    "Scenario translation sweeper: worker spawned",
  );

  proc.stdout?.on("data", () => {});
  proc.stderr?.on("data", (buf: Buffer) => {
    const msg = buf.toString().trim();
    if (msg) logger.warn({ msg }, "Scenario translation worker stderr");
  });

  proc.on("exit", (code, signal) => {
    const elapsedMs = Date.now() - childStartedAt;
    logger.info(
      { code, signal, pid: proc.pid, elapsedMs },
      "Scenario translation sweeper: worker exited",
    );
    clearChild();
  });

  proc.on("error", (err) => {
    logger.warn({ err }, "Scenario translation sweeper: spawn error");
    clearChild();
  });

  // Liveness guard: if the worker hangs (network stall, prompt loop, etc.)
  // kill it so the next sweeper tick can spawn a fresh one. Without this the
  // `child` reference would stay set forever and the sweeper would silently
  // stop making progress.
  childTimer = setTimeout(() => {
    if (child === proc && !proc.killed) {
      logger.warn(
        { pid: proc.pid, timeoutMs: CHILD_TIMEOUT_MS },
        "Scenario translation sweeper: worker timeout, killing",
      );
      try {
        proc.kill("SIGTERM");
        // Force-kill 10s later if SIGTERM ignored.
        setTimeout(() => {
          if (child === proc && !proc.killed) proc.kill("SIGKILL");
        }, 10_000).unref();
      } catch (e) {
        logger.warn({ err: e }, "Scenario translation sweeper: kill failed");
        clearChild();
      }
    }
  }, CHILD_TIMEOUT_MS);
  childTimer.unref();
}

export interface ScenarioSweeperOptions {
  intervalMs?: number;
  batchSize?: number;
}

export function startScenarioTranslationSweeper(
  opts: ScenarioSweeperOptions = {},
): void {
  if (timer) return;

  const hasAnthropic =
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) &&
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY);

  if (!hasAnthropic) {
    logger.info(
      "Scenario translation sweeper not started: Anthropic env vars are not configured.",
    );
    return;
  }

  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const batchSize = opts.batchSize ?? DEFAULT_BATCH;

  const tick = async () => {
    if (child) return;
    try {
      const pending = await countPending();
      if (pending === 0) return;
      const range = await findPendingRange(batchSize);
      if (!range) return;
      logger.info(
        { pending, batch: range },
        "Scenario translation sweeper: launching worker",
      );
      spawnWorker(range.from, range.to);
    } catch (err) {
      logger.warn({ err }, "Scenario translation sweeper: tick failed");
    }
  };

  timer = setInterval(tick, intervalMs);
  setTimeout(tick, 15 * 1000).unref();
  if (typeof timer.unref === "function") timer.unref();

  logger.info(
    { intervalMs, batchSize },
    "Scenario translation sweeper started",
  );
}

export function stopScenarioTranslationSweeper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (child) {
    child.kill("SIGTERM");
    clearChild();
  }
}
