/**
 * Admin endpoint for seeding compass-history snapshots on demand.
 *
 * Routes:
 *   POST /admin/seed-compass-history — inserts today's snapshot for every
 *     user who does not yet have one for today (UTC). Idempotent: safe to
 *     call multiple times within the same day.
 *
 * This is the manual trigger for the same logic that the daily
 * compass-history cron runs automatically. Useful immediately after
 * deployment so the 30-day evolution overlay on the radar chart is
 * populated for all existing users without waiting for tomorrow's cron.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractToken } from "../lib/auth-middleware";
import { runCompassHistoryTick } from "../lib/compass-history-cron";

const router = Router();

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
    res.status(500).json({ error: "A difficulty arose validating your session." });
  }
}

router.post("/admin/seed-compass-history", requireAdmin, async (_req, res) => {
  try {
    const { snapshotCount, busy } = await runCompassHistoryTick();
    if (busy) {
      return res.status(409).json({
        ok: false,
        busy: true,
        message: "A snapshot sweep is already in progress. Please try again in a moment.",
      });
    }
    return res.json({
      ok: true,
      snapshots_written: snapshotCount,
      message: snapshotCount > 0
        ? `${snapshotCount} snapshot(s) written for today.`
        : "All users already have a snapshot for today — nothing to do.",
    });
  } catch (err) {
    console.error("Failed to seed compass history:", err);
    return res.status(500).json({ error: "The compass-history seed encountered a difficulty." });
  }
});

export default router;
