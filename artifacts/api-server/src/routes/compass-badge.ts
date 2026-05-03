import { Router } from "express";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import { awardCompassBadge } from "../lib/badge-service";

const router = Router();

const VALID_REGION_CODES = new Set([
  "GB", "US", "AE", "CN", "JP", "FR", "DE", "NL", "AU", "CA",
  "IT", "IN", "ES", "PT", "SG", "BR", "ZA", "MX", "CO", "BE", "CH",
]);

/**
 * POST /api/compass/:regionCode/visited
 * Marks that the authenticated user has visited a Compass region page and
 * awards the corresponding compass badge (idempotent — safe to call on every visit).
 * Returns { badge } where badge is the awarded badge or null if already held.
 */
router.post("/compass/:regionCode/visited", requireAuthUser, async (req, res) => {
  const regionCode = (req.params.regionCode ?? "").toUpperCase();

  if (!VALID_REGION_CODES.has(regionCode)) {
    res.status(400).json({ error: `Unknown region code: ${regionCode}` });
    return;
  }

  try {
    const userId = getResolvedUserId(req);
    const badge = await awardCompassBadge(userId, regionCode);
    res.json({ badge });
  } catch (err) {
    console.error("[compass-badge] Failed to award badge:", err);
    res.status(500).json({ error: "Failed to award badge" });
  }
});

export default router;
