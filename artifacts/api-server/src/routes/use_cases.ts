import { Router, type Request } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  zuil_voortgangTable,
  nobleScoreLogTable,
  scenariosTable,
  useCasesTable,
  userUseCaseRatingsTable,
  useCaseRatingLogTable,
  counselQualityLogTable,
  mirrorScanLogTable,
  type UseCase,
  type ComponentScores,
  type BehaviorProfile,
  DEFAULT_BEHAVIOR_PROFILE,
} from "@workspace/db";
import { eq, and, avg, count, inArray, desc } from "drizzle-orm";

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

interface ReadinessResult {
  readiness_score: number;
  component_scores: ComponentScores;
}

/**
 * Derive a 0-100 behavior alignment score from the user's behavior profile
 * against the social demands of the use case (by domain_tags + formality).
 */
function behaviorProfileScore(profile: BehaviorProfile, domainTags: string[], formalityLevel: string): number {
  const eq_ = profile.eq_dimensions;
  const isFormal = ["black_tie", "white_tie", "formal", "ceremonial", "business_formal"].includes(formalityLevel);
  const isBusiness = domainTags.some(t => ["business", "eloquence"].includes(t));
  const isGastronomy = domainTags.some(t => ["gastronomy", "drinks"].includes(t));
  const isCultural = domainTags.includes("cultural_knowledge");

  // Assertiveness: 0=passive/aggressive, 100=assertive
  const assertivenessScore = profile.assertiveness_style === "assertive" ? 80
    : profile.assertiveness_style === "passive" ? 40
    : profile.assertiveness_style === "passive_aggressive" ? 30
    : 25; // aggressive

  // Conflict mode: best for social = collaborate, second = accommodate, worst = compete/avoid
  const conflictScore = profile.conflict_mode === "collaborate" ? 85
    : profile.conflict_mode === "accommodate" ? 65
    : profile.conflict_mode === "avoid" ? 45
    : 35; // compete

  // EQ scores are on 0-100 scale already
  const selfReg = eq_.self_regulation;
  const empathy = eq_.empathy;
  const socialSkill = eq_.social_skill;
  const selfAwareness = eq_.self_awareness;

  // Build composite by scenario type
  let composite: number;
  if (isBusiness) {
    composite = assertivenessScore * 0.3 + socialSkill * 0.25 + selfReg * 0.25 + conflictScore * 0.2;
  } else if (isGastronomy) {
    composite = empathy * 0.3 + socialSkill * 0.25 + profile.listening_score * 0.25 + selfAwareness * 0.2;
  } else if (isFormal) {
    composite = selfReg * 0.35 + profile.nonverbal_awareness * 0.25 + selfAwareness * 0.2 + conflictScore * 0.2;
  } else if (isCultural) {
    composite = selfAwareness * 0.35 + empathy * 0.3 + profile.listening_score * 0.2 + socialSkill * 0.15;
  } else {
    composite = (selfReg + empathy + socialSkill + selfAwareness + assertivenessScore + conflictScore) / 6;
  }

  return Math.min(100, Math.max(0, Math.round(composite)));
}

async function computeReadiness(userId: string, useCase: UseCase): Promise<ReadinessResult> {
  const pillarWeights = useCase.pillar_weights as Record<string, number>;
  const domainTags = useCase.domain_tags as string[];
  const formalityLevel = useCase.formality_level;

  // --- 1. Atelier score = weighted pillar progress + completion bonus ---
  const pillarRows = await db.select().from(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));

  // Count distinct scenario completions per pillar
  const completionLogs = await db
    .select({
      scenario_id: nobleScoreLogTable.scenario_id,
    })
    .from(nobleScoreLogTable)
    .where(eq(nobleScoreLogTable.user_id, userId));

  const uniqueScenarioIds = [...new Set(
    completionLogs.map(l => l.scenario_id).filter((id): id is number => id !== null)
  )];

  const pillarCompletionCounts: Record<number, number> = {};
  if (uniqueScenarioIds.length > 0) {
    const scenarioRows = await db
      .select({ id: scenariosTable.id, pillar: scenariosTable.pillar })
      .from(scenariosTable)
      .where(inArray(scenariosTable.id, uniqueScenarioIds));

    for (const s of scenarioRows) {
      pillarCompletionCounts[s.pillar] = (pillarCompletionCounts[s.pillar] ?? 0) + 1;
    }
  }

  let atelierScore: number | null = null;
  const totalWeight = Object.values(pillarWeights).reduce((s, w) => s + w, 0);
  if (pillarRows.length > 0 && totalWeight > 0) {
    let weightedSum = 0;
    for (const [pillarStr, weight] of Object.entries(pillarWeights)) {
      const pillarNum = parseInt(pillarStr, 10);
      const row = pillarRows.find(r => r.pillar === pillarNum);
      const baseScore = row?.score ?? 0;
      // Completion bonus: up to +10 for completing 5+ scenarios in this pillar
      const completions = pillarCompletionCounts[pillarNum] ?? 0;
      const completionBonus = Math.min(10, completions * 2);
      weightedSum += Math.min(100, baseScore + completionBonus) * weight;
    }
    atelierScore = weightedSum / totalWeight;
  }

  // --- 2. Counsel score — domain-specific quality average ---
  let counselScore: number | null = null;
  const counselDomains = domainTags.filter(t =>
    ["gastronomy", "business", "eloquence", "formal_events", "cultural_knowledge"].includes(t)
  );
  if (counselDomains.length > 0) {
    // Try domain-specific first, fall back to all domains if nothing recorded
    const domainRows = await db
      .select({ avg_score: avg(counselQualityLogTable.score) })
      .from(counselQualityLogTable)
      .where(and(
        eq(counselQualityLogTable.user_id, userId),
        inArray(counselQualityLogTable.domain, counselDomains),
      ));

    let rawAvg = domainRows[0]?.avg_score;

    if (rawAvg == null) {
      // Fall back to general/all domain quality scores if no domain-specific ones exist
      const allRows = await db
        .select({ avg_score: avg(counselQualityLogTable.score) })
        .from(counselQualityLogTable)
        .where(eq(counselQualityLogTable.user_id, userId));
      rawAvg = allRows[0]?.avg_score;
    }

    if (rawAvg != null) {
      counselScore = Math.min(100, (parseFloat(String(rawAvg)) / 10) * 100);
    }
  }

  // --- 3. Mirror score — newest scans; formal scenarios use dress-code appropriateness ---
  let mirrorScore: number | null = null;
  const formalScenario = ["black_tie", "white_tie", "formal", "ceremonial", "business_formal"].includes(formalityLevel);
  const mirrorRelevant = formalScenario || domainTags.some(t => ["dress_code", "formal_events"].includes(t));
  if (mirrorRelevant) {
    const mirrorRows = await db
      .select()
      .from(mirrorScanLogTable)
      .where(eq(mirrorScanLogTable.user_id, userId))
      .orderBy(desc(mirrorScanLogTable.created_at))
      .limit(5);

    if (mirrorRows.length > 0) {
      const formalCategories = ["black_tie", "white_tie", "morning_dress", "business_formal"];
      const bestScan = mirrorRows.reduce((best, row) => {
        const isFormal = formalCategories.includes(row.detected_category);
        const score = isFormal ? row.confidence * 100 : row.confidence * 40;
        return score > best.score ? { score, row } : best;
      }, { score: -1 as number, row: mirrorRows[0] });
      mirrorScore = Math.min(100, Math.max(0, bestScan.score));
    }
  }

  // --- 4. Compass score — region alignment + behavior profile ---
  let compassScore: number | null = null;
  const [user] = await db
    .select({
      active_region: usersTable.active_region,
      behavior_profile: usersTable.behavior_profile,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user) {
    // Region alignment: matching region gives a base boost
    const regionMatch = user.active_region === useCase.region_code;
    const regionBase = regionMatch ? 70 : 30;

    // Behavior profile alignment
    const profile: BehaviorProfile = (user.behavior_profile as BehaviorProfile | null) ?? DEFAULT_BEHAVIOR_PROFILE;
    const bpScore = behaviorProfileScore(profile, domainTags, formalityLevel);

    // Compass = blended region + behavior alignment
    compassScore = Math.round(regionBase * 0.5 + bpScore * 0.5);
  }

  // --- Composite readiness score ---
  // Weights: Atelier 40%, Compass (region+behavior) 25%, Counsel 25%, Mirror 10%
  // Mirror only included when relevant to the scenario
  const components: { score: number | null; weight: number }[] = [
    { score: atelierScore, weight: 0.40 },
    { score: compassScore, weight: 0.25 },
    { score: counselScore, weight: 0.25 },
    { score: mirrorScore,  weight: 0.10 },
  ];

  let weightedTotal = 0;
  let usedWeight = 0;
  for (const c of components) {
    if (c.score !== null) {
      weightedTotal += c.score * c.weight;
      usedWeight += c.weight;
    }
  }

  const readinessScore = usedWeight > 0 ? Math.round(weightedTotal / usedWeight) : 0;

  return {
    readiness_score: Math.min(100, Math.max(0, readinessScore)),
    component_scores: {
      atelier:  atelierScore  !== null ? Math.round(atelierScore)  : null,
      counsel:  counselScore  !== null ? Math.round(counselScore)  : null,
      mirror:   mirrorScore   !== null ? Math.round(mirrorScore)   : null,
      compass:  compassScore  !== null ? Math.round(compassScore)  : null,
    },
  };
}

async function upsertRating(userId: string, useCaseId: number, rating: { readiness_score: number; component_scores: ComponentScores }) {
  const now = new Date();

  // Update (or create) the current-cache row
  await db.delete(userUseCaseRatingsTable).where(
    and(
      eq(userUseCaseRatingsTable.user_id, userId),
      eq(userUseCaseRatingsTable.use_case_id, useCaseId),
    )
  );
  await db.insert(userUseCaseRatingsTable).values({
    user_id: userId,
    use_case_id: useCaseId,
    readiness_score: rating.readiness_score,
    component_scores: rating.component_scores,
    computed_at: now,
  });

  // Append to the immutable history log (never deleted)
  await db.insert(useCaseRatingLogTable).values({
    user_id: userId,
    use_case_id: useCaseId,
    readiness_score: rating.readiness_score,
    component_scores: rating.component_scores,
    computed_at: now,
  });
}

router.get("/use-cases", async (req, res) => {
  try {
    const userId = await optionalUserFromToken(req);
    const useCases = await db.select().from(useCasesTable);

    if (!userId) {
      return res.json(useCases.map(uc => ({
        ...uc,
        readiness_score: null,
        component_scores: null,
      })));
    }

    const enriched = await Promise.all(
      useCases.map(async (uc) => {
        const [cached] = await db
          .select()
          .from(userUseCaseRatingsTable)
          .where(and(
            eq(userUseCaseRatingsTable.user_id, userId),
            eq(userUseCaseRatingsTable.use_case_id, uc.id),
          ))
          .limit(1);

        const cacheAgeMins = cached
          ? (Date.now() - new Date(cached.computed_at).getTime()) / 60000
          : Infinity;

        let rating: { readiness_score: number; component_scores: ComponentScores };
        if (cached && cacheAgeMins < 60) {
          rating = {
            readiness_score: cached.readiness_score,
            component_scores: cached.component_scores as ComponentScores,
          };
        } else {
          rating = await computeReadiness(userId, uc);
          await upsertRating(userId, uc.id, rating);
        }

        return { ...uc, ...rating };
      })
    );

    return res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch use cases");
    return res.status(500).json({ message: "Use cases could not be retrieved at this moment." });
  }
});

router.get("/use-cases/:slug/readiness", async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = await optionalUserFromToken(req);

    const [useCase] = await db
      .select()
      .from(useCasesTable)
      .where(eq(useCasesTable.slug, slug))
      .limit(1);

    if (!useCase) {
      return res.status(404).json({ message: "Use case not found." });
    }

    if (!userId) {
      return res.json({ ...useCase, readiness_score: null, component_scores: null });
    }

    const rating = await computeReadiness(userId, useCase);
    await upsertRating(userId, useCase.id, rating);

    return res.json({ ...useCase, ...rating });
  } catch (err) {
    req.log.error({ err }, "Failed to compute readiness score");
    return res.status(500).json({ message: "Readiness score could not be computed at this moment." });
  }
});

export default router;
