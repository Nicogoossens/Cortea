import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * GET /api/regions/available
 * Returns the distinct region codes that have at least one learning-track question
 * in the database. This is used to drive the three-tier visual hierarchy in the
 * Counsel region picker: available → active_soon → coming_soon.
 * No authentication required — the list of available regions is public information.
 */
router.get("/api/regions/available", async (_req, res) => {
  try {
    const result = await db.execute(
      sql`SELECT DISTINCT region_code FROM learning_track_questions WHERE region_code IS NOT NULL ORDER BY region_code`
    );
    const codes: string[] = result.rows.map((row: Record<string, unknown>) => row.region_code as string);
    res.json({ codes });
  } catch (err) {
    console.error("[regions/available]", err);
    res.status(500).json({ error: "Failed to fetch available regions" });
  }
});

export default router;
