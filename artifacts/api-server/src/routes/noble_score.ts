import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, zuil_voortgangTable, nobleScoreLogTable, scenariosTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const DEFAULT_USER_ID = "default-user";

const UserIdQuerySchema = z.object({
  user_id: z.string().min(1).default(DEFAULT_USER_ID),
});

const LogQuerySchema = z.object({
  user_id: z.string().min(1).default(DEFAULT_USER_ID),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const PILLAR_NAMES = [
  { pillar: 1, pillar_name: "Cultural Knowledge", pillar_domain: "The World Within" },
  { pillar: 2, pillar_name: "Appearance", pillar_domain: "The Presence" },
  { pillar: 3, pillar_name: "Eloquence", pillar_domain: "The Voice" },
  { pillar: 4, pillar_name: "Table Manners", pillar_domain: "The Table" },
  { pillar: 5, pillar_name: "Drinks Knowledge", pillar_domain: "The Cellar" },
];

const PILLAR_TITLES: Record<number, string[]> = {
  1: ["The Observer", "The Reader", "The Traveller", "The Diplomat", "The Luminary"],
  2: ["The Conscious", "The Poised", "The Curated", "The Impeccable", "The Icon"],
  3: ["The Listener", "The Conversant", "The Eloquent", "The Orator", "The Sage"],
  4: ["The Guest", "The Diner", "The Connoisseur", "The Host", "The Maître"],
  5: ["The Sipper", "The Taster", "The Selector", "The Sommelier", "The Cellar Master"],
};

const GLOBAL_LEVELS = [
  { min: 0, max: 19, level: 1, name: "The Aware", color: "#9E9E9E" },
  { min: 20, max: 39, level: 2, name: "The Composed", color: "#26A69A" },
  { min: 40, max: 59, level: 3, name: "The Refined", color: "#7E57C2" },
  { min: 60, max: 79, level: 4, name: "The Distinguished", color: "#FFA726" },
  { min: 80, max: 100, level: 5, name: "The Sovereign", color: "#AD1457" },
];

function getLevelFromScore(score: number) {
  const normalised = Math.min(100, Math.max(0, score));
  return GLOBAL_LEVELS.find(l => normalised >= l.min && normalised <= l.max) || GLOBAL_LEVELS[0];
}

function getTitleFromScore(pillar: number, score: number): string {
  const titles = PILLAR_TITLES[pillar] || [];
  const level = getLevelFromScore(score).level - 1;
  return titles[level] || titles[0] || "The Aware";
}

function getNextTitle(pillar: number, score: number): string | null {
  const titles = PILLAR_TITLES[pillar] || [];
  const level = getLevelFromScore(score).level;
  return titles[level] || null;
}

function getProgressPercent(score: number): number {
  const level = getLevelFromScore(score);
  const range = level.max - level.min;
  const progress = score - level.min;
  return Math.round((progress / range) * 100);
}

async function ensurePillarProgress(userId: string) {
  const existing = await db.select().from(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));
  const existingPillars = new Set(existing.map(e => e.pillar));

  const toCreate = PILLAR_NAMES.filter(p => !existingPillars.has(p.pillar));

  if (toCreate.length > 0) {
    await db.insert(zuil_voortgangTable).values(
      toCreate.map(p => ({
        user_id: userId,
        pillar: p.pillar,
        score: 0,
        current_title: PILLAR_TITLES[p.pillar][0],
      }))
    );
  }
}

router.get("/noble-score", async (req, res) => {
  try {
    const parsed = UserIdQuerySchema.safeParse(req.query);
    const userId = parsed.success ? parsed.data.user_id : DEFAULT_USER_ID;

    await ensurePillarProgress(userId);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const pillarRows = await db.select().from(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));

    const totalScore = user ? user.noble_score : 0;
    const currentLevel = getLevelFromScore(totalScore);
    const nextLevel = GLOBAL_LEVELS.find(l => l.level === currentLevel.level + 1);

    const pillars = PILLAR_NAMES.map(p => {
      const row = pillarRows.find(r => r.pillar === p.pillar);
      const score = row?.score ?? 0;
      return {
        pillar: p.pillar,
        pillar_name: p.pillar_name,
        pillar_domain: p.pillar_domain,
        score,
        current_title: getTitleFromScore(p.pillar, score),
        next_title: getNextTitle(p.pillar, score),
        progress_percent: getProgressPercent(score),
      };
    });

    return res.json({
      total_score: totalScore,
      level: currentLevel.level,
      level_name: currentLevel.name,
      level_color: currentLevel.color,
      next_level_threshold: nextLevel?.min ?? 100,
      pillars,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch noble score");
    return res.status(500).json({ message: "Your standing could not be retrieved at this moment." });
  }
});

const SubmitAnswerBodySchema = z.object({
  scenario_id: z.number().int().positive(),
  selected_option_index: z.number().int().min(0),
  time_taken_seconds: z.number().int().optional(),
});

const MENTOR_FEEDBACK_CORRECT = [
  "An elegant choice — one that demonstrates discernment beyond the ordinary.",
  "Precisely as a person of your standing would respond. Your instincts serve you well.",
  "Your selection reflects a cultivated understanding. One would expect no less.",
  "A commendable choice. The subtlety of your judgement does not go unnoticed.",
];

const MENTOR_FEEDBACK_INCORRECT = [
  "Allow me to offer a gentle refinement — the more elegant path was perhaps not immediately apparent.",
  "In circles where such situations arise, the preferred approach is slightly different. Let us refine this together.",
  "A thoughtful attempt. The nuance here lies in the detail — permit me to illuminate it.",
  "Even the most accomplished individuals encounter situations that invite further reflection. Here is how one might approach it.",
];

router.post("/noble-score/submit", async (req, res) => {
  try {
    const queryParsed = UserIdQuerySchema.safeParse(req.query);
    const userId = queryParsed.success ? queryParsed.data.user_id : DEFAULT_USER_ID;

    const bodyParsed = SubmitAnswerBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ message: "The submission does not meet the expected form. Please review and resubmit." });
    }

    const { scenario_id, selected_option_index, time_taken_seconds } = bodyParsed.data;

    const [scenario] = await db.select().from(scenariosTable).where(eq(scenariosTable.id, scenario_id)).limit(1);

    if (!scenario) {
      return res.status(404).json({ message: "The referenced scenario could not be located." });
    }

    const content = scenario.content_json;
    const selectedOption = content.options[selected_option_index];

    if (!selectedOption) {
      return res.status(400).json({ message: "The selected option is not valid for this scenario." });
    }

    const isCorrect = selectedOption.correct;
    let scoreDelta = isCorrect ? scenario.noble_score_impact : Math.floor(-scenario.noble_score_impact * 0.2);

    if (isCorrect && time_taken_seconds && time_taken_seconds < 10) {
      scoreDelta = Math.round(scoreDelta * 1.2);
    }

    const trigger = isCorrect ? "correct_choice" : "incorrect_choice";

    await ensurePillarProgress(userId);

    await db.insert(nobleScoreLogTable).values({
      user_id: userId,
      scenario_id,
      score_delta: scoreDelta,
      trigger,
    });

    const [pillarRow] = await db.select().from(zuil_voortgangTable)
      .where(and(
        eq(zuil_voortgangTable.user_id, userId),
        eq(zuil_voortgangTable.pillar, scenario.pillar),
      ))
      .limit(1);

    const oldPillarScore = pillarRow?.score ?? 0;
    const newPillarScore = Math.min(100, Math.max(0, oldPillarScore + scoreDelta));
    const newTitle = getTitleFromScore(scenario.pillar, newPillarScore);

    await db.update(zuil_voortgangTable)
      .set({ score: newPillarScore, current_title: newTitle })
      .where(and(
        eq(zuil_voortgangTable.user_id, userId),
        eq(zuil_voortgangTable.pillar, scenario.pillar),
      ));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const oldTotalScore = user?.noble_score ?? 0;
    const newTotalScore = Math.min(100, Math.max(0, oldTotalScore + Math.round(scoreDelta * 0.5)));

    const oldLevel = getLevelFromScore(oldTotalScore);
    const newLevel = getLevelFromScore(newTotalScore);
    const levelUp = newLevel.level > oldLevel.level;

    if (user) {
      await db.update(usersTable)
        .set({ noble_score: newTotalScore })
        .where(eq(usersTable.id, userId));
    }

    const feedbackPool = isCorrect ? MENTOR_FEEDBACK_CORRECT : MENTOR_FEEDBACK_INCORRECT;
    const mentorFeedback = feedbackPool[Math.floor(Math.random() * feedbackPool.length)];

    return res.json({
      correct: isCorrect,
      explanation: selectedOption.explanation,
      mentor_feedback: mentorFeedback,
      score_delta: scoreDelta,
      new_total_score: newTotalScore,
      level_up: levelUp,
      new_level_name: levelUp ? newLevel.name : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit scenario answer");
    return res.status(500).json({ message: "A difficulty arose while processing your response. Please try again." });
  }
});

router.get("/noble-score/log", async (req, res) => {
  try {
    const parsed = LogQuerySchema.safeParse(req.query);
    const userId = parsed.success ? parsed.data.user_id : DEFAULT_USER_ID;
    const limit = parsed.success ? parsed.data.limit : 20;

    const log = await db.select()
      .from(nobleScoreLogTable)
      .where(eq(nobleScoreLogTable.user_id, userId))
      .orderBy(desc(nobleScoreLogTable.timestamp))
      .limit(limit);

    return res.json(log);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch noble score log");
    return res.status(500).json({ message: "Your progress history is momentarily unavailable." });
  }
});

router.get("/noble-score/pillars", async (req, res) => {
  try {
    const parsed = UserIdQuerySchema.safeParse(req.query);
    const userId = parsed.success ? parsed.data.user_id : DEFAULT_USER_ID;

    await ensurePillarProgress(userId);

    const pillarRows = await db.select().from(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));

    const pillars = PILLAR_NAMES.map(p => {
      const row = pillarRows.find(r => r.pillar === p.pillar);
      const score = row?.score ?? 0;
      return {
        pillar: p.pillar,
        pillar_name: p.pillar_name,
        pillar_domain: p.pillar_domain,
        score,
        current_title: getTitleFromScore(p.pillar, score),
        next_title: getNextTitle(p.pillar, score),
        progress_percent: getProgressPercent(score),
      };
    });

    return res.json(pillars);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pillar progress");
    return res.status(500).json({ message: "Your pillar progress is momentarily unavailable." });
  }
});

export default router;
