import { Router } from "express";
import { db } from "@workspace/db";
import { scenariosTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const ScenariosQuerySchema = z.object({
  region_code: z.string().optional(),
  pillar: z.coerce.number().int().min(1).max(5).optional(),
  difficulty_level: z.coerce.number().int().min(1).max(5).optional(),
  age_group: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const ScenarioIdParamSchema = z.object({
  scenarioId: z.coerce.number().int().positive(),
});

router.get("/scenarios", async (req, res) => {
  try {
    const parsed = ScenariosQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "The query parameters provided are not valid. Please review and resubmit." });
    }

    const { region_code, pillar, difficulty_level, age_group, limit } = parsed.data;
    const conditions = [];

    if (region_code !== undefined) {
      conditions.push(eq(scenariosTable.region_code, region_code));
    }
    if (pillar !== undefined) {
      conditions.push(eq(scenariosTable.pillar, pillar));
    }
    if (difficulty_level !== undefined) {
      conditions.push(eq(scenariosTable.difficulty_level, difficulty_level));
    }
    if (age_group !== undefined) {
      conditions.push(eq(scenariosTable.age_group, age_group));
    }

    const scenarios = await db.select()
      .from(scenariosTable)
      .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`)
      .limit(limit);

    return res.json(scenarios);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch scenarios");
    return res.status(500).json({ message: "The training scenarios are momentarily unavailable. Please allow a moment." });
  }
});

router.get("/scenarios/:scenarioId", async (req, res) => {
  try {
    const parsed = ScenarioIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ message: "The scenario identifier provided is not valid." });
    }

    const [scenario] = await db.select()
      .from(scenariosTable)
      .where(eq(scenariosTable.id, parsed.data.scenarioId))
      .limit(1);

    if (!scenario) {
      return res.status(404).json({ message: "This scenario is not yet available in our atelier. Others await your attention." });
    }

    return res.json(scenario);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch scenario");
    return res.status(500).json({ message: "A difficulty arose while retrieving this scenario." });
  }
});

export default router;
