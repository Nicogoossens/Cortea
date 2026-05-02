import { Router } from "express";
import { db } from "@workspace/db";
import {
  learningTrackQuestionsTable,
  learningTrackProgressTable,
  learningTrackAttemptsTable,
  learningTrackSessionsTable,
  userCountryInterestsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, sql, isNull, desc, ne } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import { checkAndAwardBadges, getUserBadges, getAllBadges } from "../lib/badge-service";
import {
  REGISTER_CONFIG,
  computeSessionLimits,
  deriveDemographic,
  evaluatePassWindow,
  findOpenSession,
  getRegisterConfig,
  lastFailedSession,
  repetitionCount,
  selectQuestions,
  type Register,
} from "../lib/learning-engine";

const router = Router();

const SessionQuerySchema = z.object({
  register: z.enum(["middle_class", "elite"]),
  research_pillar: z.string().optional(),
  phase: z.coerce.number().int().min(1).max(5),
  region_code: z.string().min(1).max(10),
  lang: z.string().default("en"),
});

const AnswerBodySchema = z.object({
  question_id: z.number().int().positive(),
  selected_option_index: z.number().int().min(0).max(2),
  register: z.enum(["middle_class", "elite"]),
  research_pillar: z.string().optional().nullable(),
  phase: z.number().int().min(1).max(5),
  /** Optional in v1; required once the new flow is fully rolled out. */
  session_id: z.number().int().positive().optional(),
});

function tierAllows(register: Register, tier: string): boolean {
  if (tier !== "traveller" && tier !== "ambassador") return false;
  if (register === "elite" && tier !== "ambassador") return false;
  return true;
}

// ─── GET /learning-tracks/limits ─────────────────────────────────────────────
router.get("/learning-tracks/limits", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const [mc, el] = await Promise.all([
      computeSessionLimits(userId, "middle_class"),
      computeSessionLimits(userId, "elite"),
    ]);
    return res.json({ middle_class: mc, elite: el });
  } catch (err) {
    req.log.error({ err }, "Failed to compute limits");
    return res.status(500).json({ message: "Limit data is momentarily unavailable." });
  }
});

// ─── GET /learning-tracks/session ────────────────────────────────────────────
router.get("/learning-tracks/session", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = SessionQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid session parameters.", errors: parsed.error.issues });
    }
    const { register, research_pillar, phase, region_code, lang } = parsed.data;
    const regionCode = region_code.toUpperCase();

    if (register === "middle_class" && !research_pillar) {
      return res.status(400).json({ message: "research_pillar is required for middle_class register." });
    }
    const pillar = research_pillar ?? null;

    const [user] = await db.select({
      birth_year: usersTable.birth_year,
      gender_identity: usersTable.gender_identity,
      subscription_tier: usersTable.subscription_tier,
      country_of_origin: usersTable.country_of_origin,
      situational_interests: usersTable.situational_interests,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }
    if (!tierAllows(register, user.subscription_tier ?? "guest")) {
      return res.status(403).json({
        message: register === "elite"
          ? "The elite learning track requires an Ambassador subscription."
          : "Learning tracks require a Traveller or Ambassador subscription.",
      });
    }

    // ── Region-membership guard ─────────────────────────────────────────────
    // The requested region must be one of the user's active country interests.
    // We allow a single legacy bypass: if the user has NO interests yet, we
    // fall through (the GET /users/country-interests handler will backfill on
    // the next read), so existing sessions don't 403 mid-flight.
    const userInterests = await db.select({ region_code: userCountryInterestsTable.region_code })
      .from(userCountryInterestsTable)
      .where(and(
        eq(userCountryInterestsTable.user_id, userId),
        isNull(userCountryInterestsTable.hidden_at),
      ));
    if (userInterests.length > 0 && !userInterests.some((r) => r.region_code === regionCode)) {
      return res.status(403).json({
        code: "REGION_NOT_IN_INTERESTS",
        message: "Add this country to your interests before studying it.",
      });
    }

    // Reuse an open (un-completed) session for the same track if one exists,
    // so a page reload does not double-count toward the daily limit.
    let session = await findOpenSession(userId, register, regionCode, pillar, phase);

    // ── Race-safe session creation ─────────────────────────────────────────
    // We wrap the entire (lock → re-check open → check limits → INSERT)
    // sequence in a single DB transaction so that:
    //   - pg_advisory_xact_lock is held on the SAME connection as the INSERT
    //     and is auto-released only when the txn commits/rolls back, and
    //   - any second concurrent request blocks on SELECT pg_advisory_xact_lock
    //     until the first transaction completes, then sees the freshly
    //     inserted session via the inside-the-lock re-check.
    // The 429 limit check ALSO runs inside the lock so two near-simultaneous
    // requests cannot both pass the daily-limit check.
    let limitDenial: {
      reason: "daily_limit" | "cooldown";
      retryAfterSeconds?: number;
      sessionsToday: number;
      dailyLimit: number;
      cooldownMinutes: number;
      lastCompletedAt: Date | null;
    } | null = null;
    let inlineQuestions: Awaited<ReturnType<typeof selectQuestions>> | null = null;
    let inlineProgressRow: typeof learningTrackProgressTable.$inferSelect | null = null;
    let inlineCurrentLevel = 1;
    let inlineDemographic = "common";
    let inlineIsRemediation = false;

    if (!session) {
      const lockKey1 = Math.abs(
        userId.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
      );
      const lockKey2 = register === "elite" ? 2 : 1;

      session = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey1}::int, ${lockKey2}::int)`);

        // 1) Re-check open session inside the lock.
        const [reuse] = await tx.select().from(learningTrackSessionsTable)
          .where(and(
            eq(learningTrackSessionsTable.user_id, userId),
            eq(learningTrackSessionsTable.register, register),
            eq(learningTrackSessionsTable.region_code, regionCode),
            eq(learningTrackSessionsTable.phase, phase),
            pillar
              ? eq(learningTrackSessionsTable.research_pillar, pillar)
              : sql`${learningTrackSessionsTable.research_pillar} IS NULL`,
            isNull(learningTrackSessionsTable.completed_at),
          ))
          .orderBy(desc(learningTrackSessionsTable.id))
          .limit(1);
        if (reuse) return reuse;

        // 2) Check rate limits inside the lock so two concurrent requests
        //    cannot both pass the 4-of-the-day check.
        const limits = await computeSessionLimits(userId, register);
        if (!limits.allowed) {
          limitDenial = {
            reason: limits.reason!,
            retryAfterSeconds: limits.retryAfterSeconds,
            sessionsToday: limits.sessionsToday,
            dailyLimit: limits.dailyLimit,
            cooldownMinutes: limits.cooldownMinutes,
            lastCompletedAt: limits.lastCompletedAt,
          };
          return null;
        }

        // 3) Build the question set + INSERT the new session, all inside
        //    the same locked transaction.
        const failed = await lastFailedSession(userId, register, regionCode, pillar, phase);
        const remediationIds = failed?.repeat_question_ids ?? [];

        const [progressRow] = await tx.select()
          .from(learningTrackProgressTable)
          .where(and(
            eq(learningTrackProgressTable.user_id, userId),
            eq(learningTrackProgressTable.register, register),
            eq(learningTrackProgressTable.phase, phase),
            eq(learningTrackProgressTable.region_code, regionCode),
            pillar
              ? eq(learningTrackProgressTable.research_pillar, pillar)
              : sql`${learningTrackProgressTable.research_pillar} IS NULL`,
          ))
          .limit(1);

        const cfg = getRegisterConfig(register);
        const currentLevel = Math.min(progressRow?.current_level ?? 1, cfg.maxLevel);
        const demographic = deriveDemographic(user.birth_year, user.gender_identity);
        const isRemediation = remediationIds.length > 0;

        const filteredForced: number[] = [];
        const exhaustedIds: number[] = [];
        for (const qid of remediationIds) {
          // Run inside the same advisory-locked tx so the count we read is
          // consistent with the snapshot used to assemble the session.
          const n = await repetitionCount(userId, qid, tx);
          if (n < 2) filteredForced.push(qid);
          else exhaustedIds.push(qid);
        }

        const questions = await selectQuestions({
          userId,
          register,
          regionCode,
          countryOfOrigin: user.country_of_origin ?? null,
          situationalInterests: user.situational_interests ?? [],
          demographic,
          pillar,
          phase,
          level: currentLevel,
          lang,
          size: cfg.sessionSize,
          forcedIds: filteredForced,
          excludeIds: exhaustedIds,
        }, tx);

        const [created] = await tx.insert(learningTrackSessionsTable).values({
          user_id: userId,
          register,
          region_code: regionCode,
          research_pillar: pillar,
          phase,
          level: currentLevel,
          is_remediation: isRemediation,
          served_question_ids: questions.map((q) => q.id),
          repeat_question_ids: [],
          total_questions: questions.length,
          remediates_session_id: isRemediation && failed ? failed.id : null,
        }).returning();

        // Consume the parent failure so it is not picked up again on the
        // next /session call (otherwise the user is trapped in remediation).
        if (isRemediation && failed) {
          await tx.update(learningTrackSessionsTable)
            .set({ remediated_at: new Date() })
            .where(eq(learningTrackSessionsTable.id, failed.id));
        }

        inlineQuestions = questions;
        inlineProgressRow = progressRow ?? null;
        inlineCurrentLevel = currentLevel;
        inlineDemographic = demographic;
        inlineIsRemediation = isRemediation;
        return created;
      });

      if (limitDenial) {
        return res.status(429).json({
          message: limitDenial.reason === "daily_limit"
            ? "You have reached today's session limit for this track. Return tomorrow."
            : "A short reflection cooldown is in effect. Please try again shortly.",
          reason: limitDenial.reason,
          retry_after_seconds: limitDenial.retryAfterSeconds,
          sessions_today: limitDenial.sessionsToday,
          daily_limit: limitDenial.dailyLimit,
          cooldown_minutes: limitDenial.cooldownMinutes,
          last_completed_at: limitDenial.lastCompletedAt,
        });
      }
    }

    // Newly-created path: emit using the in-memory question set built inside
    // the transaction so we don't re-query (and so per-question metadata
    // matches what was persisted on the row).
    if (inlineQuestions && session) {
      const progressRow = inlineProgressRow;
      const currentLevel = inlineCurrentLevel;
      const demographic = inlineDemographic;
      const isRemediation = inlineIsRemediation;
      const questions = inlineQuestions;

      // Cache the questions on the row so subsequent /session calls (page reload)
      // return the same set, but preserving the per-question metadata requires
      // a re-select. Instead, we re-emit the same questions inline below by
      // reusing the in-memory `questions` array.
      return res.json({
        session_id: session.id,
        is_remediation: isRemediation,
        current_level: currentLevel,
        mastered: progressRow?.mastered ?? false,
        questions_done: progressRow?.questions_done ?? 0,
        correct_streak: progressRow?.correct_streak ?? 0,
        demographic,
        repeat: isRemediation,           // back-compat alias
        has_questions: questions.length > 0,
        total_questions: questions.length,
        questions,
        limits: await computeSessionLimits(userId, register),
      });
    }

    // Existing open session — re-hydrate questions from the served_question_ids
    const ids = (session.served_question_ids ?? []) as number[];
    const rows = ids.length === 0 ? [] : await db.select({
      id: learningTrackQuestionsTable.id,
      question_text: learningTrackQuestionsTable.question_text,
      historical_context: learningTrackQuestionsTable.historical_context,
      options: learningTrackQuestionsTable.options,
    })
      .from(learningTrackQuestionsTable)
      .where(sql`${learningTrackQuestionsTable.id} IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`);

    const byId = new Map(rows.map((r) => [r.id, r]));
    const repeatSet = new Set((session.repeat_question_ids ?? []) as number[]);
    const orderedQuestions = ids.flatMap((id) => {
      const r = byId.get(id);
      if (!r) return [];
      const opts = Array.isArray(r.options) ? r.options as { text?: unknown }[] : [];
      const isRepetition = session.is_remediation || repeatSet.has(id);
      return [{
        id: r.id,
        question_text: r.question_text,
        historical_context: r.historical_context ?? null,
        options: opts.map((o) => ({ text: String(o?.text ?? "") })),
        source: "match" as const,
        is_repetition: isRepetition,
        study_context: isRepetition ? (r.historical_context ?? null) : null,
      }];
    });

    // Pull the live progress row so a resumed session reflects real
    // mastered / correct_streak / questions_done values rather than zeros
    // that would silently regress badges and progress UI on reload.
    const [resumeProgress] = await db.select()
      .from(learningTrackProgressTable)
      .where(and(
        eq(learningTrackProgressTable.user_id, userId),
        eq(learningTrackProgressTable.register, register),
        eq(learningTrackProgressTable.phase, phase),
        eq(learningTrackProgressTable.region_code, session.region_code),
        pillar
          ? eq(learningTrackProgressTable.research_pillar, pillar)
          : sql`${learningTrackProgressTable.research_pillar} IS NULL`,
      ))
      .limit(1);

    return res.json({
      session_id: session.id,
      is_remediation: session.is_remediation,
      current_level: resumeProgress?.current_level ?? session.level,
      mastered: resumeProgress?.mastered ?? false,
      questions_done: resumeProgress?.questions_done ?? session.answers_given,
      correct_streak: resumeProgress?.correct_streak ?? 0,
      demographic: deriveDemographic(user.birth_year, user.gender_identity),
      repeat: session.is_remediation,
      has_questions: orderedQuestions.length > 0,
      total_questions: session.total_questions,
      questions: orderedQuestions,
      limits: await computeSessionLimits(userId, register),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch learning track session");
    return res.status(500).json({ message: "The learning track is momentarily unavailable." });
  }
});

// ─── POST /learning-tracks/answer ────────────────────────────────────────────
router.post("/learning-tracks/answer", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = AnswerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid answer data.", errors: parsed.error.issues });
    }
    const { question_id, selected_option_index, register, research_pillar, phase, session_id } = parsed.data;
    const pillar = research_pillar ?? null;

    const [userTier] = await db.select({ subscription_tier: usersTable.subscription_tier })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!tierAllows(register, userTier?.subscription_tier ?? "guest")) {
      return res.status(403).json({
        message: register === "elite"
          ? "The elite learning track requires an Ambassador subscription."
          : "Learning tracks require a Traveller or Ambassador subscription.",
      });
    }

    const [question] = await db.select()
      .from(learningTrackQuestionsTable)
      .where(eq(learningTrackQuestionsTable.id, question_id))
      .limit(1);
    if (!question) return res.status(404).json({ message: "Question not found." });
    if (
      question.register !== register ||
      question.phase !== phase ||
      (question.research_pillar ?? null) !== pillar
    ) {
      return res.status(400).json({ message: "Question does not belong to the specified register/phase/pillar." });
    }

    const options = question.options as { text: string; answer_tier: 1 | 2 | 3; motivation: string }[];
    const selected = options[selected_option_index];
    if (!selected) return res.status(400).json({ message: "Invalid option index." });
    const { answer_tier, motivation } = selected;
    const isCorrect = answer_tier === 1;

    // Resolve the active session: either by id, or fall back to most recent open
    let session = session_id
      ? (await db.select().from(learningTrackSessionsTable).where(and(
          eq(learningTrackSessionsTable.id, session_id),
          eq(learningTrackSessionsTable.user_id, userId),
        )).limit(1))[0] ?? null
      : await findOpenSession(userId, register, question.region_code, pillar, phase);

    if (!session) {
      return res.status(400).json({
        message: "No active session for this answer. Please start a new session.",
      });
    }
    if (session.completed_at) {
      return res.status(409).json({ message: "This session has already been completed." });
    }
    const served = (session.served_question_ids ?? []) as number[];
    if (!served.includes(question_id)) {
      return res.status(400).json({ message: "Question is not part of the active session." });
    }

    // Idempotency: reject duplicate submissions of the same (session, question).
    const [existing] = await db.select({ id: learningTrackAttemptsTable.id })
      .from(learningTrackAttemptsTable)
      .where(and(
        eq(learningTrackAttemptsTable.session_id, session.id),
        eq(learningTrackAttemptsTable.question_id, question.id),
      ))
      .limit(1);
    if (existing) {
      return res.status(409).json({
        message: "This question has already been answered in this session.",
        code: "ANSWER_ALREADY_RECORDED",
      });
    }

    // Record the attempt — DB unique index also enforces idempotency under races.
    try {
      await db.insert(learningTrackAttemptsTable).values({
        user_id: userId,
        question_id: question.id,
        register,
        region_code: question.region_code,
        research_pillar: pillar,
        phase,
        level: session.level,
        answer_tier,
        is_correct: isCorrect,
        is_repetition: session.is_remediation,
        session_id: session.id,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "23505") {
        return res.status(409).json({
          message: "This question has already been answered in this session.",
          code: "ANSWER_ALREADY_RECORDED",
        });
      }
      throw e;
    }

    // Update session counters; track wrong answers for next-session remediation
    const newAnswered = session.answers_given + 1;
    const newCorrect = session.correct_answers + (isCorrect ? 1 : 0);
    const repeatList = (session.repeat_question_ids ?? []) as number[];
    if (!isCorrect && !repeatList.includes(question.id)) repeatList.push(question.id);

    const sessionComplete = newAnswered >= session.total_questions;
    let scorePct: number | null = null;
    let passed: boolean | null = null;
    let nextAction: "level_up" | "continue" | "remediation" | "mastered" = "continue";
    // Outcome buckets surfaced in the response so the UI can pick the right
    // copy. Drives the spec-required "window not yet filled" UX where we
    // must NOT trigger remediation prematurely.
    let outcome: "in_progress" | "insufficient_window" | "window_pass" | "window_fail_remediation" | "mastered" | "remediation_pass" | "remediation_fail" = "in_progress";

    if (sessionComplete) {
      scorePct = session.total_questions === 0
        ? 0
        : Math.round((newCorrect / session.total_questions) * 100);
      // NOTE: per-session percentage is reported for the summary screen, but
      // it does NOT determine pass/fail. Pass/fail is derived from the
      // rolling-window evaluator below (post-attempt insert), which is the
      // single source of truth for level outcomes.
    }

    // Persist counters now; pass/score finalized after window evaluation.
    await db.update(learningTrackSessionsTable).set({
      answers_given: newAnswered,
      correct_answers: newCorrect,
      repeat_question_ids: repeatList,
      ...(sessionComplete && {
        completed_at: new Date(),
        score_pct: scorePct,
      }),
    }).where(eq(learningTrackSessionsTable.id, session.id));

    // Update progress (rolling correct_streak + questions_done preserved for UI)
    const progressWhere = and(
      eq(learningTrackProgressTable.user_id, userId),
      eq(learningTrackProgressTable.register, register),
      eq(learningTrackProgressTable.phase, phase),
      eq(learningTrackProgressTable.region_code, question.region_code),
      pillar
        ? eq(learningTrackProgressTable.research_pillar, pillar)
        : sql`${learningTrackProgressTable.research_pillar} IS NULL`,
    );
    const [progressExisting] = await db.select().from(learningTrackProgressTable).where(progressWhere).limit(1);

    let currentLevel = progressExisting?.current_level ?? session.level;
    let correctStreak = progressExisting?.correct_streak ?? 0;
    let questionsDone = progressExisting?.questions_done ?? 0;
    let mastered = progressExisting?.mastered ?? false;

    // Don't double-count remediation attempts in `questions_done` — the user
    // isn't progressing, they're rehabilitating.
    if (!session.is_remediation) {
      questionsDone += 1;
      if (isCorrect) correctStreak = Math.max(0, correctStreak) + 1;
      else if (answer_tier === 2) correctStreak = Math.max(0, correctStreak - 1);
      else correctStreak = Math.min(0, correctStreak) - 1;
    }

    // Pass-engine: only evaluate at session end. Pass/fail/remediation are
    // derived from the rolling window — NOT from the current session score.
    // This guarantees we don't force remediation before the window minimum
    // (e.g. mc session size 8 < window min 10) is reached.
    let levelUp = false;
    if (sessionComplete && !session.is_remediation && !mastered) {
      const win = await evaluatePassWindow(userId, register, question.region_code, pillar, phase, currentLevel);
      if (win.windowFilled < win.windowRequired) {
        // Not enough attempts at this level yet to make a pass/fail call.
        passed = null;
        nextAction = "continue";
        outcome = "insufficient_window";
      } else if (win.shouldLevelUp) {
        passed = true;
        const maxLevel = REGISTER_CONFIG[register].maxLevel;
        if (currentLevel >= maxLevel) {
          mastered = true;
          currentLevel = maxLevel;
          nextAction = "mastered";
          outcome = "mastered";
        } else {
          currentLevel = currentLevel + 1;
          nextAction = "level_up";
          outcome = "window_pass";
        }
        levelUp = true;
        correctStreak = 0;
        repeatList.length = 0;
      } else {
        // Window is full but threshold not met → remediation.
        passed = false;
        nextAction = "remediation";
        outcome = "window_fail_remediation";
      }
    } else if (sessionComplete && session.is_remediation) {
      // Remediation sessions: per-session pass IS appropriate (the goal is
      // to clear the failed questions, not progress level).
      const cfg = getRegisterConfig(register);
      const [, reqPct] = cfg.passThresholds[Math.min(Math.max(session.level, 1), 5) as 1 | 2 | 3 | 4 | 5];
      passed = (scorePct ?? 0) >= reqPct;
      if (passed) {
        nextAction = "continue";
        outcome = "remediation_pass";
        repeatList.length = 0;
      } else {
        nextAction = "remediation";
        outcome = "remediation_fail";
      }
    }

    // Finalize the persisted pass flag once it's known.
    if (sessionComplete) {
      await db.update(learningTrackSessionsTable).set({
        passed,
        repeat_question_ids: repeatList,
      }).where(eq(learningTrackSessionsTable.id, session.id));
    }

    if (progressExisting) {
      await db.update(learningTrackProgressTable)
        .set({
          current_level: currentLevel,
          questions_done: questionsDone,
          correct_streak: correctStreak,
          mastered,
          last_updated: new Date(),
        })
        .where(eq(learningTrackProgressTable.id, progressExisting.id));
    } else {
      await db.insert(learningTrackProgressTable).values({
        user_id: userId,
        register,
        research_pillar: pillar,
        phase,
        region_code: question.region_code,
        current_level: currentLevel,
        questions_done: questionsDone,
        correct_streak: correctStreak,
        mastered,
      });
    }

    let newBadges: Awaited<ReturnType<typeof checkAndAwardBadges>> = [];
    if (mastered && !progressExisting?.mastered) {
      try {
        newBadges = await checkAndAwardBadges(userId, register, pillar, phase, question.region_code);
      } catch (badgeErr) {
        req.log.warn({ badgeErr }, "Badge award check failed (non-fatal)");
      }
    }

    return res.json({
      correct: isCorrect,
      answer_tier,
      motivation,
      historical_context: question.historical_context ?? null,
      level_up: levelUp,
      mastered,
      repeat: session.is_remediation,
      correct_streak: correctStreak,
      current_level: currentLevel,
      new_badges: newBadges,
      session_id: session.id,
      session_progress: { answered: newAnswered, total: session.total_questions },
      session_complete: sessionComplete,
      session_score_pct: scorePct,
      session_passed: passed,
      next_action: nextAction,
      outcome,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process learning track answer");
    return res.status(500).json({ message: "Unable to process your answer at this time." });
  }
});

// ─── GET /learning-tracks/progress ───────────────────────────────────────────
router.get("/learning-tracks/progress", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const rows = await db.select()
      .from(learningTrackProgressTable)
      .where(eq(learningTrackProgressTable.user_id, userId));
    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch learning track progress");
    return res.status(500).json({ message: "Progress data is momentarily unavailable." });
  }
});

router.get("/learning-tracks/badges", requireAuthUser, async (req, res) => {
  try {
    const badges = await getUserBadges(getResolvedUserId(req));
    return res.json(badges);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user badges");
    return res.status(500).json({ message: "Badge data is momentarily unavailable." });
  }
});

router.get("/learning-tracks/badges/available", async (req, res) => {
  try {
    const badges = await getAllBadges();
    return res.json(badges);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch badge catalogue");
    return res.status(500).json({ message: "Badge catalogue is momentarily unavailable." });
  }
});

// ─── Country-of-interest endpoints (multi-country parallel progress) ─────────

const RegionCodeSchema = z.object({
  region_code: z.string().min(2).max(10),
});

router.get("/users/country-interests", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    let rows = await db.select()
      .from(userCountryInterestsTable)
      .where(and(
        eq(userCountryInterestsTable.user_id, userId),
        isNull(userCountryInterestsTable.hidden_at),
      ));

    // Auto-backfill for legacy users: if the user has no interests yet but
    // already has an active_region, seed it as their first interest so the
    // UI and the active-region constraint behave correctly without needing
    // a manual data migration.
    if (rows.length === 0) {
      const [u] = await db.select({ active_region: usersTable.active_region })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (u?.active_region) {
        await db.insert(userCountryInterestsTable).values({
          user_id: userId,
          region_code: u.active_region,
          hidden_at: null,
        }).onConflictDoNothing();
        rows = await db.select()
          .from(userCountryInterestsTable)
          .where(and(
            eq(userCountryInterestsTable.user_id, userId),
            isNull(userCountryInterestsTable.hidden_at),
          ));
      }
    }

    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch country interests");
    return res.status(500).json({ message: "Interest data is momentarily unavailable." });
  }
});

router.post("/users/country-interests", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const parsed = RegionCodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A valid region_code is required." });
    const region = parsed.data.region_code.toUpperCase();

    // Re-activate (clear hidden_at) if it existed; otherwise insert.
    await db.insert(userCountryInterestsTable).values({
      user_id: userId,
      region_code: region,
      hidden_at: null,
    }).onConflictDoUpdate({
      target: [userCountryInterestsTable.user_id, userCountryInterestsTable.region_code],
      set: { hidden_at: null, added_at: new Date() },
    });

    const [row] = await db.select().from(userCountryInterestsTable).where(and(
      eq(userCountryInterestsTable.user_id, userId),
      eq(userCountryInterestsTable.region_code, region),
    )).limit(1);

    return res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to add country interest");
    return res.status(500).json({ message: "Unable to add this country at the moment." });
  }
});

router.delete("/users/country-interests/:region_code", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const region = String(req.params.region_code ?? "").toUpperCase();
    if (region.length < 2 || region.length > 10) {
      return res.status(400).json({ message: "A valid region_code is required." });
    }

    // Invariant: active_region must always be in the user's interests. If the
    // caller is removing the region they're currently studying, atomically
    // switch active_region to another active interest first; if they have no
    // other interests, refuse the deletion with 409 so the client can prompt
    // them to pick a replacement.
    const [u] = await db.select({ active_region: usersTable.active_region })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (u?.active_region === region) {
      const others = await db.select({ region_code: userCountryInterestsTable.region_code })
        .from(userCountryInterestsTable)
        .where(and(
          eq(userCountryInterestsTable.user_id, userId),
          isNull(userCountryInterestsTable.hidden_at),
          ne(userCountryInterestsTable.region_code, region),
        ));
      if (others.length === 0) {
        return res.status(409).json({
          code: "ACTIVE_REGION_LAST",
          message: "Add another country to your interests before removing your active focus.",
        });
      }
      await db.update(usersTable)
        .set({ active_region: others[0].region_code })
        .where(eq(usersTable.id, userId));
    }

    // Soft-hide so per-region progress is preserved (the user may re-add later
    // and resume mid-track).
    await db.update(userCountryInterestsTable)
      .set({ hidden_at: new Date() })
      .where(and(
        eq(userCountryInterestsTable.user_id, userId),
        eq(userCountryInterestsTable.region_code, region),
      ));
    return res.json({ region_code: region, hidden_at: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to hide country interest");
    return res.status(500).json({ message: "Unable to remove this country at the moment." });
  }
});

export default router;
