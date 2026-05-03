/**
 * Background sweeper that guarantees automatic UI-locale translation for the
 * SOWISO front-end. Whenever new English keys appear in
 * `artifacts/sowiso/src/locales/en/translation.json`, this sweeper detects the
 * gap in any non-EN locale (nl, fr, de, es, pt, it, ar, ja, zh) and spawns the
 * existing `scripts/translate-ui.mjs` worker in --missing mode to fill the
 * gap — without any manual CLI invocation.
 *
 * Strategy:
 *   - On a fixed interval, compare every non-EN locale JSON file's keyset to
 *     the EN source of truth.
 *   - When any locale is short on keys and no child is currently running,
 *     spawn `node scripts/translate-ui.mjs --all --missing`.
 *   - Only one child runs at a time; subsequent ticks no-op until it exits.
 *   - A liveness timer kills hung children so the sweeper keeps making
 *     progress even if a single Anthropic call stalls.
 *
 * Companion to register-calibration-sweeper (translations table content) and
 * register-scenario-translation-sweeper (scenarios.content_i18n).
 */

import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { logger } from "./logger";
import { checkDailyBudget, recordWorkerRun } from "./worker-cost";

const SWEEPER_NAME = "ui-translation";

const SUPPORTED_LOCALES = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CHILD_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

interface LocaleGap {
  locale: string;
  missing: number;
  total: number;
}

let timer: NodeJS.Timeout | null = null;
let child: ChildProcess | null = null;
let childTimer: NodeJS.Timeout | null = null;
let lastRunAt: number | null = null;
let lastSpawnAt: number | null = null;
let lastEnKeyCount: number = 0;
let lastGaps: LocaleGap[] = [];

export interface UiTranslationSweeperStatus {
  enabled: boolean;
  lastRunAt: number | null;
  lastSpawnAt: number | null;
  workerRunning: boolean;
  enKeyCount: number;
  gaps: { locale: string; missing: number; total: number }[];
  totalMissing: number;
}

export function getUiTranslationSweeperStatus(): UiTranslationSweeperStatus {
  return {
    enabled: timer !== null,
    lastRunAt,
    lastSpawnAt,
    workerRunning: child !== null,
    enKeyCount: lastEnKeyCount,
    gaps: lastGaps,
    totalMissing: lastGaps.reduce((a, g) => a + g.missing, 0),
  };
}

/**
 * Walk up from this module to find the repository root that contains the
 * `scripts/` directory and `artifacts/sowiso/src/locales/`. Works in tsx-dev
 * (source files) and esbuild-bundled prod alike.
 */
function findRepoRoot(): string | null {
  const candidates: string[] = [];
  try {
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 8; i++) {
      candidates.push(dir);
      dir = path.dirname(dir);
    }
  } catch { /* fall through */ }
  candidates.push(process.cwd(), path.resolve(process.cwd(), ".."), path.resolve(process.cwd(), "../.."));
  for (const dir of candidates) {
    if (
      existsSync(path.join(dir, "scripts", "translate-ui.mjs")) &&
      existsSync(path.join(dir, "artifacts", "sowiso", "src", "locales", "en", "translation.json"))
    ) {
      return dir;
    }
  }
  return null;
}

function loadKeyset(file: string): Set<string> {
  try {
    const json = JSON.parse(readFileSync(file, "utf8"));
    return new Set(Object.keys(json));
  } catch {
    return new Set();
  }
}

function detectGaps(repoRoot: string): { gaps: LocaleGap[]; enKeyCount: number } {
  const localesDir = path.join(repoRoot, "artifacts/sowiso/src/locales");
  const enFile = path.join(localesDir, "en", "translation.json");
  if (!existsSync(enFile)) return { gaps: [], enKeyCount: 0 };

  const enKeys = loadKeyset(enFile);
  const gaps: LocaleGap[] = [];

  // Discover all locale dirs that actually exist on disk.
  let presentLocales: string[] = [];
  try {
    presentLocales = readdirSync(localesDir).filter((d) =>
      statSync(path.join(localesDir, d)).isDirectory()
    );
  } catch {
    presentLocales = SUPPORTED_LOCALES;
  }

  for (const locale of SUPPORTED_LOCALES) {
    if (!presentLocales.includes(locale)) {
      gaps.push({ locale, missing: enKeys.size, total: 0 });
      continue;
    }
    const file = path.join(localesDir, locale, "translation.json");
    if (!existsSync(file)) {
      gaps.push({ locale, missing: enKeys.size, total: 0 });
      continue;
    }
    const localeKeys = loadKeyset(file);
    let missing = 0;
    for (const k of enKeys) if (!localeKeys.has(k)) missing++;
    if (missing > 0) gaps.push({ locale, missing, total: localeKeys.size });
  }

  return { gaps, enKeyCount: enKeys.size };
}

function clearChild(): void {
  child = null;
  if (childTimer) {
    clearTimeout(childTimer);
    childTimer = null;
  }
}

function spawnWorker(repoRoot: string, gaps: LocaleGap[]): void {
  const scriptPath = path.join(repoRoot, "scripts", "translate-ui.mjs");
  const args = [scriptPath, "--all", "--missing"];

  const proc = spawn(process.execPath, args, {
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    cwd: repoRoot,
  });

  child = proc;
  const startedAt = Date.now();
  logger.info(
    {
      pid: proc.pid,
      gaps: gaps.map((g) => `${g.locale}:${g.missing}`),
      totalMissing: gaps.reduce((a, g) => a + g.missing, 0),
    },
    "UI translation sweeper: worker spawned",
  );

  // The worker script emits its own __AI_COST__ line and inserts the
  // worker_runs row itself; we just surface its log lines here.
  proc.stdout?.on("data", (buf: Buffer) => {
    const msg = buf.toString().trim();
    if (msg) logger.info({ msg }, "ui-translate-worker stdout");
  });
  proc.stderr?.on("data", (buf: Buffer) => {
    const msg = buf.toString().trim();
    if (msg) logger.warn({ msg }, "ui-translate-worker stderr");
  });

  proc.on("exit", (code, signal) => {
    const elapsedMs = Date.now() - startedAt;
    logger.info(
      { code, signal, pid: proc.pid, elapsedMs },
      "UI translation sweeper: worker exited",
    );
    clearChild();
  });

  proc.on("error", (err) => {
    logger.warn({ err }, "UI translation sweeper: spawn error");
    clearChild();
  });

  childTimer = setTimeout(() => {
    if (child === proc && !proc.killed) {
      logger.warn(
        { pid: proc.pid, timeoutMs: CHILD_TIMEOUT_MS },
        "UI translation sweeper: worker timeout, killing",
      );
      try {
        proc.kill("SIGTERM");
        setTimeout(() => {
          if (child === proc && !proc.killed) proc.kill("SIGKILL");
        }, 10_000).unref();
      } catch (e) {
        logger.warn({ err: e }, "UI translation sweeper: kill failed");
        clearChild();
      }
    }
  }, CHILD_TIMEOUT_MS);
  childTimer.unref();
}

export interface UiTranslationSweeperOptions {
  intervalMs?: number;
}

export function startUiTranslationSweeper(opts: UiTranslationSweeperOptions = {}): void {
  if (timer) return;

  const hasAnthropic =
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) &&
    Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY);
  if (!hasAnthropic) {
    logger.info(
      "UI translation sweeper not started: Anthropic env vars are not configured.",
    );
    return;
  }

  const repoRoot = findRepoRoot();
  if (!repoRoot) {
    logger.warn(
      "UI translation sweeper not started: could not locate scripts/translate-ui.mjs and the locales tree.",
    );
    return;
  }

  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;

  const tick = async () => {
    if (child) return;
    try {
      const { gaps, enKeyCount } = detectGaps(repoRoot);
      lastEnKeyCount = enKeyCount;
      lastGaps = gaps;
      lastRunAt = Date.now();
      if (gaps.length === 0) return;

      // Per-day USD spend cap: refuse to spawn the worker if today's
      // accumulated UI-translation spend has already reached the budget.
      const budget = await checkDailyBudget(SWEEPER_NAME);
      if (budget.over) {
        logger.warn(
          { spent: budget.spent, budget: budget.budget, sweeper: SWEEPER_NAME },
          "UI translation sweeper: daily budget reached, skipping worker spawn",
        );
        await recordWorkerRun({
          sweeper: SWEEPER_NAME,
          startedAt: new Date(),
          itemsProcessed: 0,
          inputTokens: 0,
          outputTokens: 0,
          status: "budget_capped",
          metadata: { spent: budget.spent, budget: budget.budget, gaps: gaps.length },
        });
        return;
      }

      logger.info(
        {
          enKeyCount,
          locales: gaps.length,
          totalMissing: gaps.reduce((a, g) => a + g.missing, 0),
        },
        "UI translation sweeper: gap detected, launching worker",
      );
      lastSpawnAt = Date.now();
      spawnWorker(repoRoot, gaps);
    } catch (err) {
      logger.warn({ err }, "UI translation sweeper: tick failed");
    }
  };

  timer = setInterval(tick, intervalMs);
  setTimeout(tick, 20 * 1000).unref();
  if (typeof timer.unref === "function") timer.unref();

  logger.info({ intervalMs, repoRoot }, "UI translation sweeper started");
}

export function stopUiTranslationSweeper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (child) {
    child.kill("SIGTERM");
    clearChild();
  }
}
