import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { mirrorScanLogTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractToken } from "../lib/auth-middleware";

const router = Router();

const MirrorLogSchema = z.object({
  detected_category: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1),
});

router.post("/mirror/log-scan", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Invalid session." });
    }

    const parsed = MirrorLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "detected_category and confidence are required." });
    }

    const { detected_category, confidence } = parsed.data;

    await db.insert(mirrorScanLogTable).values({
      user_id: user.id,
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
