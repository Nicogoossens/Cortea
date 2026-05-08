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
 */
import { db, usersTable, compassHistoryTable } from "@workspace/db";
import { eq, sql, and, gte } from "drizzle-orm";
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

async function tick(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    const utcDayStart = new Date();
    utcDayStart.setUTCHours(0, 0, 0, 0);

    // Find users who have not yet received a snapshot today.
    // We left-join compass_history and filter WHERE ch.id IS NULL.
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
      LIMIT ${BATCH_SIZE}
    `);

    const rows = candidates.rows;
    if (rows.length === 0) return;

    const now = new Date();
    const inserts = rows.map((u) => {
      const profile = (u.behavior_profile ?? DEFAULT_BEHAVIOR) as PureBehaviorProfile;
      const scores = projectBehaviorToCompass(profile);
      return {
        user_id: u.id,
        ...scores,
        recorded_at: now,
      };
    });

    // Batch insert; individual failures logged, not re-thrown.
    for (const row of inserts) {
      try {
        await db.insert(compassHistoryTable).values(row);
      } catch (err) {
        logger.error({ err, userId: row.user_id }, "Compass-history snapshot failed for user");
      }
    }

    logger.info({ snapshotCount: inserts.length }, "Compass-history snapshots written");
  } catch (err) {
    logger.error({ err }, "Compass-history cron tick failed");
  } finally {
    busy = false;
  }
}

export function startCompassHistoryCron(intervalMs: number = SWEEP_INTERVAL_MS): void {
  if (timer) return;
  // First run ~2 minutes after boot (well after other sweepers).
  setTimeout(() => void tick(), 2 * 60 * 1000).unref();
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  logger.info({ intervalMs }, "Compass-history cron started");
}
