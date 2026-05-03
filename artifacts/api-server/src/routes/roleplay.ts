import { Router } from "express";
import { db } from "@workspace/db";
import {
  roleplayScenarioTable, roleplayCompletionsTable, roleplayReflectionsTable,
  companionLinksTable,
} from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";

const router = Router();

router.get("/roleplay/scenarios", async (req, res) => {
  try {
    const scenarios = await db.select({
      id: roleplayScenarioTable.id,
      title: roleplayScenarioTable.title,
      context: roleplayScenarioTable.context,
      situation: roleplayScenarioTable.situation,
      pillar: roleplayScenarioTable.pillar,
      difficulty_level: roleplayScenarioTable.difficulty_level,
      estimated_minutes: roleplayScenarioTable.estimated_minutes,
    }).from(roleplayScenarioTable).orderBy(roleplayScenarioTable.pillar, roleplayScenarioTable.difficulty_level);

    return res.json(scenarios);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch roleplay scenarios");
    return res.status(500).json({ error: "Unable to load roleplay scenarios." });
  }
});

router.get("/roleplay/scenarios/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid scenario ID." });

    const [scenario] = await db.select().from(roleplayScenarioTable).where(eq(roleplayScenarioTable.id, id)).limit(1);
    if (!scenario) return res.status(404).json({ error: "Roleplay scenario not found." });

    return res.json(scenario);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch roleplay scenario");
    return res.status(500).json({ error: "Unable to load this roleplay scenario." });
  }
});

const SubmitCompletionSchema = z.object({
  scenario_id: z.number().int().positive(),
  role: z.enum(["A", "B"]),
  answers: z.array(z.object({
    question_index: z.number().int().min(0),
    selected_option_index: z.number().int().min(0),
    correct: z.boolean(),
  })),
  score: z.number().int().min(0),
});

router.post("/roleplay/complete", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const parsed = SubmitCompletionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid completion data." });

    const { scenario_id, role, answers, score } = parsed.data;

    const [completion] = await db.insert(roleplayCompletionsTable).values({
      scenario_id,
      user_id: userId,
      role,
      answers,
      score,
    }).returning();

    return res.json(completion);
  } catch (err) {
    req.log.error({ err }, "Failed to save roleplay completion");
    return res.status(500).json({ error: "Unable to save your roleplay result." });
  }
});

router.get("/roleplay/completions", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const completions = await db.select().from(roleplayCompletionsTable)
      .where(eq(roleplayCompletionsTable.user_id, userId))
      .orderBy(desc(roleplayCompletionsTable.completed_at));
    return res.json(completions);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch roleplay completions");
    return res.status(500).json({ error: "Unable to load your roleplay history." });
  }
});

const AddReflectionSchema = z.object({
  scenario_id: z.number().int().positive(),
  target_user_id: z.string().min(1),
  content: z.string().min(1).max(1000),
});

router.post("/roleplay/reflections", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const parsed = AddReflectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid reflection data." });

    const { scenario_id, target_user_id, content } = parsed.data;

    const links = await db.select().from(companionLinksTable)
      .where(
        or(
          and(eq(companionLinksTable.user_a_id, userId), eq(companionLinksTable.user_b_id, target_user_id)),
          and(eq(companionLinksTable.user_a_id, target_user_id), eq(companionLinksTable.user_b_id, userId)),
        )
      ).limit(1);

    if (links.length === 0) {
      return res.status(403).json({ error: "You may only leave reflections for your companion." });
    }

    const [reflection] = await db.insert(roleplayReflectionsTable).values({
      scenario_id,
      author_id: userId,
      target_user_id,
      content,
    }).returning();

    return res.json(reflection);
  } catch (err) {
    req.log.error({ err }, "Failed to save reflection");
    return res.status(500).json({ error: "Unable to save your reflection." });
  }
});

router.get("/roleplay/reflections/:scenarioId", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const scenarioId = parseInt(req.params.scenarioId, 10);
    if (isNaN(scenarioId)) return res.status(400).json({ error: "Invalid scenario ID." });

    const reflections = await db.select().from(roleplayReflectionsTable)
      .where(
        and(
          eq(roleplayReflectionsTable.scenario_id, scenarioId),
          eq(roleplayReflectionsTable.target_user_id, userId),
        )
      )
      .orderBy(desc(roleplayReflectionsTable.created_at));

    return res.json(reflections);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reflections");
    return res.status(500).json({ error: "Unable to load reflections." });
  }
});

export default router;
