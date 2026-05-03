import { Router, type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractToken } from "../lib/auth-middleware";
import { getUiTranslationSweeperStatus } from "../lib/ui-translation-sweeper";
import { getCalibrationSweeperStatus } from "../lib/register-calibration-sweeper";
import { getScenarioSweeperStatus } from "../lib/register-scenario-translation-sweeper";

const router = Router();

const SUPPORTED_UI_LOCALES = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const [user] = await db
      .select({ id: usersTable.id, is_admin: usersTable.is_admin })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token is not recognised." });
      return;
    }
    if (!user.is_admin) {
      res.status(403).json({ error: "This section is restricted to administrators." });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Authorisation lookup failed." });
  }
}

function findRepoRoot(): string | null {
  const candidates: string[] = [];
  try {
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 10; i++) {
      candidates.push(dir);
      dir = path.dirname(dir);
    }
  } catch { /* ignore */ }
  candidates.push(process.cwd(), path.resolve(process.cwd(), ".."), path.resolve(process.cwd(), "../.."));
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "artifacts", "sowiso", "src", "locales", "en", "translation.json"))) {
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

interface UiLocaleCoverage {
  locale: string;
  enKeys: number;
  localeKeys: number;
  missing: number;
  pct: number;
}

function computeUiCoverage(): { enKeys: number; perLocale: UiLocaleCoverage[] } {
  const repoRoot = findRepoRoot();
  if (!repoRoot) return { enKeys: 0, perLocale: [] };
  const localesDir = path.join(repoRoot, "artifacts/sowiso/src/locales");
  const enFile = path.join(localesDir, "en", "translation.json");
  if (!existsSync(enFile)) return { enKeys: 0, perLocale: [] };
  const enKeys = loadKeyset(enFile);

  let presentLocales: string[] = [];
  try {
    presentLocales = readdirSync(localesDir).filter((d) =>
      statSync(path.join(localesDir, d)).isDirectory(),
    );
  } catch {
    presentLocales = SUPPORTED_UI_LOCALES;
  }

  const perLocale: UiLocaleCoverage[] = [];
  for (const locale of SUPPORTED_UI_LOCALES) {
    const file = path.join(localesDir, locale, "translation.json");
    if (!presentLocales.includes(locale) || !existsSync(file)) {
      perLocale.push({ locale, enKeys: enKeys.size, localeKeys: 0, missing: enKeys.size, pct: 0 });
      continue;
    }
    const localeKeys = loadKeyset(file);
    let missing = 0;
    for (const k of enKeys) if (!localeKeys.has(k)) missing++;
    const pct = enKeys.size > 0 ? Math.round(((enKeys.size - missing) / enKeys.size) * 100) : 100;
    perLocale.push({
      locale,
      enKeys: enKeys.size,
      localeKeys: localeKeys.size,
      missing,
      pct,
    });
  }
  return { enKeys: enKeys.size, perLocale };
}

router.get("/admin/translation-health", requireAdmin, async (_req, res) => {
  try {
    const ui = computeUiCoverage();
    const uiSweeper = getUiTranslationSweeperStatus();
    const calibrationSweeper = await getCalibrationSweeperStatus();
    const scenarioSweeper = await getScenarioSweeperStatus();

    const totalUiMissing = ui.perLocale.reduce((a, l) => a + l.missing, 0);
    const uiHealthy = ui.enKeys > 0 && totalUiMissing === 0;
    // pendingRows === -1 indicates a lookup failure; treat as unknown/unhealthy
    // so the overall badge can never turn green on a broken probe.
    const calibrationLookupOk = calibrationSweeper.pendingRows >= 0;
    const calibrationHealthy = calibrationLookupOk && calibrationSweeper.pendingRows === 0;
    const scenarioLookupOk = scenarioSweeper.pendingScenarios >= 0;
    const scenarioHealthy = scenarioLookupOk && scenarioSweeper.pendingScenarios === 0;
    const allHealthy = uiHealthy && calibrationHealthy && scenarioHealthy;

    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      overall: {
        healthy: allHealthy,
        ui_healthy: uiHealthy,
        calibration_healthy: calibrationHealthy,
        scenario_healthy: scenarioHealthy,
      },
      ui_locales: {
        en_key_count: ui.enKeys,
        total_missing: totalUiMissing,
        per_locale: ui.perLocale,
        sweeper: {
          enabled: uiSweeper.enabled,
          worker_running: uiSweeper.workerRunning,
          last_run_at: uiSweeper.lastRunAt,
          last_spawn_at: uiSweeper.lastSpawnAt,
        },
      },
      calibration: {
        pending_rows: calibrationSweeper.pendingRows,
        last_processed: calibrationSweeper.lastProcessed,
        last_errors: calibrationSweeper.lastErrors,
        sweeper: {
          enabled: calibrationSweeper.enabled,
          running: calibrationSweeper.running,
          last_run_at: calibrationSweeper.lastRunAt,
        },
      },
      scenarios: {
        pending: scenarioSweeper.pendingScenarios,
        sweeper: {
          enabled: scenarioSweeper.enabled,
          worker_running: scenarioSweeper.workerRunning,
          last_run_at: scenarioSweeper.lastRunAt,
          last_spawn_at: scenarioSweeper.lastSpawnAt,
          last_worker_exit_at: scenarioSweeper.lastWorkerExitAt,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute translation health.", detail: String(err) });
  }
});

export default router;
