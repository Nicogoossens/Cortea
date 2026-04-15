import { Router } from "express";
import { db } from "@workspace/db";
import { scenariosTable, type Scenario } from "@workspace/db";
import { eq, and, lte, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const ScenariosQuerySchema = z.object({
  region_code: z.string().optional(),
  pillar: z.coerce.number().int().min(1).max(5).optional(),
  difficulty_level: z.coerce.number().int().min(1).max(5).optional(),
  difficulty_max: z.coerce.number().int().min(1).max(5).optional(),
  age_group: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  lang: z.string().min(2).max(10).optional(),
});

const ScenarioIdParamSchema = z.object({
  scenarioId: z.coerce.number().int().positive(),
});

const ScenarioIdQuerySchema = z.object({
  lang: z.string().min(2).max(10).optional(),
});

/** Resolve a single scenario's title and content to the requested language.
 *  Falls back to the canonical English fields when no translation is available. */
function resolveScenarioLocale(scenario: Scenario, lang?: string): Scenario {
  if (!lang) return scenario;
  const baseLang = lang.split("-")[0];
  const title = scenario.title_i18n?.[lang] ?? scenario.title_i18n?.[baseLang] ?? scenario.title;
  const content_json = scenario.content_i18n?.[lang] ?? scenario.content_i18n?.[baseLang] ?? scenario.content_json;
  return { ...scenario, title, content_json };
}

function resolveScenarioLocales(scenarios: Scenario[], lang?: string): Scenario[] {
  if (!lang) return scenarios;
  return scenarios.map((s) => resolveScenarioLocale(s, lang));
}

router.get("/scenarios", async (req, res) => {
  try {
    const parsed = ScenariosQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "The query parameters provided are not valid. Please review and resubmit." });
    }

    const { region_code, pillar, difficulty_level, difficulty_max, age_group, limit, lang } = parsed.data;
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
    if (difficulty_max !== undefined) {
      conditions.push(lte(scenariosTable.difficulty_level, difficulty_max));
    }
    if (age_group !== undefined) {
      conditions.push(eq(scenariosTable.age_group, age_group));
    }

    const scenarios = await db.select()
      .from(scenariosTable)
      .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`)
      .limit(limit);

    return res.json(resolveScenarioLocales(scenarios, lang));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch scenarios");
    return res.status(500).json({ message: "The training scenarios are momentarily unavailable. Please allow a moment." });
  }
});

router.get("/scenarios/:scenarioId", async (req, res) => {
  try {
    const parsedId = ScenarioIdParamSchema.safeParse(req.params);
    if (!parsedId.success) {
      return res.status(400).json({ message: "The scenario identifier provided is not valid." });
    }

    const parsedQuery = ScenarioIdQuerySchema.safeParse(req.query);
    const lang = parsedQuery.success ? parsedQuery.data.lang : undefined;

    const [scenario] = await db.select()
      .from(scenariosTable)
      .where(eq(scenariosTable.id, parsedId.data.scenarioId))
      .limit(1);

    if (!scenario) {
      return res.status(404).json({ message: "This scenario is not yet available in our atelier. Others await your attention." });
    }

    return res.json(resolveScenarioLocale(scenario, lang));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch scenario");
    return res.status(500).json({ message: "A difficulty arose while retrieving this scenario." });
  }
});

export default router;
