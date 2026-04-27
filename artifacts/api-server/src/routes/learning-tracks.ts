import { Router } from "express";
import { db } from "@workspace/db";
import {
  learningTrackQuestionsTable,
  learningTrackProgressTable,
  usersTable,
} from "@workspace/db";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const CURRENT_YEAR = new Date().getFullYear();

function deriveDemographic(birthYear: number | null | undefined, genderIdentity: string | null | undefined): string {
  let gender: "men" | "women" | null = null;
  if (genderIdentity) {
    const g = genderIdentity.toLowerCase();
    if (g.includes("male") || g.includes("man") || g === "m") gender = "men";
    else if (g.includes("female") || g.includes("woman") || g === "f") gender = "women";
  }

  let ageGroup: "19_30" | "30_50" | "50plus" | null = null;
  if (birthYear) {
    const age = CURRENT_YEAR - birthYear;
    if (age >= 19 && age <= 30) ageGroup = "19_30";
    else if (age >= 31 && age <= 50) ageGroup = "30_50";
    else if (age > 50) ageGroup = "50plus";
  }

  if (gender && ageGroup) return `${gender}_${ageGroup}`;
  return "common";
}

const SessionQuerySchema = z.object({
  register: z.enum(["middle_class", "elite"]),
  research_pillar: z.string().optional(),
  phase: z.coerce.number().int().min(1).max(5),
  region_code: z.string().min(1).max(10),
  lang: z.string().default("nl"),
});

const AnswerBodySchema = z.object({
  question_id: z.number().int().positive(),
  selected_option_index: z.number().int().min(0).max(2),
  register: z.enum(["middle_class", "elite"]),
  research_pillar: z.string().optional().nullable(),
  phase: z.number().int().min(1).max(5),
});

router.get("/learning-tracks/session", async (req, res) => {
  try {
    const sessionUser = (req as unknown as { user?: { userId?: string } }).user;
    if (!sessionUser?.userId) {
      return res.status(401).json({ message: "Authentication required to access learning tracks." });
    }

    const parsed = SessionQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid session parameters.", errors: parsed.error.issues });
    }

    const { register, research_pillar, phase, region_code, lang } = parsed.data;
    const userId = sessionUser.userId;

    const [userRow] = await db.select({
      birth_year: usersTable.birth_year,
      gender_identity: usersTable.gender_identity,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    const demographic = userRow
      ? deriveDemographic(userRow.birth_year, userRow.gender_identity)
      : "common";

    const pillarKey = research_pillar ?? null;

    const [progressRow] = await db.select()
      .from(learningTrackProgressTable)
      .where(and(
        eq(learningTrackProgressTable.user_id, userId),
        eq(learningTrackProgressTable.register, register),
        eq(learningTrackProgressTable.phase, phase),
        pillarKey
          ? eq(learningTrackProgressTable.research_pillar, pillarKey)
          : sql`${learningTrackProgressTable.research_pillar} IS NULL`,
      ))
      .limit(1);

    const currentLevel = progressRow?.current_level ?? 1;
    const correctStreak = progressRow?.correct_streak ?? 0;
    const repeat = correctStreak <= -2;

    const lookupLevel = repeat ? Math.max(1, currentLevel - 1) : currentLevel;

    const baseConditions = [
      eq(learningTrackQuestionsTable.region_code, region_code.toUpperCase()),
      eq(learningTrackQuestionsTable.register, register),
      eq(learningTrackQuestionsTable.phase, phase),
      eq(learningTrackQuestionsTable.level, lookupLevel),
      eq(learningTrackQuestionsTable.lang, lang),
    ];

    if (pillarKey) {
      baseConditions.push(eq(learningTrackQuestionsTable.research_pillar, pillarKey));
    }

    const demographicQuestions = await db.select({
      id: learningTrackQuestionsTable.id,
      question_text: learningTrackQuestionsTable.question_text,
      historical_context: learningTrackQuestionsTable.historical_context,
      options: learningTrackQuestionsTable.options,
    })
      .from(learningTrackQuestionsTable)
      .where(and(...baseConditions, eq(learningTrackQuestionsTable.demographic, demographic)))
      .limit(6);

    let questions = demographicQuestions;

    if (questions.length < 4) {
      const commonQuestions = await db.select({
        id: learningTrackQuestionsTable.id,
        question_text: learningTrackQuestionsTable.question_text,
        historical_context: learningTrackQuestionsTable.historical_context,
        options: learningTrackQuestionsTable.options,
      })
        .from(learningTrackQuestionsTable)
        .where(and(...baseConditions, eq(learningTrackQuestionsTable.demographic, "common")))
        .limit(6);

      const existingIds = new Set(questions.map((q) => q.id));
      questions = [...questions, ...commonQuestions.filter((q) => !existingIds.has(q.id))].slice(0, 6);
    }

    const sanitizedQuestions = questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      historical_context: q.historical_context ?? null,
      options: (q.options as { text: string; answer_tier: number; motivation: string }[]).map((o) => ({
        text: o.text,
      })),
    }));

    return res.json({
      questions: sanitizedQuestions,
      current_level: currentLevel,
      questions_done: progressRow?.questions_done ?? 0,
      correct_streak: correctStreak,
      mastered: progressRow?.mastered ?? false,
      demographic,
      repeat,
      has_questions: sanitizedQuestions.length > 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch learning track session");
    return res.status(500).json({ message: "The learning track is momentarily unavailable." });
  }
});

router.post("/learning-tracks/answer", async (req, res) => {
  try {
    const sessionUser = (req as unknown as { user?: { userId?: string } }).user;
    if (!sessionUser?.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const parsed = AnswerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid answer data.", errors: parsed.error.issues });
    }

    const { question_id, selected_option_index, register, research_pillar, phase } = parsed.data;
    const userId = sessionUser.userId;
    const pillarKey = research_pillar ?? null;

    const [question] = await db.select()
      .from(learningTrackQuestionsTable)
      .where(eq(learningTrackQuestionsTable.id, question_id))
      .limit(1);

    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    const options = question.options as { text: string; answer_tier: 1 | 2 | 3; motivation: string }[];
    const selected = options[selected_option_index];
    if (!selected) {
      return res.status(400).json({ message: "Invalid option index." });
    }

    const { answer_tier, motivation } = selected;
    const isCorrect = answer_tier === 1;

    const progressWhere = and(
      eq(learningTrackProgressTable.user_id, userId),
      eq(learningTrackProgressTable.register, register),
      eq(learningTrackProgressTable.phase, phase),
      pillarKey
        ? eq(learningTrackProgressTable.research_pillar, pillarKey)
        : sql`${learningTrackProgressTable.research_pillar} IS NULL`,
    );

    const [existing] = await db.select().from(learningTrackProgressTable).where(progressWhere).limit(1);

    let currentLevel = existing?.current_level ?? 1;
    let correctStreak = existing?.correct_streak ?? 0;
    let questionsDone = existing?.questions_done ?? 0;
    let mastered = existing?.mastered ?? false;

    if (answer_tier === 1) {
      correctStreak = Math.max(0, correctStreak) + 1;
      questionsDone += 1;
    } else if (answer_tier === 2) {
      correctStreak = Math.max(0, correctStreak - 1);
      questionsDone += 1;
    } else {
      correctStreak = Math.min(0, correctStreak) - 1;
    }

    let levelUp = false;
    let repeat = false;

    if (!mastered && correctStreak >= 4 && questionsDone >= 4) {
      currentLevel += 1;
      correctStreak = 0;
      levelUp = true;
      if (currentLevel > 5) {
        mastered = true;
        currentLevel = 5;
      }
    }

    if (correctStreak <= -2) {
      repeat = true;
    }

    if (existing) {
      await db.update(learningTrackProgressTable)
        .set({
          current_level: currentLevel,
          questions_done: questionsDone,
          correct_streak: correctStreak,
          mastered,
          last_updated: new Date(),
        })
        .where(eq(learningTrackProgressTable.id, existing.id));
    } else {
      await db.insert(learningTrackProgressTable).values({
        user_id: userId,
        register,
        research_pillar: pillarKey,
        phase,
        current_level: currentLevel,
        questions_done: questionsDone,
        correct_streak: correctStreak,
        mastered,
      }).onConflictDoNothing();
    }

    return res.json({
      correct: isCorrect,
      answer_tier,
      motivation,
      historical_context: question.historical_context ?? null,
      level_up: levelUp,
      mastered,
      repeat,
      correct_streak: correctStreak,
      current_level: currentLevel,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process learning track answer");
    return res.status(500).json({ message: "Unable to process your answer at this time." });
  }
});

router.get("/learning-tracks/progress", async (req, res) => {
  try {
    const sessionUser = (req as unknown as { user?: { userId?: string } }).user;
    if (!sessionUser?.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const userId = sessionUser.userId;

    const rows = await db.select()
      .from(learningTrackProgressTable)
      .where(eq(learningTrackProgressTable.user_id, userId));

    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch learning track progress");
    return res.status(500).json({ message: "Progress data is momentarily unavailable." });
  }
});

export default router;
