/**
 * Admin endpoints for the Counsel Region Seeds produced by the Counsel Seed
 * Worker (`scripts/counsel-seed-worker.mjs`).
 *
 * Routes:
 *   GET  /admin/counsel-seeds                          List all seeds, newest first.
 *   POST /admin/counsel-seeds/:id/promote              Mark a seed as active.
 *   POST /admin/counsel-seeds/:id/demote               Revert active → draft.
 *
 * All endpoints require an authenticated admin user (mirrors stripe-admin's
 * requireAdmin pattern).
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { db, usersTable, counselRegionSeedsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { extractToken } from "../lib/auth-middleware";

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

router.get("/admin/counsel-seeds", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(counselRegionSeedsTable)
      .orderBy(desc(counselRegionSeedsTable.seeded_at));
    res.json({ seeds: rows });
  } catch (err) {
    console.error("Failed to list counsel seeds:", err);
    res.status(500).json({ error: "Could not load counsel seeds." });
  }
});

router.post("/admin/counsel-seeds/:id/promote", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid seed id." });
    return;
  }
  try {
    const [updated] = await db
      .update(counselRegionSeedsTable)
      .set({ status: "active", promoted_at: new Date() })
      .where(eq(counselRegionSeedsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Seed not found." });
      return;
    }
    res.json({ seed: updated });
  } catch (err) {
    console.error("Failed to promote counsel seed:", err);
    res.status(500).json({ error: "Could not promote seed." });
  }
});

router.post("/admin/counsel-seeds/:id/demote", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid seed id." });
    return;
  }
  try {
    const [updated] = await db
      .update(counselRegionSeedsTable)
      .set({ status: "draft" })
      .where(eq(counselRegionSeedsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Seed not found." });
      return;
    }
    res.json({ seed: updated });
  } catch (err) {
    console.error("Failed to demote counsel seed:", err);
    res.status(500).json({ error: "Could not demote seed." });
  }
});

export default router;
