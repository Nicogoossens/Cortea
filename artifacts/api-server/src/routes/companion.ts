import { Router } from "express";
import { db } from "@workspace/db";
import {
  companionLinksTable, usersTable, zuil_voortgangTable,
  nobleScoreLogTable, roleplayCompletionsTable,
} from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";

const router = Router();

async function getCompanionLink(userId: string) {
  const links = await db.select().from(companionLinksTable)
    .where(
      or(
        eq(companionLinksTable.user_a_id, userId),
        eq(companionLinksTable.user_b_id, userId),
      )
    ).limit(1);
  return links[0] ?? null;
}

router.get("/companion", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const link = await getCompanionLink(userId);

    if (!link) {
      return res.json({ linked: false });
    }

    const companionId = link.user_a_id === userId ? link.user_b_id : link.user_a_id;
    const isA = link.user_a_id === userId;
    const myShareFlag = isA ? link.share_progress_a : link.share_progress_b;
    const theirShareFlag = isA ? link.share_progress_b : link.share_progress_a;

    const [me] = await db.select({ full_name: usersTable.full_name, username: usersTable.username, noble_score: usersTable.noble_score })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    const [companion] = await db.select({ full_name: usersTable.full_name, username: usersTable.username, noble_score: usersTable.noble_score })
      .from(usersTable).where(eq(usersTable.id, companionId)).limit(1);

    const myPillars = await db.select().from(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));
    const theirPillars = theirShareFlag
      ? await db.select().from(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, companionId))
      : [];

    const myCompletions = await db.select().from(roleplayCompletionsTable)
      .where(eq(roleplayCompletionsTable.user_id, userId))
      .orderBy(desc(roleplayCompletionsTable.completed_at))
      .limit(20);

    const theirCompletions = theirShareFlag
      ? await db.select().from(roleplayCompletionsTable)
          .where(eq(roleplayCompletionsTable.user_id, companionId))
          .orderBy(desc(roleplayCompletionsTable.completed_at))
          .limit(20)
      : [];

    return res.json({
      linked: true,
      link_id: link.id,
      my_share_enabled: myShareFlag,
      companion_share_enabled: theirShareFlag,
      me: {
        id: userId,
        name: me?.full_name ?? me?.username ?? "You",
        noble_score: me?.noble_score ?? 0,
        pillars: myPillars,
        roleplay_completions: myCompletions,
      },
      companion: {
        id: companionId,
        name: companion?.full_name ?? companion?.username ?? "Your companion",
        noble_score: theirShareFlag ? (companion?.noble_score ?? 0) : null,
        pillars: theirPillars,
        roleplay_completions: theirCompletions,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch companion data");
    return res.status(500).json({ error: "Unable to load companion dashboard." });
  }
});

const ShareSettingSchema = z.object({ enabled: z.boolean() });

router.patch("/companion/share", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const parsed = ShareSettingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body." });

    const link = await getCompanionLink(userId);
    if (!link) return res.status(404).json({ error: "No companion link found." });

    const isA = link.user_a_id === userId;
    await db.update(companionLinksTable)
      .set(isA ? { share_progress_a: parsed.data.enabled } : { share_progress_b: parsed.data.enabled })
      .where(eq(companionLinksTable.id, link.id));

    return res.json({ my_share_enabled: parsed.data.enabled });
  } catch (err) {
    req.log.error({ err }, "Failed to update share setting");
    return res.status(500).json({ error: "Unable to update sharing preference." });
  }
});

router.delete("/companion", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const link = await getCompanionLink(userId);
    if (!link) return res.status(404).json({ error: "No companion link found." });

    await db.delete(companionLinksTable).where(eq(companionLinksTable.id, link.id));

    return res.json({ message: "Companion connection dissolved." });
  } catch (err) {
    req.log.error({ err }, "Failed to dissolve companion link");
    return res.status(500).json({ error: "Unable to dissolve companion connection." });
  }
});

export default router;
