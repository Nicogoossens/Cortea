import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { usersTable, questsTable, questCompletionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function optionalUserFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.session_token, token))
    .limit(1);
  return user?.id ?? null;
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeek(): number {
  return new Date().getDay();
}

router.get("/quests/daily", async (req, res) => {
  try {
    const userId = await optionalUserFromToken(req);
    const today = getTodayISO();
    const dayOfWeek = getDayOfWeek();

    const allQuests = await db.select().from(questsTable)
      .where(eq(questsTable.is_active, true));

    const dailyQuests = allQuests.filter(
      (q) => q.day_of_week === null || q.day_of_week === dayOfWeek
    ).slice(0, 3);

    if (!userId) {
      return res.json(dailyQuests.map((q) => ({ ...q, completed: false })));
    }

    const completions = await db.select()
      .from(questCompletionsTable)
      .where(
        and(
          eq(questCompletionsTable.user_id, userId),
          eq(questCompletionsTable.completed_on, today),
        )
      );

    const completedIds = new Set(completions.map((c) => c.quest_id));

    return res.json(dailyQuests.map((q) => ({
      ...q,
      completed: completedIds.has(q.id),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch daily quests");
    return res.status(500).json({ message: "Daily quests are temporarily unavailable." });
  }
});

router.post("/quests/complete", async (req, res) => {
  try {
    const userId = await optionalUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { quest_id } = req.body as { quest_id?: number };
    if (!quest_id || typeof quest_id !== "number") {
      return res.status(400).json({ message: "A valid quest_id is required." });
    }

    const [quest] = await db.select().from(questsTable).where(eq(questsTable.id, quest_id)).limit(1);
    if (!quest) {
      return res.status(404).json({ message: "Quest not found." });
    }

    const today = getTodayISO();

    const [existing] = await db.select()
      .from(questCompletionsTable)
      .where(
        and(
          eq(questCompletionsTable.user_id, userId),
          eq(questCompletionsTable.quest_id, quest_id),
          eq(questCompletionsTable.completed_on, today),
        )
      )
      .limit(1);

    if (existing) {
      return res.json({ already_completed: true, noble_score_awarded: 0 });
    }

    await db.insert(questCompletionsTable).values({
      user_id: userId,
      quest_id,
      completed_on: today,
    });

    const [user] = await db.select({ noble_score: usersTable.noble_score })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const currentScore = user?.noble_score ?? 0;
    const newScore = Math.min(100, currentScore + quest.noble_score_reward);

    await db.update(usersTable)
      .set({ noble_score: newScore, last_activity_date: today })
      .where(eq(usersTable.id, userId));

    return res.json({
      already_completed: false,
      noble_score_awarded: quest.noble_score_reward,
      new_total_score: newScore,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to complete quest");
    return res.status(500).json({ message: "Quest completion could not be recorded." });
  }
});

router.get("/streak", async (req, res) => {
  try {
    const userId = await optionalUserFromToken(req);
    if (!userId) {
      return res.json({ streak: 0, last_activity_date: null });
    }

    const [user] = await db.select({
      daily_streak: usersTable.daily_streak,
      last_activity_date: usersTable.last_activity_date,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    return res.json({
      streak: user?.daily_streak ?? 0,
      last_activity_date: user?.last_activity_date ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch streak");
    return res.status(500).json({ message: "Streak information is temporarily unavailable." });
  }
});

export default router;
