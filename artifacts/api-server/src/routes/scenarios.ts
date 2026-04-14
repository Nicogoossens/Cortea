import { Router } from "express";
import { db } from "@workspace/db";
import { scenariosTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/scenarios", async (req, res) => {
  try {
    const { region_code, pillar, difficulty_level, age_group, limit } = req.query;

    const conditions = [];

    if (region_code) {
      conditions.push(eq(scenariosTable.region_code, region_code as string));
    }

    if (pillar) {
      conditions.push(eq(scenariosTable.pillar, parseInt(pillar as string)));
    }

    if (difficulty_level) {
      conditions.push(eq(scenariosTable.difficulty_level, parseInt(difficulty_level as string)));
    }

    if (age_group) {
      conditions.push(eq(scenariosTable.age_group, age_group as string));
    }

    const queryLimit = Math.min(parseInt((limit as string) || "10"), 50);

    const scenarios = await db.select()
      .from(scenariosTable)
      .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`)
      .limit(queryLimit);

    return res.json(scenarios);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch scenarios");
    return res.status(500).json({ message: "The training scenarios are momentarily unavailable. Please allow a moment." });
  }
});

router.get("/scenarios/:scenarioId", async (req, res) => {
  try {
    const scenarioId = parseInt(req.params.scenarioId);

    if (isNaN(scenarioId)) {
      return res.status(400).json({ message: "The scenario identifier provided is not valid." });
    }

    const [scenario] = await db.select()
      .from(scenariosTable)
      .where(eq(scenariosTable.id, scenarioId))
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
