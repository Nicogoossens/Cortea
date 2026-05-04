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

import { db, learningTrackQuestionsTable, learningTrackAttemptsTable, learningTrackSessionsTable, learningTrackProgressTable } from "@workspace/db";
import { and, eq, sql, desc, gte, ne, isNull, inArray, notInArray } from "drizzle-orm";

// ───────────────────────────────────────────────────────────────────────────────
// Prescribed progression order — used by computeNextSlot to walk the student
// through the curriculum sequentially (lowest unmastered slot first).

/** Middle Class: 5 phases × 4 research pillars = 20 slots, walked in order. */
export const MIDDLE_CLASS_PILLAR_ORDER = ["P1", "P2", "P3", "P4"] as const;
export const MIDDLE_CLASS_PHASE_ORDER = [1, 2, 3, 4, 5] as const;

/** Elite: 5 phases (each phase = one pillar), no research_pillar. */
export const ELITE_PHASE_ORDER = [1, 2, 3, 4, 5] as const;

/**
 * Executor type — either the global Drizzle `db` handle or a transaction
 * handle (`tx`) opened via `db.transaction(async (tx) => …)`. Helpers that
 * participate in the session-creation advisory-locked transaction must run on
 * `tx` so reads/writes share the same snapshot and the lock actually protects
 * the question assembly. Defaults to `db` for callers outside a transaction.
 */
type Executor = typeof db;
import {
  shouldLevelUp as pureShouldLevelUp,
  computeReserve as pureComputeReserve,
  isSessionAllowed as pureIsSessionAllowed,
  originMatchesRegion,
} from "./learning-engine-pure";
import { WORLD_COUNTRIES } from "./world-countries";

// Build a name->ISO map once at module load. Lower-cased English names map
// to their ISO-2 code. Used by reRankByInterestAndContrast for deterministic
// origin-vs-region comparison (no fragile substring matches).
const COUNTRY_NAME_TO_ISO: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const c of WORLD_COUNTRIES) m[c.name.toLowerCase()] = c.code;
  return m;
})();

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
      dailyLimit: envInt("LEARNING_MIDDLE_CLASS_DAILY_LIMIT", 9999),
      cooldownMinutes: envInt("LEARNING_MIDDLE_CLASS_COOLDOWN_MINUTES", 5),
      crossDemographicFromLevel: envInt("LEARNING_MIDDLE_CLASS_CROSS_FROM_LEVEL", 3),
      passThresholds: {
        1: [10, 70], 2: [10, 70], 3: [12, 75], 4: [12, 75], 5: [15, 75],
      },
      maxLevel: 5,
    },
    elite: {
      sessionSize: envInt("LEARNING_ELITE_SESSION_SIZE", 5),
      dailyLimit: envInt("LEARNING_ELITE_DAILY_LIMIT", 9999),
      cooldownMinutes: envInt("LEARNING_ELITE_COOLDOWN_MINUTES", 5),
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
  // Contrast scoring is meaningful only when the user is studying a country
  // OTHER than their own. We compare via canonical ISO mapping (name->ISO)
  // rather than substrings to avoid false positives like "Benin".includes("in").
  const originMatchesInterest = originMatchesRegion(
    ctx.countryOfOrigin ?? null,
    ctx.regionCode ?? "",
    COUNTRY_NAME_TO_ISO,
  );
  const contrastEnabled = !!origin && !originMatchesInterest;

  function score(q: RawQuestion): { score: number; source: SelectedQuestion["source"] } {
    let s = 0;
    let source: SelectedQuestion["source"] = "match";
    const tags = Array.isArray(q.interest_tags) ? (q.interest_tags as string[]).map((t) => String(t).toLowerCase()) : [];
    const overlap = tags.filter((t) => interests.has(t)).length;
    if (overlap > 0) {
      s += overlap * 10;
      source = "interest_boost";
    }
    if (contrastEnabled) {
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
export async function selectQuestions(ctx: SelectionContext, executor: Executor = db): Promise<SelectedQuestion[]> {
  const cfg = getRegisterConfig(ctx.register);
  const exclude = new Set(ctx.excludeIds ?? []);
  const result: SelectedQuestion[] = [];

  // ─── Remediation slot first ────────────────────────────────────────────────
  if (ctx.forcedIds && ctx.forcedIds.length > 0) {
    const forced = await executor.select({
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
  const baseConditionsNoLang = [
    eq(learningTrackQuestionsTable.region_code, ctx.regionCode.toUpperCase()),
    eq(learningTrackQuestionsTable.register, ctx.register),
    eq(learningTrackQuestionsTable.phase, ctx.phase),
  ];
  if (ctx.pillar) {
    baseConditionsNoLang.push(eq(learningTrackQuestionsTable.research_pillar, ctx.pillar));
  } else {
    baseConditionsNoLang.push(isNull(learningTrackQuestionsTable.research_pillar));
  }

  // Lang fallback: serve UI-language questions when present, otherwise fall
  // back to English so regions that haven't been translated yet still surface
  // their actual content instead of a misleading "coming soon" screen.
  async function fetchPool(level: number, demographics: string[] | null) {
    const baseConds = [...baseConditionsNoLang, eq(learningTrackQuestionsTable.level, level)];
    if (demographics && demographics.length > 0) {
      baseConds.push(inArray(learningTrackQuestionsTable.demographic, demographics));
    }
    if (exclude.size > 0) {
      baseConds.push(notInArray(learningTrackQuestionsTable.id, Array.from(exclude)));
    }
    const cols = {
      id: learningTrackQuestionsTable.id,
      question_text: learningTrackQuestionsTable.question_text,
      historical_context: learningTrackQuestionsTable.historical_context,
      options: learningTrackQuestionsTable.options,
      demographic: learningTrackQuestionsTable.demographic,
      interest_tags: learningTrackQuestionsTable.interest_tags,
    };
    const primary = await executor.select(cols)
      .from(learningTrackQuestionsTable)
      .where(and(...baseConds, eq(learningTrackQuestionsTable.lang, ctx.lang)))
      .limit(50);
    if (primary.length > 0 || ctx.lang === "en") return primary;
    return executor.select(cols)
      .from(learningTrackQuestionsTable)
      .where(and(...baseConds, eq(learningTrackQuestionsTable.lang, "en")))
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
  // Source of truth for the reservation count is the pure helper exercised
  // by the cross-package test suite.
  const crossReserve = pureComputeReserve(
    ctx.size,
    ctx.level,
    cfg.crossDemographicFromLevel,
    ctx.demographic,
  );
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
  // Gated directly on the reserved slot count (the pure helper already
  // returns 0 when the user IS the 'common' demographic or the level is
  // below the per-register threshold).
  if (crossReserve > 0) {
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

  // Delegate the actual decision to the pure helper so the cross-package
  // vitest suite exercises the same code path the route handler relies on.
  const window: Array<0 | 1> = recent.map((r) => (r.is_correct ? 1 : 0));

  return {
    windowFilled: recent.length,
    windowRequired: windowSize,
    correctInWindow: correct,
    requiredPct,
    shouldLevelUp: pureShouldLevelUp(window, [windowSize, requiredPct]),
  };
}

/**
 * Returns the count of `is_repetition` attempts the user has logged for a
 * specific question. The route uses this to enforce the "after 2 retries on
 * the same question, swap with a similar one" rule.
 */
export async function repetitionCount(userId: string, questionId: number, executor: Executor = db): Promise<number> {
  const [row] = await executor.select({
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

  // Delegate the daily/cooldown decision to the pure helper (same code path
  // the cross-package vitest suite exercises).
  const minutesSinceLast = lastCompletedAt
    ? (Date.now() - new Date(lastCompletedAt).getTime()) / 60000
    : Number.POSITIVE_INFINITY;
  const decision = pureIsSessionAllowed(
    { sessionSize: cfg.sessionSize, dailyLimit: cfg.dailyLimit, cooldownMinutes: cfg.cooldownMinutes, crossDemographicFromLevel: cfg.crossDemographicFromLevel, maxLevel: cfg.maxLevel },
    sessionsToday,
    minutesSinceLast,
  );

  if (!decision.allowed && decision.reason === "daily_limit") {
    const tomorrowUtc = new Date(utcDayStart.getTime() + 24 * 60 * 60 * 1000);
    status.allowed = false;
    status.reason = "daily_limit";
    status.retryAfterSeconds = Math.max(1, Math.ceil((tomorrowUtc.getTime() - Date.now()) / 1000));
    return status;
  }

  if (!decision.allowed && decision.reason === "cooldown" && lastCompletedAt) {
    const elapsed = Date.now() - new Date(lastCompletedAt).getTime();
    const required = cfg.cooldownMinutes * 60 * 1000;
    status.allowed = false;
    status.reason = "cooldown";
    status.retryAfterSeconds = Math.ceil((required - elapsed) / 1000);
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
  lang = "en",
) {
  const conds = [
    eq(learningTrackSessionsTable.user_id, userId),
    eq(learningTrackSessionsTable.register, register),
    eq(learningTrackSessionsTable.region_code, regionCode),
    eq(learningTrackSessionsTable.phase, phase),
    isNull(learningTrackSessionsTable.completed_at),
    // A session that was created with zero served questions is degenerate —
    // it traps the user on the "no content" empty-state forever because the
    // route reuses the open session and never gets a chance to re-run
    // selectQuestions (which would now succeed thanks to the lang fallback).
    // Treat such rows as if they did not exist so a fresh session is built.
    sql`${learningTrackSessionsTable.total_questions} > 0`,
    // Only reuse sessions that were created in the same UI language so that
    // switching from e.g. English to Dutch doesn't serve an English-question
    // session when Dutch rows exist.
    eq(learningTrackSessionsTable.lang, lang),
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

  if (!row) return null;

  // Defensive content-lang check: if any served question's actual lang differs
  // from the session's requested lang the session is stale (created before the
  // lang guard was in place, or via a fallback that stored mismatched content).
  // Discard it so a fresh session is built with the correct language content.
  if (Array.isArray(row.served_question_ids) && (row.served_question_ids as string[]).length > 0) {
    // A session is stale only when questions are in a language that is NEITHER
    // the requested lang NOR English. English questions in a non-English session
    // are intentional fallback (no localized content yet) and must be kept.
    const result = await db.execute<{ mismatch: number }>(sql`
      SELECT COUNT(*)::int AS mismatch
      FROM jsonb_array_elements_text(
        (SELECT served_question_ids FROM learning_track_sessions WHERE id = ${row.id})
      ) AS qid
      JOIN learning_track_questions ltq ON ltq.id::text = qid
      WHERE ltq.lang != ${lang}
        AND ltq.lang != 'en'
      LIMIT 1
    `);
    const mismatch = (result[0] as { mismatch: number } | undefined)?.mismatch ?? 0;
    if (mismatch > 0) return null;
  }

  return row;
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
    isNull(learningTrackSessionsTable.remediated_at),
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

// ───────────────────────────────────────────────────────────────────────────────
// Sequential-walk helper — Task: phase-by-phase auto progression.
//
// Given (user, register, region) we return the FIRST unmastered slot
// (phase + research_pillar) in the prescribed curriculum order, plus a
// progress summary. The frontend uses this to drive a single "Continue
// training" CTA — no more free-pick of phase/pillar.
//
// Slots that have zero seeded questions for the (region, register, phase,
// pillar) combination are skipped — there is nothing to study, so they
// cannot block progression. The skip is decided per-region, so a country
// with no Phase 2 content yet still lets the user finish Phase 1 and then
// surfaces "all_complete=true" until content is seeded.

export interface NextSlot {
  register: Register;
  region_code: string;
  phase: number;
  research_pillar: string | null;
  current_level: number;
  questions_done: number;
  correct_streak: number;
  /** Total slots in the prescribed sequence that actually have questions. */
  total_slots: number;
  /** Slots fully mastered so far. */
  completed_slots: number;
  /** True iff every slot with questions is mastered — UI shows celebration. */
  all_complete: boolean;
}

export async function computeNextSlot(
  userId: string,
  register: Register,
  regionCode: string,
): Promise<NextSlot> {
  // 1. Which (phase, pillar) combos actually have questions for this region?
  const availableRows = await db
    .select({
      phase: learningTrackQuestionsTable.phase,
      research_pillar: learningTrackQuestionsTable.research_pillar,
    })
    .from(learningTrackQuestionsTable)
    .where(and(
      eq(learningTrackQuestionsTable.region_code, regionCode),
      eq(learningTrackQuestionsTable.register, register),
    ))
    .groupBy(
      learningTrackQuestionsTable.phase,
      learningTrackQuestionsTable.research_pillar,
    );

  const available = new Set(
    availableRows.map((r) => `${r.phase}::${r.research_pillar ?? ""}`),
  );

  // 2. Load all progress rows for this user × register × region.
  const progressRows = await db
    .select({
      phase: learningTrackProgressTable.phase,
      research_pillar: learningTrackProgressTable.research_pillar,
      current_level: learningTrackProgressTable.current_level,
      questions_done: learningTrackProgressTable.questions_done,
      correct_streak: learningTrackProgressTable.correct_streak,
      mastered: learningTrackProgressTable.mastered,
    })
    .from(learningTrackProgressTable)
    .where(and(
      eq(learningTrackProgressTable.user_id, userId),
      eq(learningTrackProgressTable.register, register),
      eq(learningTrackProgressTable.region_code, regionCode),
    ));

  const progressByKey = new Map<string, typeof progressRows[number]>();
  for (const p of progressRows) {
    progressByKey.set(`${p.phase}::${p.research_pillar ?? ""}`, p);
  }

  // 3. Build the prescribed slot sequence for the register.
  const slots: Array<{ phase: number; research_pillar: string | null }> = [];
  if (register === "middle_class") {
    for (const ph of MIDDLE_CLASS_PHASE_ORDER) {
      for (const pl of MIDDLE_CLASS_PILLAR_ORDER) {
        slots.push({ phase: ph, research_pillar: pl });
      }
    }
  } else {
    for (const ph of ELITE_PHASE_ORDER) {
      slots.push({ phase: ph, research_pillar: null });
    }
  }

  // 4. Walk the sequence; first slot that (a) has questions and (b) is not
  // mastered is the "next" one. Track totals along the way.
  let totalSlots = 0;
  let completedSlots = 0;
  let nextSlot: { phase: number; research_pillar: string | null } | null = null;
  let nextProgress: typeof progressRows[number] | undefined;

  for (const s of slots) {
    const key = `${s.phase}::${s.research_pillar ?? ""}`;
    if (!available.has(key)) continue;
    totalSlots += 1;
    const prog = progressByKey.get(key);
    if (prog?.mastered) {
      completedSlots += 1;
      continue;
    }
    if (!nextSlot) {
      nextSlot = s;
      nextProgress = prog;
    }
  }

  if (!nextSlot) {
    // Everything available is mastered — or nothing is seeded yet.
    return {
      register,
      region_code: regionCode,
      phase: 1,
      research_pillar: register === "middle_class" ? "P1" : null,
      current_level: 1,
      questions_done: 0,
      correct_streak: 0,
      total_slots: totalSlots,
      completed_slots: completedSlots,
      all_complete: totalSlots > 0,
    };
  }

  return {
    register,
    region_code: regionCode,
    phase: nextSlot.phase,
    research_pillar: nextSlot.research_pillar,
    current_level: nextProgress?.current_level ?? 1,
    questions_done: nextProgress?.questions_done ?? 0,
    correct_streak: nextProgress?.correct_streak ?? 0,
    total_slots: totalSlots,
    completed_slots: completedSlots,
    all_complete: false,
  };
}
