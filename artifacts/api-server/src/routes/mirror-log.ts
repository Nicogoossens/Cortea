import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { mirrorScanLogTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import { TIER_FEATURES, type SubscriptionTier } from "../lib/tier-features";

const router = Router();

const MirrorLogSchema = z.object({
  detected_category: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1),
});

router.post("/mirror/log-scan", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [userRecord] = await db
      .select({ subscription_tier: usersTable.subscription_tier })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const tier = ((userRecord?.subscription_tier) ?? "guest") as SubscriptionTier;
    if (!TIER_FEATURES[tier].mirrorAccess) {
      return res.status(403).json({ code: "TIER_REQUIRED", error: "Mirror access requires an Ambassador subscription." });
    }

    const parsed = MirrorLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "detected_category and confidence are required." });
    }

    const { detected_category, confidence } = parsed.data;

    await db.insert(mirrorScanLogTable).values({
      user_id: userId,
      detected_category,
      confidence,
    });

    return res.json({ logged: true });
  } catch (err) {
    req.log.error({ err }, "Failed to log mirror scan");
    return res.status(500).json({ error: "Could not log scan at this moment." });
  }
});

export default router;
