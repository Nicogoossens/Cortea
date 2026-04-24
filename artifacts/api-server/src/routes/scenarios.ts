import { Router } from "express";
import { db } from "@workspace/db";
import { scenariosTable, type Scenario, type ScenarioContent } from "@workspace/db";
import { eq, and, lte, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const VALID_SPHERES = ["business", "gastronomy", "arts_culture", "music_entertainment", "formal_events", "lifestyle_wellness", "travel_hospitality"] as const;
type Sphere = typeof VALID_SPHERES[number];

const SPHERE_TO_CONTEXTS: Record<Sphere, string[]> = {
  business: ["business", "professional"],
  gastronomy: ["dining"],
  arts_culture: ["formal", "social"],
  music_entertainment: ["social"],
  formal_events: ["formal"],
  lifestyle_wellness: ["social"],
  travel_hospitality: ["social", "business"],
};

function getContextsForSpheres(spheres: Sphere[]): string[] {
  const set = new Set<string>();
  for (const sphere of spheres) {
    for (const ctx of SPHERE_TO_CONTEXTS[sphere] ?? []) set.add(ctx);
  }
  return [...set];
}

const ScenariosQuerySchema = z.object({
  region_code: z.string().optional(),
  pillar: z.coerce.number().int().min(1).max(5).optional(),
  difficulty_level: z.coerce.number().int().min(1).max(5).optional(),
  difficulty_max: z.coerce.number().int().min(1).max(5).optional(),
  age_group: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  lang: z.string().min(2).max(10).optional(),
  situational_interests: z.string().optional(),
});

const ScenarioIdParamSchema = z.object({
  scenarioId: z.coerce.number().int().positive(),
});

const ScenarioIdQuerySchema = z.object({
  lang: z.string().min(2).max(10).optional(),
});

/**
 * Ensures every ScenarioOption exposes a `correct` boolean alias for legacy consumers.
 * New content may use only `answer_tier`; this normaliser back-fills `correct` so that
 * existing consumers reading `option.correct` never receive `undefined`.
 *   tier 1 → correct: true   (best answer)
 *   tier 2 → correct: false  (acceptable but not ideal)
 *   tier 3 → correct: false  (incorrect / penalty)
 */
function normalizeContent(raw: ScenarioContent | null | undefined): ScenarioContent | null {
  if (!raw) return null;
  if (!Array.isArray(raw.options)) return raw;
  return {
    ...raw,
    options: raw.options.map((opt) => {
      if (opt.answer_tier !== undefined && opt.correct === undefined) {
        return { ...opt, correct: opt.answer_tier === 1 };
      }
      return opt;
    }),
  };
}

/** Resolve a single scenario's title and content to the requested language.
 *  Falls back to the canonical English fields when no translation is available.
 *  Also normalises options so that `correct` is always present (backwards compat). */
function resolveScenarioLocale(scenario: Scenario, lang?: string): Scenario {
  const baseLang = lang ? lang.split("-")[0] : undefined;
  const title = baseLang
    ? (scenario.title_i18n?.[lang!] ?? scenario.title_i18n?.[baseLang] ?? scenario.title)
    : scenario.title;
  const rawContent: ScenarioContent | null | undefined = baseLang
    ? ((scenario.content_i18n?.[lang!] ?? scenario.content_i18n?.[baseLang] ?? scenario.content_json) as ScenarioContent | null | undefined)
    : scenario.content_json;
  const content_json = normalizeContent(rawContent);
  return { ...scenario, title, content_json };
}

function resolveScenarioLocales(scenarios: Scenario[], lang?: string): Scenario[] {
  return scenarios.map((s) => resolveScenarioLocale(s, lang));
}

router.get("/scenarios", async (req, res) => {
  try {
    const parsed = ScenariosQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "The query parameters provided are not valid. Please review and resubmit." });
    }

    const { region_code, pillar, difficulty_level, difficulty_max, age_group, limit, lang, situational_interests } = parsed.data;
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

    const spheres = (situational_interests ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is Sphere => (VALID_SPHERES as readonly string[]).includes(s));

    const matchingContexts = spheres.length > 0 ? getContextsForSpheres(spheres) : [];
    const matchingCtxSet = new Set(matchingContexts);

    const FALLBACK_REGION = "GB";
    const FALLBACK_THRESHOLD = 3;
    const FALLBACK_MINIMUM = 8;

    let regionalScenarios = await db.select()
      .from(scenariosTable)
      .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`)
      .limit(limit);

    let fallbackScenarios: typeof regionalScenarios = [];

    // When a region has fewer than FALLBACK_THRESHOLD scenarios, supplement
    // with universal (GB) scenarios so the Atelier is never empty.
    const needsFallback =
      region_code !== undefined &&
      region_code !== FALLBACK_REGION &&
      regionalScenarios.length < FALLBACK_THRESHOLD;

    if (needsFallback) {
      // Apply all the same filters to the fallback query for consistency.
      const fallbackConditions: Parameters<typeof and>[0][] = [
        eq(scenariosTable.region_code, FALLBACK_REGION),
      ];
      if (pillar !== undefined) fallbackConditions.push(eq(scenariosTable.pillar, pillar));
      if (difficulty_level !== undefined) fallbackConditions.push(eq(scenariosTable.difficulty_level, difficulty_level));
      if (difficulty_max !== undefined) fallbackConditions.push(lte(scenariosTable.difficulty_level, difficulty_max));
      if (age_group !== undefined) fallbackConditions.push(eq(scenariosTable.age_group, age_group));

      // Fetch enough fallback items to reach at least FALLBACK_MINIMUM total.
      const fallbackNeeded = Math.max(FALLBACK_MINIMUM, limit) - regionalScenarios.length;
      const existingIds = new Set(regionalScenarios.map((s) => s.id));

      const rawFallback = await db.select()
        .from(scenariosTable)
        .where(and(...fallbackConditions))
        .limit(fallbackNeeded);

      fallbackScenarios = rawFallback.filter((s) => !existingIds.has(s.id));
    }

    const isRegionalSet = new Set(regionalScenarios.map((s) => s.id));
    const allScenarios = [...regionalScenarios, ...fallbackScenarios];

    if (matchingCtxSet.size > 0) {
      allScenarios.sort((a, b) => {
        const aMatch = matchingCtxSet.has(a.context ?? "") ? 0 : 1;
        const bMatch = matchingCtxSet.has(b.context ?? "") ? 0 : 1;
        return aMatch - bMatch || (a.difficulty_level ?? 0) - (b.difficulty_level ?? 0);
      });
    }

    const resolved = resolveScenarioLocales(allScenarios, lang);
    const withFlag = resolved.map((s) => ({
      ...s,
      is_regional: isRegionalSet.has(s.id),
    }));

    return res.json(withFlag);
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
