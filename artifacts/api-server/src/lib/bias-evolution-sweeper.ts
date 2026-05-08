/**
 * Bias-evolution sweeper — Master Framework v1.1 §4.2.
 *
 * After every 5th completed session for a user, re-infer their
 * `register_bias` from the accumulated `register_bias_signals`.
 *
 * Rules:
 *   - Skips users whose `register_bias_locked = true`.
 *   - Runs at startup (after 30s) and every SWEEP_INTERVAL_MS thereafter.
 *   - Paginates within each tick so ALL eligible users are processed — no
 *     user is starved by a fixed per-tick batch cap.
 *   - The pure `inferRegisterBias` helper is the single source of truth
 *     for the bias → label mapping so unit tests exercise the same logic.
 */
import { db, usersTable, learningTrackSessionsTable } from "@workspace/db";
import { eq, and, sql, gt } from "drizzle-orm";
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
    let updatedCount = 0;
    let lastSeenId: string | null = null;

    // Paginate through all unlocked users so no one is permanently skipped.
    while (true) {
      const conds = [eq(usersTable.register_bias_locked, false)];
      if (lastSeenId !== null) {
        conds.push(gt(usersTable.id, lastSeenId));
      }

      const candidates = await db
        .select({
          id: usersTable.id,
          register_bias: usersTable.register_bias,
          register_bias_signals: usersTable.register_bias_signals,
        })
        .from(usersTable)
        .where(and(...conds))
        .orderBy(usersTable.id)
        .limit(BATCH_SIZE);

      if (candidates.length === 0) break;

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
          // Only re-infer when the count is on a 5-session stride boundary.
          if (completedCount === 0 || completedCount % SESSION_STRIDE !== 0) continue;

          const signals = (user.register_bias_signals ?? []) as RegisterBiasSignal[];
          const newBias = inferRegisterBias(signals);

          if (newBias === user.register_bias) continue;

          await db
            .update(usersTable)
            .set({ register_bias: newBias })
            .where(eq(usersTable.id, user.id));

          updatedCount += 1;
          logger.info(
            { userId: user.id, oldBias: user.register_bias, newBias, completedCount },
            "Register bias evolved",
          );
        } catch (err) {
          logger.error({ err, userId: user.id }, "Bias evolution failed for user");
        }
      }

      lastSeenId = candidates[candidates.length - 1]!.id;
      if (candidates.length < BATCH_SIZE) break;
    }

    if (updatedCount > 0) {
      logger.info({ updatedCount }, "Bias-evolution sweep complete");
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
