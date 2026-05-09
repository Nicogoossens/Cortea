/**
 * Compass-history cron — Master Framework v1.1 §9.4.
 *
 * Once per day (configurable interval), snapshots every user's current
 * Compass scores into `compass_history`. The frontend uses this table to
 * render the 30-day evolution overlay on the radar chart.
 *
 * A snapshot is skipped for a user if one already exists for today (UTC)
 * so the cron is safe to run multiple times within a day.
 *
 * Scores are derived from `users.behavior_profile` via `projectBehaviorToCompass`
 * (the same pure function used on session completion). When a user has no
 * behavior_profile yet, DEFAULT_BEHAVIOR_PROFILE is used so the radar chart
 * always has a baseline to render.
 *
 * Pagination: processes all users in batches within each tick run — no user
 * is permanently starved because of a fixed per-tick cap.
 */
import { db, usersTable, compassHistoryTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import {
  projectBehaviorToCompass,
  type PureBehaviorProfile,
} from "./learning-engine-pure";

const SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_SIZE = 200;

const DEFAULT_BEHAVIOR: PureBehaviorProfile = {
  listening_score: 50,
  assertiveness_style: "assertive",
  conflict_mode: "collaborate",
  eq_dimensions: {
    self_awareness: 50,
    self_regulation: 50,
    empathy: 50,
    social_skill: 50,
  },
  nonverbal_awareness: 50,
};

let timer: NodeJS.Timeout | null = null;
let busy = false;

export async function runCompassHistoryTick(): Promise<{ snapshotCount: number; busy: boolean }> {
  if (busy) return { snapshotCount: 0, busy: true };
  busy = true;
  let totalSnapshots = 0;
  try {
    const utcDayStart = new Date();
    utcDayStart.setUTCHours(0, 0, 0, 0);
    const now = new Date();

    let lastSeenId: string | null = null;
    while (true) {
      const candidates = await db.execute<{
        id: string;
        behavior_profile: PureBehaviorProfile | null;
      }>(sql`
        SELECT u.id, u.behavior_profile
        FROM users u
        LEFT JOIN compass_history ch
          ON ch.user_id = u.id
          AND ch.recorded_at >= ${utcDayStart}
        WHERE ch.id IS NULL
          ${lastSeenId !== null ? sql`AND u.id > ${lastSeenId}` : sql``}
        ORDER BY u.id
        LIMIT ${BATCH_SIZE}
      `);

      const rows = candidates.rows;
      if (rows.length === 0) break;

      for (const u of rows) {
        try {
          const profile = (u.behavior_profile ?? DEFAULT_BEHAVIOR) as PureBehaviorProfile;
          const scores = projectBehaviorToCompass(profile);
          await db.insert(compassHistoryTable).values({
            user_id: u.id,
            ...scores,
            recorded_at: now,
          });
          totalSnapshots += 1;
        } catch (err) {
          logger.error({ err, userId: u.id }, "Compass-history snapshot failed for user");
        }
      }

      lastSeenId = rows[rows.length - 1]!.id;
      if (rows.length < BATCH_SIZE) break;
    }

    if (totalSnapshots > 0) {
      logger.info({ snapshotCount: totalSnapshots }, "Compass-history snapshots written");
    }
  } finally {
    busy = false;
  }
  return { snapshotCount: totalSnapshots, busy: false };
}

async function tick(): Promise<void> {
  try {
    await runCompassHistoryTick();
  } catch (err) {
    logger.error({ err }, "Compass-history cron tick failed");
  }
}

export function startCompassHistoryCron(intervalMs: number = SWEEP_INTERVAL_MS): void {
  if (timer) return;
  // First tick runs immediately at startup so the overlay is populated on day 0.
  void tick();
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  logger.info({ intervalMs }, "Compass-history cron started");
}
