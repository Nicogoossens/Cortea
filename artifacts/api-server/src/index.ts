import app from "./app";
import { logger } from "./lib/logger";
import { startCalibrationSweeper } from "./lib/register-calibration-sweeper";
import { startScenarioTranslationSweeper } from "./lib/register-scenario-translation-sweeper";
import { startUiTranslationSweeper } from "./lib/ui-translation-sweeper";
import { startRegisterUiAuditSweeper } from "./lib/register-ui-audit-sweeper";
import { startTrialReminderSweeper } from "./lib/trial-reminder-sweeper";
import { startBiasEvolutionSweeper } from "./lib/bias-evolution-sweeper";
import { startCompassHistoryCron } from "./lib/compass-history-cron";
import { startVolatilitySweeper } from "./lib/volatility-sweeper";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Background safety net: any translations row written directly (CLI scripts,
  // future code paths, ad-hoc SQL) that is a content key with no calibration
  // stamp will be picked up by this sweeper on its next pass, so register
  // calibration is applied automatically with no manual CLI step required.
  startCalibrationSweeper();

  // Companion safety net for `scenarios.content_i18n`: any scenario row
  // inserted by any path (admin import, post-merge seed, ad-hoc SQL) without
  // translations will be picked up by this sweeper on its next pass and
  // handed to the scenario-translate worker — no manual CLI step required.
  startScenarioTranslationSweeper();

  // Companion safety net for the front-end i18n locale JSON files: any new
  // English key added to artifacts/sowiso/src/locales/en/translation.json is
  // detected and filled in for nl/fr/de/es/pt/it/ar/ja/zh on the next pass.
  // No manual `node scripts/translate-ui.mjs` call is required.
  startUiTranslationSweeper();

  // Companion safety net for the `translations` table UI rows: any new or
  // changed UI string for either the elite OR middle-class register that
  // hasn't been quality-reviewed yet is automatically evaluated and stamped.
  // No manual `node scripts/elite-register-worker.mjs` call is required.
  startRegisterUiAuditSweeper();

  // Dispatches a single email + SMS reminder ~3 days before any
  // 14-day trial ends, so users are never surprised by a charge.
  startTrialReminderSweeper();

  // §4.2 Master Framework: re-infer register_bias from accumulated signals
  // every 5th completed session per user.
  startBiasEvolutionSweeper();

  // §9.4 Master Framework: write daily Compass-score snapshots into
  // compass_history for the 30-day radar evolution overlay.
  startCompassHistoryCron();

  // Task #392: periodically flag volatile cultural_tag_matrix rows that
  // haven't been reviewed in VOLATILE_REVIEW_MONTHS months (default: 6).
  // Count visible in admin panel via GET /api/admin/import/volatile-review-count.
  startVolatilitySweeper();

  // Step-5 dev smoketest: after startup, run the i18n-audit script once and
  // log its summary so missing-key drift is visible in the dev console.
  // Skipped in production to avoid slowing real boot.
  if (process.env.NODE_ENV !== "production") {
    setTimeout(() => {
      try {
        const here = path.dirname(fileURLToPath(import.meta.url));
        let dir = here;
        let repoRoot: string | null = null;
        for (let i = 0; i < 10; i++) {
          if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
            repoRoot = dir;
            break;
          }
          const parent = path.dirname(dir);
          if (parent === dir) break;
          dir = parent;
        }
        if (!repoRoot) return;
        const auditScript = path.join(
          repoRoot,
          "artifacts/sowiso/scripts/i18n-audit.mjs",
        );
        if (!existsSync(auditScript)) return;
        const child = spawn("node", [auditScript], {
          cwd: repoRoot,
          stdio: ["ignore", "pipe", "pipe"],
        });
        let out = "";
        child.stdout.on("data", (d) => (out += d.toString()));
        child.stderr.on("data", (d) => (out += d.toString()));
        child.on("close", (code) => {
          const tail = out.trim().split("\n").slice(-20).join("\n");
          logger.info(
            { exitCode: code, summary: tail },
            "i18n-audit smoketest complete",
          );
        });
        child.on("error", (err) =>
          logger.warn({ err }, "i18n-audit smoketest failed to spawn"),
        );
      } catch (err) {
        logger.warn({ err }, "i18n-audit smoketest setup failed");
      }
    }, 60 * 1000).unref();
  }
});
