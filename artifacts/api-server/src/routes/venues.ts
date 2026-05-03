import { Router } from "express";
import { db, savedVenuesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { getVenues, VENUES, type VenueCategory, type Venue } from "../data/venues";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";

const router = Router();

const VALID_CATEGORIES: VenueCategory[] = [
  "shops", "dining", "activities", "accommodations", "transport",
];

router.get("/venues", (req, res) => {
  const region = typeof req.query.region === "string" ? req.query.region.toUpperCase() : undefined;
  const category = typeof req.query.category === "string" ? req.query.category as VenueCategory : undefined;

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
    return;
  }

  const venues = getVenues(region, category);
  res.json({ venues });
});

/**
 * GET /api/venues/saved
 * Returns the caller's saved venues, hydrated with the curated venue payload
 * (so the client does not need to re-fetch every region). Newest saves first.
 */
router.get("/venues/saved", requireAuthUser, async (req, res) => {
  const userId = getResolvedUserId(req);
  try {
    const rows = await db
      .select()
      .from(savedVenuesTable)
      .where(eq(savedVenuesTable.user_id, userId))
      .orderBy(desc(savedVenuesTable.saved_at));

    const byId = new Map<string, Venue>(VENUES.map((v) => [v.id, v]));
    const venues = rows
      .map((r) => {
        const venue = byId.get(r.venue_id);
        if (!venue) return null;
        return { ...venue, savedAt: r.saved_at.toISOString() };
      })
      .filter((v): v is Venue & { savedAt: string } => v !== null);

    res.json({ venues });
  } catch (err) {
    req.log.error({ err }, "Failed to list saved venues");
    res.status(500).json({ error: "Saved venues are temporarily unavailable." });
  }
});

/**
 * POST /api/venues/saved  { venue_id }
 * Bookmarks a venue for the caller. Idempotent — re-saving an existing
 * venue is treated as a no-op success.
 */
router.post("/venues/saved", requireAuthUser, async (req, res) => {
  const userId = getResolvedUserId(req);
  const { venue_id } = req.body as { venue_id?: unknown };

  if (typeof venue_id !== "string" || !venue_id.trim()) {
    res.status(400).json({ error: "A valid venue_id is required." });
    return;
  }

  const venue = VENUES.find((v) => v.id === venue_id);
  if (!venue) {
    res.status(404).json({ error: "Venue not found." });
    return;
  }

  try {
    await db
      .insert(savedVenuesTable)
      .values({ user_id: userId, venue_id })
      .onConflictDoNothing({ target: [savedVenuesTable.user_id, savedVenuesTable.venue_id] });

    res.json({ saved: true, venue_id });
  } catch (err) {
    req.log.error({ err }, "Failed to save venue");
    res.status(500).json({ error: "Saving the venue did not complete." });
  }
});

/**
 * DELETE /api/venues/saved/:venue_id
 * Removes a previously-saved venue. Idempotent — deleting a non-saved
 * venue still returns 200.
 */
router.delete("/venues/saved/:venue_id", requireAuthUser, async (req, res) => {
  const userId = getResolvedUserId(req);
  const venue_id = req.params.venue_id;

  if (!venue_id) {
    res.status(400).json({ error: "A venue_id is required." });
    return;
  }

  try {
    await db
      .delete(savedVenuesTable)
      .where(and(
        eq(savedVenuesTable.user_id, userId),
        eq(savedVenuesTable.venue_id, venue_id),
      ));

    res.json({ saved: false, venue_id });
  } catch (err) {
    req.log.error({ err }, "Failed to remove saved venue");
    res.status(500).json({ error: "Removing the saved venue did not complete." });
  }
});

export default router;
