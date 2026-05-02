/**
 * Adaptive learning-engine — Task #209.
 *
 * Pure(-ish) helpers for:
 *   • register configuration (session size, daily limit, cooldown, pass thresholds)
 *   • demographic derivation
 *   • selection cascade (origin+interest+demographic-aware)
 *   • percentage-over-window pass evaluation
 *
 * Anything that talks to Postgres is exported as a small, isolated function so
 * that the route handler stays readable. None of these helpers throw — they
 * always return values, leaving HTTP error mapping to the route layer.
 */

import { db, learningTrackQuestionsTable, learningTrackAttemptsTable, learningTrackSessionsTable } from "@workspace/db";
import { and, eq, sql, desc, gte, ne, isNull, inArray, notInArray } from "drizzle-orm";

// ───────────────────────────────────────────────────────────────────────────────
// Configuration

export type Register = "middle_class" | "elite";

export interface RegisterConfig {
  /** Number of questions returned by a single /session call. */
  sessionSize: number;
  /** Maximum number of started sessions per UTC day for this register. */
  dailyLimit: number;
  /** Minimum minutes between consecutive sessions for this register. */
  cooldownMinutes: number;
  /** Minimum level at which 1 cross-demographic question is mandatorily mixed in. */
  crossDemographicFromLevel: number;
  /**
   * Per-level pass threshold: [windowSize, requiredPercentageCorrect].
   * Once the user has answered ≥ windowSize attempts at the current level,
   * compute correct/window — if ≥ percent, level up.
   */
  passThresholds: Record<1 | 2 | 3 | 4 | 5, [number, number]>;
  /** Highest level. Above this, the track is mastered. */
  maxLevel: number;
}

/**
 * Spec defaults for the Task #209 engine. Each numeric knob can be overridden
 * at boot via env so ops can tune limits without a redeploy
 * (LEARNING_<REGISTER>_<KEY>, e.g. LEARNING_MIDDLE_CLASS_DAILY_LIMIT=4).
 *
 * Long-term these will move to a config table; the indirection through
 * `loadRegisterConfig` keeps that future swap a one-liner.
 */
function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function loadRegisterConfig(): Record<Register, RegisterConfig> {
  return {
    middle_class: {
      sessionSize: envInt("LEARNING_MIDDLE_CLASS_SESSION_SIZE", 8),
      dailyLimit: envInt("LEARNING_MIDDLE_CLASS_DAILY_LIMIT", 3),
      cooldownMinutes: envInt("LEARNING_MIDDLE_CLASS_COOLDOWN_MINUTES", 30),
      crossDemographicFromLevel: envInt("LEARNING_MIDDLE_CLASS_CROSS_FROM_LEVEL", 3),
      passThresholds: {
        1: [10, 70], 2: [10, 70], 3: [12, 75], 4: [12, 75], 5: [15, 75],
      },
      maxLevel: 5,
    },
    elite: {
      sessionSize: envInt("LEARNING_ELITE_SESSION_SIZE", 5),
      dailyLimit: envInt("LEARNING_ELITE_DAILY_LIMIT", 2),
      cooldownMinutes: envInt("LEARNING_ELITE_COOLDOWN_MINUTES", 60),
      crossDemographicFromLevel: envInt("LEARNING_ELITE_CROSS_FROM_LEVEL", 2),
      passThresholds: {
        1: [10, 75], 2: [10, 75], 3: [15, 80], 4: [18, 80], 5: [20, 80],
      },
      maxLevel: 5,
    },
  };
}

export const REGISTER_CONFIG: Record<Register, RegisterConfig> = loadRegisterConfig();

export function getRegisterConfig(register: Register): RegisterConfig {
  return REGISTER_CONFIG[register];
}

// ───────────────────────────────────────────────────────────────────────────────
// Demographic derivation (same rules as the legacy code; preserved for
// backward compatibility with seeded question rows tagged `men_19_30` etc.)

const CURRENT_YEAR = new Date().getFullYear();

export function deriveDemographic(
  birthYear: number | null | undefined,
  genderIdentity: string | null | undefined,
): string {
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

/**
 * Returns the "sibling" demographics used by the cross-demographic mix-in
 * rule (same gender, different age band, plus the opposite-gender peer).
 * If the user is `common`, no sibling list is meaningful.
 */
export function siblingDemographics(primary: string): string[] {
  if (primary === "common") return [];
  const m = primary.match(/^(men|women)_(19_30|30_50|50plus)$/);
  if (!m) return [];
  const [, gender, age] = m;
  const otherGender = gender === "men" ? "women" : "men";
  const otherAges = (["19_30", "30_50", "50plus"] as const).filter((a) => a !== age);
  return [
    ...otherAges.map((a) => `${gender}_${a}`),
    `${otherGender}_${age}`,
  ];
}

// ───────────────────────────────────────────────────────────────────────────────
// Selection cascade

export interface SelectionContext {
  userId: string;
  register: Register;
  regionCode: string;             // ISO 3166-1 alpha-2 of the *interest* country
  countryOfOrigin: string | null; // free-text country name from the user profile
  situationalInterests: string[];
  demographic: string;            // derived primary demographic
  pillar: string | null;          // research_pillar (middle_class) or null (elite)
  phase: number;
  level: number;
  lang: string;
  size: number;                   // total questions to serve in this session
  excludeIds?: number[];          // already-served question ids in this session
  forcedIds?: number[];           // remediation: serve these first if still relevant
}

export interface SelectedQuestion {
  id: number;
  question_text: string;
  historical_context: string | null;
  options: { text: string }[];
  /** Tag noting *why* this question was selected (debug + analytics). */
  source: "match" | "interest_boost" | "contrast_boost" | "common_fill" | "cross_demographic" | "remediation";
  /** True when this is a repetition slot — UI shows study_context first. */
  is_repetition: boolean;
  /** Same as historical_context; prefixed semantically for the repetition UX. */
  study_context: string | null;
}

interface RawQuestion {
  id: number;
  question_text: string;
  historical_context: string | null;
  options: unknown;
  demographic: string;
  interest_tags: unknown;
}

function sanitize(q: RawQuestion, source: SelectedQuestion["source"], isRepetition: boolean): SelectedQuestion {
  const opts = Array.isArray(q.options) ? (q.options as { text?: unknown }[]) : [];
  return {
    id: q.id,
    question_text: q.question_text,
    historical_context: q.historical_context ?? null,
    options: opts.map((o) => ({ text: String(o?.text ?? "") })),
    source,
    is_repetition: isRepetition,
    study_context: isRepetition ? (q.historical_context ?? null) : null,
  };
}

/**
 * Inner re-rank: given an unordered pool from a single tier of the cascade,
 * sort it so questions whose `interest_tags` overlap the user's
 * `situational_interests` (or whose body mentions the user's origin country
 * for contrast) come first. Ties broken by id for determinism.
 */
function reRankByInterestAndContrast(
  pool: RawQuestion[],
  ctx: SelectionContext,
): { question: RawQuestion; source: SelectedQuestion["source"] }[] {
  const interests = new Set(ctx.situationalInterests.map((s) => s.toLowerCase()));
  const origin = ctx.countryOfOrigin?.trim().toLowerCase() ?? "";

  function score(q: RawQuestion): { score: number; source: SelectedQuestion["source"] } {
    let s = 0;
    let source: SelectedQuestion["source"] = "match";
    const tags = Array.isArray(q.interest_tags) ? (q.interest_tags as string[]).map((t) => String(t).toLowerCase()) : [];
    const overlap = tags.filter((t) => interests.has(t)).length;
    if (overlap > 0) {
      s += overlap * 10;
      source = "interest_boost";
    }
    if (origin) {
      const haystack = `${q.question_text} ${q.historical_context ?? ""}`.toLowerCase();
      if (haystack.includes(origin)) {
        s += 7;
        if (source === "match") source = "contrast_boost";
      }
      const tagHasContrast = tags.some((t) => t === "contrast" || t === "cross_cultural");
      if (tagHasContrast) {
        s += 5;
        if (source === "match") source = "contrast_boost";
      }
    }
    return { score: s, source };
  }

  return pool
    .map((q) => ({ question: q, ...score(q) }))
    .sort((a, b) => b.score - a.score || a.question.id - b.question.id)
    .map(({ question, source }) => ({ question, source }));
}

/**
 * The 5-tier selection cascade.
 *
 *   1.  Full match: register + pillar + phase + level + region + lang + demographic
 *   2.  Re-rank (1) by interest overlap and origin/contrast boost
 *   3.  If pool size < 60% of session size → top up from `demographic = "common"`
 *   4.  Cross-demographic top-up (mandatory at higher levels) — pulls from
 *       sibling demographics, capped at floor(size / 4) so it stays a minority
 *   5.  Same query but at level - 1 (if any slots still empty and level > 1)
 *
 * Forced/remediation IDs (from the previous failed session) are slotted at the
 * front of the list and tagged `source: "remediation"`.
 */
export async function selectQuestions(ctx: SelectionContext): Promise<SelectedQuestion[]> {
  const cfg = getRegisterConfig(ctx.register);
  const exclude = new Set(ctx.excludeIds ?? []);
  const result: SelectedQuestion[] = [];

  // ─── Remediation slot first ────────────────────────────────────────────────
  if (ctx.forcedIds && ctx.forcedIds.length > 0) {
    const forced = await db.select({
      id: learningTrackQuestionsTable.id,
      question_text: learningTrackQuestionsTable.question_text,
      historical_context: learningTrackQuestionsTable.historical_context,
      options: learningTrackQuestionsTable.options,
      demographic: learningTrackQuestionsTable.demographic,
      interest_tags: learningTrackQuestionsTable.interest_tags,
    })
      .from(learningTrackQuestionsTable)
      .where(inArray(learningTrackQuestionsTable.id, ctx.forcedIds));

    const byId = new Map(forced.map((q) => [q.id, q as RawQuestion]));
    for (const id of ctx.forcedIds) {
      if (result.length >= ctx.size) break;
      const q = byId.get(id);
      if (!q || exclude.has(q.id)) continue;
      result.push(sanitize(q, "remediation", true));
      exclude.add(q.id);
    }
  }

  if (result.length >= ctx.size) return result.slice(0, ctx.size);

  // ─── Tier 1+2: full demographic match, re-ranked ───────────────────────────
  const baseConditions = [
    eq(learningTrackQuestionsTable.region_code, ctx.regionCode.toUpperCase()),
    eq(learningTrackQuestionsTable.register, ctx.register),
    eq(learningTrackQuestionsTable.phase, ctx.phase),
    eq(learningTrackQuestionsTable.lang, ctx.lang),
  ];
  if (ctx.pillar) {
    baseConditions.push(eq(learningTrackQuestionsTable.research_pillar, ctx.pillar));
  } else {
    baseConditions.push(isNull(learningTrackQuestionsTable.research_pillar));
  }

  async function fetchPool(level: number, demographics: string[] | null) {
    const conds = [...baseConditions, eq(learningTrackQuestionsTable.level, level)];
    if (demographics && demographics.length > 0) {
      conds.push(inArray(learningTrackQuestionsTable.demographic, demographics));
    }
    if (exclude.size > 0) {
      conds.push(notInArray(learningTrackQuestionsTable.id, Array.from(exclude)));
    }
    return db.select({
      id: learningTrackQuestionsTable.id,
      question_text: learningTrackQuestionsTable.question_text,
      historical_context: learningTrackQuestionsTable.historical_context,
      options: learningTrackQuestionsTable.options,
      demographic: learningTrackQuestionsTable.demographic,
      interest_tags: learningTrackQuestionsTable.interest_tags,
    })
      .from(learningTrackQuestionsTable)
      .where(and(...conds))
      .limit(50);
  }

  function pushAll(items: { question: RawQuestion; source: SelectedQuestion["source"] }[]) {
    for (const { question, source } of items) {
      if (result.length >= ctx.size) break;
      if (exclude.has(question.id)) continue;
      result.push(sanitize(question, source, false));
      exclude.add(question.id);
    }
  }

  // Reserve a guaranteed slot count for cross-demographic at level ≥ threshold
  // so the requirement is honoured even when the primary pool is large.
  const mustCross =
    ctx.level >= cfg.crossDemographicFromLevel && ctx.demographic !== "common";
  const crossReserve = mustCross ? Math.max(1, Math.floor(ctx.size / 4)) : 0;
  const primaryBudget = Math.max(1, ctx.size - crossReserve - result.length);

  const primaryPool = await fetchPool(ctx.level, [ctx.demographic]);
  const ranked = reRankByInterestAndContrast(primaryPool as RawQuestion[], ctx);

  // Tier 3: if we don't have at least 60% of the primary budget from the
  // primary pool, pull common fillers — but never let primary+common exceed
  // the budget so the reserved cross slots are preserved.
  const sixtyPctTarget = Math.ceil(primaryBudget * 0.6);
  const primaryCapped = ranked.slice(0, primaryBudget);
  if (primaryCapped.length < sixtyPctTarget) {
    const commonPool = await fetchPool(ctx.level, ["common"]);
    const rankedCommon = reRankByInterestAndContrast(commonPool as RawQuestion[], ctx)
      .map(({ question }) => ({ question, source: "common_fill" as const }))
      .slice(0, primaryBudget - primaryCapped.length);
    pushAll([...primaryCapped, ...rankedCommon]);
  } else {
    pushAll(primaryCapped);
  }

  // Tier 4: cross-demographic mandatory mix-in once level >= threshold.
  // Now using the reserved slot count (not "leftover space").
  if (mustCross) {
    const crossCap = crossReserve;
    const crossPool = await fetchPool(ctx.level, siblingDemographics(ctx.demographic));
    const rankedCross = reRankByInterestAndContrast(crossPool as RawQuestion[], ctx)
      .slice(0, crossCap)
      .map(({ question }) => ({ question, source: "cross_demographic" as const }));
    pushAll(rankedCross);
  }

  // Tier 5: backfill from previous level if still short (rare)
  if (result.length < ctx.size && ctx.level > 1) {
    const backfillPool = await fetchPool(ctx.level - 1, null);
    const rankedBackfill = reRankByInterestAndContrast(backfillPool as RawQuestion[], ctx)
      .map(({ question }) => ({ question, source: "common_fill" as const }));
    pushAll(rankedBackfill);
  }

  return result.slice(0, ctx.size);
}

// ───────────────────────────────────────────────────────────────────────────────
// Pass engine (percentage-over-window)

export interface PassWindowResult {
  /** Number of attempts considered in the rolling window. */
  windowFilled: number;
  /** Required attempts before the engine evaluates pass/fail. */
  windowRequired: number;
  /** Correct answers within the window. */
  correctInWindow: number;
  /** Required percentage correct. */
  requiredPct: number;
  /** True if the window is full and percentage met → user levels up. */
  shouldLevelUp: boolean;
}

/**
 * Read the most-recent N attempts at this exact (register, region, pillar,
 * phase, level) and compute whether the user clears the window threshold.
 *
 * Note: only attempts with `is_repetition = false` count toward progression —
 * remediation passes are diagnostic, not promotional.
 */
export async function evaluatePassWindow(
  userId: string,
  register: Register,
  regionCode: string,
  pillar: string | null,
  phase: number,
  level: number,
): Promise<PassWindowResult> {
  const cfg = getRegisterConfig(register);
  const tier = cfg.passThresholds[Math.min(Math.max(level, 1), 5) as 1 | 2 | 3 | 4 | 5];
  const [windowSize, requiredPct] = tier;

  const conds = [
    eq(learningTrackAttemptsTable.user_id, userId),
    eq(learningTrackAttemptsTable.register, register),
    eq(learningTrackAttemptsTable.region_code, regionCode),
    eq(learningTrackAttemptsTable.phase, phase),
    eq(learningTrackAttemptsTable.level, level),
    eq(learningTrackAttemptsTable.is_repetition, false),
  ];
  if (pillar) {
    conds.push(eq(learningTrackAttemptsTable.research_pillar, pillar));
  } else {
    conds.push(isNull(learningTrackAttemptsTable.research_pillar));
  }

  const recent = await db.select({
    is_correct: learningTrackAttemptsTable.is_correct,
  })
    .from(learningTrackAttemptsTable)
    .where(and(...conds))
    .orderBy(desc(learningTrackAttemptsTable.attempted_at))
    .limit(windowSize);

  const correct = recent.filter((r) => r.is_correct).length;
  const pct = recent.length === 0 ? 0 : Math.round((correct / recent.length) * 100);

  return {
    windowFilled: recent.length,
    windowRequired: windowSize,
    correctInWindow: correct,
    requiredPct,
    shouldLevelUp: recent.length >= windowSize && pct >= requiredPct,
  };
}

/**
 * Returns the count of `is_repetition` attempts the user has logged for a
 * specific question. The route uses this to enforce the "after 2 retries on
 * the same question, swap with a similar one" rule.
 */
export async function repetitionCount(userId: string, questionId: number): Promise<number> {
  const [row] = await db.select({
    n: sql<number>`count(*)::int`,
  })
    .from(learningTrackAttemptsTable)
    .where(and(
      eq(learningTrackAttemptsTable.user_id, userId),
      eq(learningTrackAttemptsTable.question_id, questionId),
      eq(learningTrackAttemptsTable.is_repetition, true),
    ));
  return row?.n ?? 0;
}

// ───────────────────────────────────────────────────────────────────────────────
// Daily-limit / cooldown enforcement

export interface LimitStatus {
  allowed: boolean;
  reason?: "daily_limit" | "cooldown";
  /** Seconds until the user may start a new session. */
  retryAfterSeconds?: number;
  /** How many sessions started today (UTC). */
  sessionsToday: number;
  dailyLimit: number;
  /** Last completed_at for this register, if any. */
  lastCompletedAt: Date | null;
  cooldownMinutes: number;
}

/**
 * Compute today's session count + cooldown remainder for one register.
 * UTC day boundary keeps the rule deterministic across timezones.
 */
export async function computeSessionLimits(
  userId: string,
  register: Register,
): Promise<LimitStatus> {
  const cfg = getRegisterConfig(register);

  const utcDayStart = new Date();
  utcDayStart.setUTCHours(0, 0, 0, 0);

  const [countRow] = await db.select({
    n: sql<number>`count(*)::int`,
  })
    .from(learningTrackSessionsTable)
    .where(and(
      eq(learningTrackSessionsTable.user_id, userId),
      eq(learningTrackSessionsTable.register, register),
      gte(learningTrackSessionsTable.started_at, utcDayStart),
    ));

  const sessionsToday = countRow?.n ?? 0;

  const [latest] = await db.select({
    completed_at: learningTrackSessionsTable.completed_at,
  })
    .from(learningTrackSessionsTable)
    .where(and(
      eq(learningTrackSessionsTable.user_id, userId),
      eq(learningTrackSessionsTable.register, register),
    ))
    .orderBy(desc(learningTrackSessionsTable.started_at))
    .limit(1);

  const lastCompletedAt = latest?.completed_at ?? null;

  const status: LimitStatus = {
    allowed: true,
    sessionsToday,
    dailyLimit: cfg.dailyLimit,
    lastCompletedAt,
    cooldownMinutes: cfg.cooldownMinutes,
  };

  if (sessionsToday >= cfg.dailyLimit) {
    const tomorrowUtc = new Date(utcDayStart.getTime() + 24 * 60 * 60 * 1000);
    status.allowed = false;
    status.reason = "daily_limit";
    status.retryAfterSeconds = Math.max(1, Math.ceil((tomorrowUtc.getTime() - Date.now()) / 1000));
    return status;
  }

  if (lastCompletedAt) {
    const elapsed = Date.now() - new Date(lastCompletedAt).getTime();
    const required = cfg.cooldownMinutes * 60 * 1000;
    if (elapsed < required) {
      status.allowed = false;
      status.reason = "cooldown";
      status.retryAfterSeconds = Math.ceil((required - elapsed) / 1000);
    }
  }

  return status;
}

// ───────────────────────────────────────────────────────────────────────────────
// Open-session lookup (back-compat: callers that omit session_id)

export async function findOpenSession(
  userId: string,
  register: Register,
  regionCode: string,
  pillar: string | null,
  phase: number,
) {
  const conds = [
    eq(learningTrackSessionsTable.user_id, userId),
    eq(learningTrackSessionsTable.register, register),
    eq(learningTrackSessionsTable.region_code, regionCode),
    eq(learningTrackSessionsTable.phase, phase),
    isNull(learningTrackSessionsTable.completed_at),
  ];
  if (pillar) {
    conds.push(eq(learningTrackSessionsTable.research_pillar, pillar));
  } else {
    conds.push(isNull(learningTrackSessionsTable.research_pillar));
  }
  const [row] = await db.select()
    .from(learningTrackSessionsTable)
    .where(and(...conds))
    .orderBy(desc(learningTrackSessionsTable.started_at))
    .limit(1);
  return row ?? null;
}

/**
 * Find the most recent *failed and completed* session for this track. Its
 * wrong answers feed the next session's remediation queue.
 */
export async function lastFailedSession(
  userId: string,
  register: Register,
  regionCode: string,
  pillar: string | null,
  phase: number,
) {
  const conds = [
    eq(learningTrackSessionsTable.user_id, userId),
    eq(learningTrackSessionsTable.register, register),
    eq(learningTrackSessionsTable.region_code, regionCode),
    eq(learningTrackSessionsTable.phase, phase),
    eq(learningTrackSessionsTable.passed, false),
    ne(learningTrackSessionsTable.is_remediation, true),
  ];
  if (pillar) {
    conds.push(eq(learningTrackSessionsTable.research_pillar, pillar));
  } else {
    conds.push(isNull(learningTrackSessionsTable.research_pillar));
  }
  const [row] = await db.select()
    .from(learningTrackSessionsTable)
    .where(and(...conds))
    .orderBy(desc(learningTrackSessionsTable.completed_at))
    .limit(1);
  return row ?? null;
}
