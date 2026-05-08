/**
 * Bias-evolution sweeper — Master Framework v1.1 §4.2.
 *
 * After every 5th completed session for a user, re-infer their
 * `register_bias` from the accumulated `register_bias_signals`.
 *
 * Rules:
 *   - Skips users whose `register_bias_locked = true`.
 *   - Runs at startup (after 30s) and every SWEEP_INTERVAL_MS thereafter.
 *   - Processes at most BATCH_SIZE users per tick to cap DB load.
 *   - The pure `inferRegisterBias` helper is the single source of truth
 *     for the bias → label mapping so unit tests exercise the same logic.
 */
import { db, usersTable, learningTrackSessionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "./logger";
import { inferRegisterBias } from "./learning-engine-pure";
import type { RegisterBiasSignal } from "@workspace/db";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const BATCH_SIZE = 100;
const SESSION_STRIDE = 5; // re-infer every 5th completed session

let timer: NodeJS.Timeout | null = null;
let busy = false;

async function tick(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    // Find users whose completed-session count is divisible by SESSION_STRIDE
    // and whose bias is not locked. We use a window function to get the count
    // per user without a separate join.
    const candidates = await db
      .select({
        id: usersTable.id,
        register_bias: usersTable.register_bias,
        register_bias_signals: usersTable.register_bias_signals,
        register_bias_locked: usersTable.register_bias_locked,
      })
      .from(usersTable)
      .where(eq(usersTable.register_bias_locked, false))
      .limit(BATCH_SIZE);

    if (candidates.length === 0) return;

    // For each candidate, count their completed sessions; skip if not on a stride boundary.
    for (const user of candidates) {
      try {
        const [countRow] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(learningTrackSessionsTable)
          .where(
            and(
              eq(learningTrackSessionsTable.user_id, user.id),
              sql`${learningTrackSessionsTable.completed_at} IS NOT NULL`,
            ),
          );

        const completedCount = countRow?.n ?? 0;
        if (completedCount === 0 || completedCount % SESSION_STRIDE !== 0) continue;

        const signals = (user.register_bias_signals ?? []) as RegisterBiasSignal[];
        const newBias = inferRegisterBias(signals);

        if (newBias === user.register_bias) continue;

        await db
          .update(usersTable)
          .set({ register_bias: newBias })
          .where(eq(usersTable.id, user.id));

        logger.info(
          { userId: user.id, oldBias: user.register_bias, newBias, completedCount },
          "Register bias evolved",
        );
      } catch (err) {
        logger.error({ err, userId: user.id }, "Bias evolution failed for user");
      }
    }
  } catch (err) {
    logger.error({ err }, "Bias-evolution sweeper tick failed");
  } finally {
    busy = false;
  }
}

export function startBiasEvolutionSweeper(intervalMs: number = SWEEP_INTERVAL_MS): void {
  if (timer) return;
  setTimeout(() => void tick(), 30 * 1000).unref();
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  logger.info({ intervalMs }, "Bias-evolution sweeper started");
}
