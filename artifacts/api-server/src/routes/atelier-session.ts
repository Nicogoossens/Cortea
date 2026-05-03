import { Router } from "express";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import { awardSessionMasterBadge } from "../lib/badge-service";

const router = Router();

const CompleteSessionSchema = z.object({
  answered: z.number().int().min(0),
  total: z.number().int().min(0),
  correct: z.number().int().min(0),
});

const MIN_SESSION_LENGTH = 3;

router.post("/atelier/session/complete", requireAuthUser, async (req, res) => {
  try {
    const parsed = CompleteSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid session payload." });
    }
    const { answered, total, correct } = parsed.data;

    const completedFullSession =
      total >= MIN_SESSION_LENGTH && answered >= total && correct >= 0;

    if (!completedFullSession) {
      return res.json({ awarded_badge: null });
    }

    const userId = getResolvedUserId(req);
    const awarded = await awardSessionMasterBadge(userId);
    return res.json({ awarded_badge: awarded });
  } catch (err) {
    req.log.error({ err }, "Failed to complete atelier session");
    return res.status(500).json({ error: "Unable to record session completion." });
  }
});

export default router;
