import { Router } from "express";
import { db } from "@workspace/db";
import {
  learningTrackQuestionsTable,
  learningTrackProgressTable,
  learningTrackAttemptsTable,
  learningTrackSessionsTable,
  nobleScoreLogTable,
  usersTable,
} from "@workspace/db";
import { awardPlacementBadge } from "../lib/badge-service";
import { eq, and, sql, isNull, or, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import {
  deriveDemographic,
  selectQuestions,
  getRegisterConfig,
  type Register,
} from "../lib/learning-engine";
import {
  projectBehaviorToCompass,
  type PureBehaviorProfile,
} from "../lib/learning-engine-pure";
import { enforceElitePrivacy } from "../middleware/elite-privacy";

const router = Router();

const PLACEMENT_BATCH_SIZE = 3;
const PLACEMENT_MAX_QUESTIONS = 12;
const PLACEMENT_START_LEVEL = 3;
const PLACEMENT_PASS_THRESHOLD = 2 / 3;

const PG_UNIQUE_VIOLATION = "23505";

const StartBodySchema = z.object({
  register: z.enum(["middle_class", "elite"]),
  region_code: z.string().min(1).max(10),
  pillar: z.string().optional().nullable(),
  phase: z.number().int().min(1).max(5).default(1),
  lang: z.string().default("en"),
});

const AnswerBodySchema = z.object({
  session_id: z.number().int().positive(),
  question_id: z.number().int().positive(),
  selected_option_index: z.number().int().min(0).max(2),
});

const CompleteBodySchema = z.object({
  session_id: z.number().int().positive(),
});

function tierAllows(register: Register, tier: string): boolean {
  if (tier !== "traveller" && tier !== "ambassador") return false;
  if (register === "elite" && tier !== "ambassador") return false;
  return true;
}

interface PlacementSession {
  id: number;
  level: number;
  correct_answers: number;
  total_questions: number;
  answers_given: number;
  started_at: Date;
  completed_at: Date | null;
  served_question_ids: unknown;
  remediates_session_id: number | null;
}

interface BinarySearchState {
  lo: number;
  hi: number;
  currentLevel: number;
  placementLevel: number;
  totalAnswered: number;
  isDone: boolean;
}

function computeBinarySearchState(
  completedSessions: PlacementSession[],
  totalAnswered: number,
): BinarySearchState {
  let lo = 1;
  let hi = 5;
  let placementLevel = 1;

  for (const session of completedSessions) {
    const passed =
      session.total_questions > 0 &&
      session.correct_answers / session.total_questions >= PLACEMENT_PASS_THRESHOLD;

    if (passed) {
      if (session.level > placementLevel) placementLevel = session.level;
      lo = session.level + 1;
    } else {
      hi = session.level - 1;
    }

    if (lo > hi) break;
  }

  const isDone = lo > hi || totalAnswered >= PLACEMENT_MAX_QUESTIONS;
  const rawMid = Math.floor((lo + hi) / 2);
  const currentLevel = isDone ? placementLevel : Math.max(lo, Math.min(hi, rawMid));

  return { lo, hi, currentLevel, placementLevel, totalAnswered, isDone };
}

async function fetchRunSessions(
  userId: string,
  rootId: number,
): Promise<PlacementSession[]> {
  return db
    .select({
      id: learningTrackSessionsTable.id,
      level: learningTrackSessionsTable.level,
      correct_answers: learningTrackSessionsTable.correct_answers,
      total_questions: learningTrackSessionsTable.total_questions,
      answers_given: learningTrackSessionsTable.answers_given,
      started_at: learningTrackSessionsTable.started_at,
      completed_at: learningTrackSessionsTable.completed_at,
      served_question_ids: learningTrackSessionsTable.served_question_ids,
      remediates_session_id: learningTrackSessionsTable.remediates_session_id,
    })
    .from(learningTrackSessionsTable)
    .where(
      and(
        eq(learningTrackSessionsTable.user_id, userId),
        eq(learningTrackSessionsTable.is_placement, true),
        or(
          eq(learningTrackSessionsTable.id, rootId),
          eq(learningTrackSessionsTable.remediates_session_id, rootId),
        ),
      ),
    )
    .orderBy(learningTrackSessionsTable.started_at) as Promise<PlacementSession[]>;
}

async function buildSelectionContext(
  userId: string,
  register: Register,
  regionCode: string,
  pillar: string | null,
  phase: number,
  level: number,
  lang: string,
  excludeIds: number[],
) {
  const [user] = await db
    .select({
      birth_year: usersTable.birth_year,
      gender_identity: usersTable.gender_identity,
      country_of_origin: usersTable.country_of_origin,
      situational_interests: usersTable.situational_interests,
      register_bias: usersTable.register_bias,
      archetype: usersTable.archetype,
      secondary_archetype: usersTable.secondary_archetype,
      social_circles: usersTable.social_circles,
      cultural_interests: usersTable.cultural_interests,
      behavior_profile: usersTable.behavior_profile,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return null;

  const demographic = deriveDemographic(user.birth_year, user.gender_identity);
  const DEFAULT_PROFILE: PureBehaviorProfile = {
    listening_score: 50,
    assertiveness_style: "assertive",
    conflict_mode: "collaborate",
    eq_dimensions: {
      self_awareness: 50,
      self_regulation: 50,
      empathy: 50,
      social_skill: 50,
    },
    nonverbal_awareness: 50,
  };
  const behaviorProfile = (user.behavior_profile ?? DEFAULT_PROFILE) as PureBehaviorProfile;
  const compassScores = projectBehaviorToCompass(behaviorProfile);

  return {
    ctx: {
      userId,
      register,
      regionCode,
      countryOfOrigin: user.country_of_origin ?? null,
      situationalInterests: (user.situational_interests ?? []) as string[],
      demographic,
      pillar,
      phase,
      level,
      lang,
      size: PLACEMENT_BATCH_SIZE,
      excludeIds,
      register_bias: user.register_bias ?? null,
      archetype: user.archetype ?? null,
      secondary_archetype: user.secondary_archetype ?? null,
      userCircles: (user.social_circles ?? []) as string[],
      userCultural: (user.cultural_interests ?? []) as string[],
      compass_scores: compassScores,
    },
    demographic,
  };
}

// ─── POST /sessions/placement/start ──────────────────────────────────────────
router.post("/sessions/placement/start", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = StartBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request.", errors: parsed.error.issues });
    }
    const { register, pillar, phase, lang } = parsed.data;
    const regionCode = parsed.data.region_code.toUpperCase();
    const pillarVal = pillar ?? null;

    const [user] = await db
      .select({ subscription_tier: usersTable.subscription_tier })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) return res.status(404).json({ error: "Profile not found." });
    if (!tierAllows(register, user.subscription_tier ?? "guest")) {
      return res.status(403).json({
        error:
          register === "elite"
            ? "The elite track requires an Ambassador subscription."
            : "Learning tracks require a Traveller or Ambassador subscription.",
      });
    }

    const openPlacement = await db
      .select({ id: learningTrackSessionsTable.id })
      .from(learningTrackSessionsTable)
      .where(
        and(
          eq(learningTrackSessionsTable.user_id, userId),
          eq(learningTrackSessionsTable.register, register),
          eq(learningTrackSessionsTable.region_code, regionCode),
          eq(learningTrackSessionsTable.is_placement, true),
          isNull(learningTrackSessionsTable.completed_at),
          pillarVal
            ? eq(learningTrackSessionsTable.research_pillar, pillarVal)
            : sql`${learningTrackSessionsTable.research_pillar} IS NULL`,
        ),
      )
      .orderBy(desc(learningTrackSessionsTable.id))
      .limit(1);

    if (openPlacement.length > 0) {
      return res.status(409).json({
        error: "A placement session is already in progress. Complete or skip it before starting a new one.",
        code: "PLACEMENT_IN_PROGRESS",
        session_id: openPlacement[0].id,
      });
    }

    const ctxResult = await buildSelectionContext(
      userId,
      register,
      regionCode,
      pillarVal,
      phase,
      PLACEMENT_START_LEVEL,
      lang,
      [],
    );
    if (!ctxResult) return res.status(404).json({ error: "Profile not found." });
    const { ctx } = ctxResult;

    const questions = await selectQuestions(ctx);
    if (questions.length === 0) {
      return res.status(422).json({
        error: "No placement questions are available for this track yet.",
        code: "NO_QUESTIONS",
      });
    }

    const [session] = await db
      .insert(learningTrackSessionsTable)
      .values({
        user_id: userId,
        register,
        region_code: regionCode,
        research_pillar: pillarVal,
        phase,
        level: PLACEMENT_START_LEVEL,
        is_placement: true,
        served_question_ids: questions.map((q) => q.id),
        repeat_question_ids: [],
        total_questions: questions.length,
        lang,
      })
      .returning();

    return res.status(201).json({
      session_id: session.id,
      placement_root_id: session.id,
      current_level: PLACEMENT_START_LEVEL,
      lo: 1,
      hi: 5,
      total_answered: 0,
      max_questions: PLACEMENT_MAX_QUESTIONS,
      questions: questions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        historical_context: q.historical_context,
        options: q.options,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to start placement session");
    return res.status(500).json({ error: "The placement assessment could not be started." });
  }
});

// ─── POST /sessions/placement/answer ─────────────────────────────────────────
router.post("/sessions/placement/answer", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = AnswerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid answer data.", errors: parsed.error.issues });
    }
    const { session_id, question_id, selected_option_index } = parsed.data;

    const [session] = await db
      .select()
      .from(learningTrackSessionsTable)
      .where(
        and(
          eq(learningTrackSessionsTable.id, session_id),
          eq(learningTrackSessionsTable.user_id, userId),
          eq(learningTrackSessionsTable.is_placement, true),
        ),
      )
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Placement session not found." });
    }
    if (session.completed_at) {
      return res.status(409).json({ error: "This placement batch has already been completed." });
    }

    const served = (session.served_question_ids ?? []) as number[];
    if (!served.includes(question_id)) {
      return res.status(400).json({ error: "Question is not part of this placement batch." });
    }

    const [existing] = await db
      .select({ id: learningTrackAttemptsTable.id })
      .from(learningTrackAttemptsTable)
      .where(
        and(
          eq(learningTrackAttemptsTable.session_id, session.id),
          eq(learningTrackAttemptsTable.question_id, question_id),
        ),
      )
      .limit(1);
    if (existing) {
      return res.status(409).json({
        error: "This question has already been answered.",
        code: "ANSWER_ALREADY_RECORDED",
      });
    }

    const [question] = await db
      .select()
      .from(learningTrackQuestionsTable)
      .where(eq(learningTrackQuestionsTable.id, question_id))
      .limit(1);
    if (!question) return res.status(404).json({ error: "Question not found." });

    const options = question.options as {
      text: string;
      answer_tier: 1 | 2 | 3;
      motivation: string;
    }[];
    const selected = options[selected_option_index];
    if (!selected) return res.status(400).json({ error: "Invalid option index." });

    const { answer_tier, motivation } = selected;
    const isCorrect = answer_tier === 1;

    try {
      await db.insert(learningTrackAttemptsTable).values({
        user_id: userId,
        question_id: question.id,
        register: session.register,
        region_code: session.region_code,
        research_pillar: session.research_pillar,
        phase: session.phase,
        level: session.level,
        answer_tier,
        is_correct: isCorrect,
        is_repetition: false,
        is_placement_question: true,
        session_id: session.id,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        return res.status(409).json({
          error: "This question has already been answered.",
          code: "ANSWER_ALREADY_RECORDED",
        });
      }
      throw e;
    }

    const newAnswered = session.answers_given + 1;
    const newCorrect = session.correct_answers + (isCorrect ? 1 : 0);
    const batchComplete = newAnswered >= session.total_questions;

    await db
      .update(learningTrackSessionsTable)
      .set({
        answers_given: newAnswered,
        correct_answers: newCorrect,
        ...(batchComplete && {
          completed_at: new Date(),
          passed: newCorrect / session.total_questions >= PLACEMENT_PASS_THRESHOLD,
          score_pct: Math.round((newCorrect / session.total_questions) * 100),
        }),
      })
      .where(eq(learningTrackSessionsTable.id, session.id));

    const baseResponse = {
      correct: isCorrect,
      answer_tier,
      motivation,
      historical_context: question.historical_context ?? null,
      batch_complete: batchComplete,
      answered_in_batch: newAnswered,
      batch_size: session.total_questions,
    };

    if (!batchComplete) {
      return res.json(baseResponse);
    }

    const rootId = session.remediates_session_id ?? session.id;
    const runSessions = await fetchRunSessions(userId, rootId);
    const completedSessions = runSessions.filter((s) => s.completed_at !== null);

    const totalAnswered = completedSessions.reduce((sum, s) => sum + s.total_questions, 0);
    const bsState = computeBinarySearchState(completedSessions, totalAnswered);

    if (bsState.isDone) {
      return res.json({
        ...baseResponse,
        placement_done: true,
        placement_level: bsState.placementLevel,
        total_answered: totalAnswered,
      });
    }

    const nextLevel = bsState.currentLevel;

    const allServedIds = runSessions.flatMap((s) => (s.served_question_ids ?? []) as number[]);

    const ctxResult = await buildSelectionContext(
      userId,
      session.register as Register,
      session.region_code,
      session.research_pillar ?? null,
      session.phase,
      nextLevel,
      session.lang,
      allServedIds,
    );
    if (!ctxResult) {
      return res.status(404).json({ error: "Profile not found during batch transition." });
    }

    const nextQuestions = await selectQuestions(ctxResult.ctx);
    if (nextQuestions.length === 0) {
      return res.json({
        ...baseResponse,
        placement_done: true,
        placement_level: bsState.placementLevel,
        total_answered: totalAnswered,
      });
    }

    const [nextSession] = await db
      .insert(learningTrackSessionsTable)
      .values({
        user_id: userId,
        register: session.register,
        region_code: session.region_code,
        research_pillar: session.research_pillar,
        phase: session.phase,
        level: nextLevel,
        is_placement: true,
        served_question_ids: nextQuestions.map((q) => q.id),
        repeat_question_ids: [],
        total_questions: nextQuestions.length,
        remediates_session_id: rootId,
        lang: session.lang,
      })
      .returning();

    return res.json({
      ...baseResponse,
      placement_done: false,
      next_level: nextLevel,
      lo: bsState.lo,
      hi: bsState.hi,
      total_answered: totalAnswered,
      max_questions: PLACEMENT_MAX_QUESTIONS,
      next_session_id: nextSession.id,
      questions: nextQuestions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        historical_context: q.historical_context,
        options: q.options,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to record placement answer");
    return res.status(500).json({ error: "The placement answer could not be recorded." });
  }
});

// ─── POST /sessions/placement/complete ───────────────────────────────────────
router.post("/sessions/placement/complete", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = CompleteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request.", errors: parsed.error.issues });
    }
    const { session_id } = parsed.data;

    const [session] = await db
      .select({
        id:                    learningTrackSessionsTable.id,
        is_placement:          learningTrackSessionsTable.is_placement,
        register:              learningTrackSessionsTable.register,
        region_code:           learningTrackSessionsTable.region_code,
        research_pillar:       learningTrackSessionsTable.research_pillar,
        phase:                 learningTrackSessionsTable.phase,
        remediates_session_id: learningTrackSessionsTable.remediates_session_id,
      })
      .from(learningTrackSessionsTable)
      .where(
        and(
          eq(learningTrackSessionsTable.id, session_id),
          eq(learningTrackSessionsTable.user_id, userId),
        ),
      )
      .limit(1);

    if (!session || !session.is_placement) {
      return res.status(404).json({ error: "Placement session not found." });
    }

    const rootId = session.remediates_session_id ?? session.id;
    const runSessions = await fetchRunSessions(userId, rootId);
    const incompleteSessions = runSessions.filter((s) => s.completed_at === null);
    if (incompleteSessions.length > 0) {
      return res.status(409).json({
        error: "The placement run is not yet finished — all batches must be answered before completing.",
        code: "RUN_INCOMPLETE",
      });
    }

    const completedSessions = runSessions.filter((s) => s.completed_at !== null);
    const totalAnswered = completedSessions.reduce((sum, s) => sum + s.total_questions, 0);
    const bsState = computeBinarySearchState(completedSessions, totalAnswered);
    const placementLevel = bsState.placementLevel;

    const register = session.register as Register;
    const regionCode = session.region_code.toUpperCase();
    const pillarVal = session.research_pillar ?? null;
    const phase = session.phase;

    const cfg = getRegisterConfig(register);
    const clampedLevel = Math.max(1, Math.min(cfg.maxLevel, placementLevel));

    // ── Idempotency check ─────────────────────────────────────────────────────
    // If this run was already finalized (a log row with this trigger exists),
    // return a stable 200 without re-awarding score or badges.
    const finalizationTrigger = `placement_finalized:${rootId}`;
    const [existingFinalization] = await db
      .select({ id: nobleScoreLogTable.id })
      .from(nobleScoreLogTable)
      .where(
        and(
          eq(nobleScoreLogTable.user_id, userId),
          eq(nobleScoreLogTable.trigger, finalizationTrigger),
        ),
      )
      .limit(1);

    if (existingFinalization) {
      return res.json({
        placement_level: clampedLevel,
        noble_score_added: 0,
        badge: null,
        skipped_content_note: clampedLevel > 1
          ? "Content from earlier levels is available in the Library."
          : null,
      });
    }

    // ── Atomic side-effects transaction ──────────────────────────────────────
    // All writes (progress upsert, score credit, recalibration reset,
    // finalization marker, skipped-content audit) happen in a single
    // transaction.  The finalization marker row acts as the idempotency key:
    // if the tx commits, the run is definitively finalized; if it rolls back,
    // no partial state is persisted.
    const progressWhere = and(
      eq(learningTrackProgressTable.user_id, userId),
      eq(learningTrackProgressTable.register, register),
      eq(learningTrackProgressTable.phase, phase),
      eq(learningTrackProgressTable.region_code, regionCode),
      pillarVal
        ? eq(learningTrackProgressTable.research_pillar, pillarVal)
        : sql`${learningTrackProgressTable.research_pillar} IS NULL`,
    );

    let privacyMode = false;
    let nobleScoreAdded = 0;

    await db.transaction(async (tx) => {
      const [existingProgress] = await tx
        .select({ id: learningTrackProgressTable.id })
        .from(learningTrackProgressTable)
        .where(progressWhere)
        .limit(1);

      if (existingProgress) {
        await tx
          .update(learningTrackProgressTable)
          .set({ current_level: clampedLevel, last_updated: new Date() })
          .where(eq(learningTrackProgressTable.id, existingProgress.id));
      } else {
        await tx.insert(learningTrackProgressTable).values({
          user_id: userId,
          register,
          research_pillar: pillarVal,
          phase,
          region_code: regionCode,
          current_level: clampedLevel,
          questions_done: 0,
          correct_streak: 0,
          mastered: false,
        });
      }

      const [userRow] = await tx
        .select({
          noble_score:         usersTable.noble_score,
          elite_privacy_mode:  usersTable.elite_privacy_mode,
          needs_recalibration: usersTable.needs_recalibration,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      privacyMode = userRow?.elite_privacy_mode ?? false;
      nobleScoreAdded = privacyMode ? 0 : 50 * (clampedLevel - 1);

      if (nobleScoreAdded > 0) {
        await tx
          .update(usersTable)
          .set({ noble_score: (userRow?.noble_score ?? 0) + nobleScoreAdded })
          .where(eq(usersTable.id, userId));
      }

      if (userRow?.needs_recalibration) {
        await tx
          .update(usersTable)
          .set({ needs_recalibration: false })
          .where(eq(usersTable.id, userId));
      }

      // Finalization marker — also serves as the idempotency key for repeat calls
      await tx.insert(nobleScoreLogTable).values({
        user_id: userId,
        score_delta: nobleScoreAdded,
        trigger: finalizationTrigger,
        level_name_after: `placement_level_${clampedLevel}`,
      });

      // Persisted audit trail: skipped content made available in the Library
      if (clampedLevel > 1) {
        await tx.insert(nobleScoreLogTable).values({
          user_id: userId,
          score_delta: 0,
          trigger: `placement_content_skipped:${rootId}`,
          level_name_after: `placement_level_${clampedLevel}`,
        });
      }
    });

    // Badge award runs after the transaction so that a badge-service failure
    // does not roll back the already-committed finalization.
    const awardedBadge = await awardPlacementBadge(userId, register, regionCode, privacyMode);

    return res.json({
      placement_level: clampedLevel,
      noble_score_added: nobleScoreAdded,
      badge: awardedBadge
        ? { id: awardedBadge.id, slug: awardedBadge.slug, title: awardedBadge.title, description: awardedBadge.description }
        : null,
      skipped_content_note: clampedLevel > 1
        ? "Content from earlier levels is available in the Library."
        : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to complete placement session");
    return res.status(500).json({ error: "The placement assessment could not be completed." });
  }
});

export default router;
