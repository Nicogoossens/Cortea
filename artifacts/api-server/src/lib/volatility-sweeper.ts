/**
 * Volatility sweeper — Task #392
 *
 * Periodically flags `cultural_tag_matrix` rows where:
 *   - volatility = 'volatile'
 *   - reviewed_at IS NULL  OR  reviewed_at < NOW() - INTERVAL 'N months'
 *   - needs_review = false   (skip already-flagged rows)
 *
 * Sets needs_review = true on those rows and inserts a worker_runs row.
 * The count is visible in the admin panel via GET /api/admin/import/volatile-review-count.
 *
 * Env:
 *   VOLATILE_REVIEW_MONTHS  — months before a volatile row is re-flagged (default: 6)
 *   VOLATILE_SWEEP_INTERVAL_MS — ms between sweeps (default: 3 600 000 = 1 h)
 */
import { db } from "@workspace/db";
import { culturalTagMatrixTable, workerRunsTable } from "@workspace/db";
import { and, eq, isNull, lt, sql, or } from "drizzle-orm";

const SWEEP_INTERVAL_MS = Number(process.env.VOLATILE_SWEEP_INTERVAL_MS ?? 3_600_000);
const REVIEW_MONTHS     = Number(process.env.VOLATILE_REVIEW_MONTHS     ?? 6);

async function runOnce(): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - REVIEW_MONTHS);

  const result = await db
    .update(culturalTagMatrixTable)
    .set({ needs_review: true })
    .where(
      and(
        eq(culturalTagMatrixTable.volatility,    "volatile"),
        eq(culturalTagMatrixTable.needs_review,  false),
        or(
          isNull(culturalTagMatrixTable.reviewed_at),
          lt(culturalTagMatrixTable.reviewed_at, cutoff),
        ),
      ),
    )
    .returning({ tag_id: culturalTagMatrixTable.tag_id });

  return result.length;
}

async function sweep(): Promise<void> {
  const started_at = new Date();
  let flagged = 0;
  let status: "ok" | "failed" = "ok";

  try {
    flagged = await runOnce();
    if (flagged > 0) {
      console.log(`[volatility-sweeper] ${flagged} volatile rijen geflagged als needs_review (cutoff: ${REVIEW_MONTHS} maanden)`);
    }
  } catch (err) {
    status = "failed";
    console.error("[volatility-sweeper] Fout tijdens sweep:", err);
  }

  const finished_at = new Date();
  const elapsed_ms  = finished_at.getTime() - started_at.getTime();

  try {
    await db.insert(workerRunsTable).values({
      sweeper:         "volatility-sweeper",
      started_at,
      finished_at,
      elapsed_ms,
      items_processed: flagged,
      status,
      metadata: { review_months: REVIEW_MONTHS, flagged },
    });
  } catch (err) {
    console.error("[volatility-sweeper] Kon worker_run niet opslaan:", err);
  }
}

let _timer: ReturnType<typeof setTimeout> | null = null;

export function startVolatilitySweeper(): void {
  if (_timer) return;

  console.log(
    `[volatility-sweeper] Gestart — interval ${SWEEP_INTERVAL_MS / 60_000} min, review na ${REVIEW_MONTHS} maanden`,
  );

  const schedule = () => {
    _timer = setTimeout(async () => {
      await sweep().catch((e) => console.error("[volatility-sweeper] sweep() fout:", e));
      schedule();
    }, SWEEP_INTERVAL_MS);
  };

  sweep().catch((e) => console.error("[volatility-sweeper] initiële sweep fout:", e));
  schedule();
}

export function stopVolatilitySweeper(): void {
  if (_timer) { clearTimeout(_timer); _timer = null; }
}
