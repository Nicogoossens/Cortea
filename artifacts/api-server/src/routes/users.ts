import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, nobleScoreLogTable, zuil_voortgangTable, userCountryInterestsTable, DEFAULT_BEHAVIOR_PROFILE, type BehaviorProfile, type PrivacySettings } from "@workspace/db";
import { eq, and, ne, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";

const router = Router();

/**
 * Compute an age group for etiquette and accessibility calibration.
 *
 * Primary source  : birth_year  (explicit, most accurate).
 * Secondary source: noble_score (Noble Score age estimation — Ambassador level ≥ 600
 *   or Grand Master ≥ 1000 suggests a highly committed, often mature practitioner;
 *   used only when birth_year is absent so the client need not perform arithmetic).
 *
 * The returned group drives the accessibility font-scaling hint on the client:
 *   "senior_elder" or "established_practitioner" → auto-large font (55+ UX).
 */
function computeAgeGroup(
  birthYear: number | null | undefined,
  nobleScore?: number | null,
): string {
  if (birthYear) {
    const age = new Date().getFullYear() - birthYear;
    if (age < 25) return "young_professional";
    if (age < 40) return "mid_career";
    if (age < 55) return "mature";
    return "senior_elder"; // 55+ → triggers auto-large font
  }

  // Noble Score age estimation fallback (no birth_year supplied)
  const score = nobleScore ?? 0;
  if (score >= 600) return "established_practitioner"; // Ambassador/Grand Master → also triggers font hint
  return "unknown";
}

router.get("/users/profile", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    const { session_token: _st, verification_token: _vt, ...safeUser } = user;
    return res.json({
      ...safeUser,
      age_group: computeAgeGroup(user.birth_year, user.noble_score),
      gender: user.gender_identity ?? null,
      privacy_settings: user.privacy_settings ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user profile");
    return res.status(500).json({ error: "We encountered a difficulty retrieving your profile." });
  }
});

const CreateProfileBodySchema = z.object({
  birth_year: z.number().int().min(1900).max(2010).optional().nullable(),
  gender_identity: z.string().optional().nullable(),
  gender_expression: z.string().optional().nullable(),
  ambition_level: z.enum(["casual", "professional", "diplomatic"]).optional(),
  language_code: z.string().regex(/^[a-z]{2,3}$/).optional(),
  active_region: z.string().regex(/^[A-Z]{2,3}$/).optional(),
});

/**
 * POST /users/profile — create or update a profile entry for the authenticated user.
 * The user identity is derived exclusively from the Bearer token; no body-supplied ID is accepted.
 */
router.post("/users/profile", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = CreateProfileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "The information provided does not meet the required form." });
    }

    const data = parsed.data;
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (existing) {
      const [updated] = await db.update(usersTable)
        .set({
          birth_year: data.birth_year ?? existing.birth_year,
          gender_identity: data.gender_identity ?? existing.gender_identity,
          gender_expression: data.gender_expression ?? existing.gender_expression,
          ambition_level: data.ambition_level ?? existing.ambition_level,
          language_code: data.language_code ?? existing.language_code,
          active_region: data.active_region ?? existing.active_region,
        })
        .where(eq(usersTable.id, userId))
        .returning();
      const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
      return res.json({ ...safeUser, age_group: computeAgeGroup(updated.birth_year), gender: updated.gender_identity ?? null });
    }

    return res.status(404).json({ error: "No account exists for this session. Please register first." });
  } catch (err) {
    req.log.error({ err }, "Failed to create/update user profile");
    return res.status(500).json({ error: "A difficulty arose while establishing your profile." });
  }
});

const UpdateProfileBodySchema = z.object({
  birth_year: z.number().int().min(1900).max(2010).optional().nullable(),
  gender_identity: z.string().optional().nullable(),
  gender_expression: z.string().optional().nullable(),
  ambition_level: z.enum(["casual", "professional", "diplomatic"]).optional(),
  language_code: z.string().regex(/^[a-z]{2,3}$/).optional(),
  active_region: z.string().regex(/^[A-Z]{2,3}$/).optional(),
  subscription_tier: z.enum(["guest", "student", "traveller", "ambassador"]).optional(),
  country_of_origin: z.string().max(100).optional().nullable(),
  objectives: z.array(z.enum(["business", "elite", "romantic", "world_traveller"])).optional(),
  interests_sports: z.array(z.string()).optional(),
  interests_cuisine: z.array(z.string()).optional(),
  interests_dress_code: z.array(z.string()).optional(),
  onboarding_completed: z.boolean().optional(),
  username: z.string().max(50).optional().nullable(),
  full_name: z.string().max(150).optional().nullable(),
  avatar_url: z.string().max(2000000).optional().nullable(),
  situational_interests: z.array(z.enum([
    "business", "gastronomy", "arts_culture",
    "music_entertainment", "formal_events", "lifestyle_wellness", "travel_hospitality",
  ])).optional(),
});

async function handleUpdateProfile(req: Request, res: Response): Promise<Response | void> {
  try {
    const userId = getResolvedUserId(req);

    const bodyParsed = UpdateProfileBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ error: "The information provided does not meet the required form." });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    const data = bodyParsed.data;

    // ── active_region invariant ──────────────────────────────────────────────
    // The unified profile patch must enforce the same rule as
    // `PATCH /users/profile/region`: active_region must be ∈ the user's
    // (non-hidden) country interests once any interests exist. Without this
    // guard a caller could desync focus region from interests by routing
    // through the unified endpoint.
    if (data.active_region !== undefined) {
      const interests = await db.select({
        region_code: userCountryInterestsTable.region_code,
      })
        .from(userCountryInterestsTable)
        .where(and(
          eq(userCountryInterestsTable.user_id, userId),
          isNull(userCountryInterestsTable.hidden_at),
        ));
      if (interests.length > 0 && !interests.some((r) => r.region_code === data.active_region)) {
        return res.status(403).json({
          code: "REGION_NOT_IN_INTERESTS",
          error: "Add this country to your interests before switching focus to it.",
        });
      }
    }

    if (data.username) {
      const [taken] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(eq(usersTable.username, data.username), ne(usersTable.id, userId))).limit(1);
      if (taken) return res.status(409).json({ code: "USERNAME_TAKEN", error: "This username is already claimed by another member." });
    }

    if (data.full_name) {
      const [taken] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(eq(usersTable.full_name, data.full_name), ne(usersTable.id, userId))).limit(1);
      if (taken) return res.status(409).json({ code: "FULL_NAME_TAKEN", error: "This display name is already in use by another member." });
    }

    // ── country_of_origin permanent lock ─────────────────────────────────────
    // The user may set country_of_origin once. Subsequent attempts to change
    // it (when `country_of_origin_locked_at` is non-null) are silently ignored
    // so the rest of the patch can still go through (e.g. updating sports
    // interests should not 409 just because the user also re-sent their
    // unchanged origin field). Setting an origin for the first time also
    // stamps the lock timestamp.
    let originUpdate: { country_of_origin?: string | null; country_of_origin_locked_at?: Date } = {};
    if (data.country_of_origin !== undefined) {
      const incoming = (data.country_of_origin ?? "").trim() || null;
      if (existing.country_of_origin_locked_at) {
        if (incoming && incoming !== existing.country_of_origin) {
          // 403 (per spec) — the resource exists; the caller is not
          // authorised to mutate it. Origin is set-once.
          return res.status(403).json({
            code: "ORIGIN_LOCKED",
            error: "Your country of origin is permanent. Please contact support if a correction is required.",
          });
        }
        // No-op: skip writing the field at all
      } else if (incoming) {
        originUpdate = { country_of_origin: incoming, country_of_origin_locked_at: new Date() };
      } else {
        originUpdate = { country_of_origin: null };
      }
    }

    const [updated] = await db.update(usersTable)
      .set({
        ...(data.birth_year !== undefined && { birth_year: data.birth_year }),
        ...(data.gender_identity !== undefined && { gender_identity: data.gender_identity }),
        ...(data.gender_expression !== undefined && { gender_expression: data.gender_expression }),
        ...(data.ambition_level !== undefined && { ambition_level: data.ambition_level }),
        ...(data.language_code !== undefined && { language_code: data.language_code }),
        ...(data.active_region !== undefined && { active_region: data.active_region }),
        ...(data.subscription_tier !== undefined && { subscription_tier: data.subscription_tier }),
        ...originUpdate,
        ...(data.username !== undefined && { username: data.username }),
        ...(data.full_name !== undefined && { full_name: data.full_name }),
        ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
        ...(data.objectives !== undefined && { objectives: data.objectives }),
        ...(data.interests_sports !== undefined && { interests_sports: data.interests_sports }),
        ...(data.interests_cuisine !== undefined && { interests_cuisine: data.interests_cuisine }),
        ...(data.interests_dress_code !== undefined && { interests_dress_code: data.interests_dress_code }),
        ...(data.onboarding_completed !== undefined && { onboarding_completed: data.onboarding_completed }),
        ...(data.situational_interests !== undefined && { situational_interests: data.situational_interests }),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json({ ...safeUser, age_group: computeAgeGroup(updated.birth_year), gender: updated.gender_identity ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to update user profile");
    return res.status(500).json({ error: "A difficulty arose while updating your profile." });
  }
}

router.put("/users/profile", requireAuthUser, handleUpdateProfile);
router.patch("/users/profile", requireAuthUser, handleUpdateProfile);

const PatchPreferencesQuerySchema = z.object({
  user_id: z.string().min(1),
});

const PatchPreferencesBodySchema = z.object({
  language_code: z.string().min(2).max(10).optional(),
  active_region: z.string().min(2).max(10).optional(),
}).refine(
  (data) => data.language_code !== undefined || data.active_region !== undefined,
  { message: "At least one of language_code or active_region must be provided." },
);

// NOTE: A second `PATCH /users/profile` handler used to be defined here that
// only accepted language_code/active_region with a `?user_id=` query check.
// Express resolves the first matching route, so it was dead code. The unified
// `handleUpdateProfile` above already accepts both fields and uses the
// authenticated user as the authority — no `user_id` query param needed.
//
// Removed in Task #209 to eliminate the duplicate registration confusion that
// previously made it ambiguous which validation rules were in effect.

const UpdateRegionBodySchema = z.object({
  region_code: z.string().min(1),
});

router.patch("/users/profile/region", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const bodyParsed = UpdateRegionBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ error: "The region code provided is not recognised." });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    const incomingRegion = bodyParsed.data.region_code.toUpperCase();

    // Once the user has any active country interests, the active focus must
    // be one of them — arbitrary regions are not allowed. Users with zero
    // interests yet (fresh accounts) are allowed to set anything; that first
    // active region is also auto-added to interests below.
    const interests = await db.select({ region_code: userCountryInterestsTable.region_code })
      .from(userCountryInterestsTable)
      .where(and(
        eq(userCountryInterestsTable.user_id, userId),
        isNull(userCountryInterestsTable.hidden_at),
      ));
    if (interests.length > 0 && !interests.some((r) => r.region_code === incomingRegion)) {
      return res.status(403).json({
        code: "REGION_NOT_IN_INTERESTS",
        error: "Add this country to your interests before setting it as your active focus.",
      });
    }
    if (interests.length === 0) {
      // Auto-track the first focus as an interest so subsequent calls enforce.
      await db.insert(userCountryInterestsTable).values({
        user_id: userId,
        region_code: incomingRegion,
        hidden_at: null,
      }).onConflictDoNothing();
    }

    const newHistory = Array.from(new Set([...existing.region_history, incomingRegion]));

    const [updated] = await db.update(usersTable)
      .set({
        active_region: incomingRegion,
        region_history: newHistory,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json({ ...safeUser, age_group: computeAgeGroup(updated.birth_year), gender: updated.gender_identity ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to update region");
    return res.status(500).json({ error: "The region update encountered a difficulty." });
  }
});

router.get("/users/behavior-profile", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const [user] = await db
      .select({ behavior_profile: usersTable.behavior_profile })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) return res.status(404).json({ error: "Profile not found." });
    return res.json(user.behavior_profile ?? DEFAULT_BEHAVIOR_PROFILE);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch behavior profile");
    return res.status(500).json({ error: "The behavioral profile is momentarily unavailable." });
  }
});

const PrivacySettingsSchema = z.object({
  incognito: z.boolean(),
  cameraEnabled: z.boolean(),
  microphoneEnabled: z.boolean(),
  locationEnabled: z.boolean(),
  autoCleanup: z.boolean(),
});

router.delete("/users/profile/privacy", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    await db.update(usersTable)
      .set({ privacy_settings: null })
      .where(eq(usersTable.id, userId));

    return res.json({ privacy_settings: null });
  } catch (err) {
    req.log.error({ err }, "Failed to reset privacy settings");
    return res.status(500).json({ error: "A difficulty arose while resetting your privacy settings." });
  }
});

router.patch("/users/profile/privacy", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = PrivacySettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "The privacy settings provided are not in the expected form." });
    }

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    await db.update(usersTable)
      .set({ privacy_settings: parsed.data })
      .where(eq(usersTable.id, userId));

    return res.json({ privacy_settings: parsed.data });
  } catch (err) {
    req.log.error({ err }, "Failed to update privacy settings");
    return res.status(500).json({ error: "A difficulty arose while saving your privacy settings." });
  }
});

/**
 * GET /me/export — compatibility alias for /users/me/export (GDPR Art. 20).
 * Kept to match the task spec which named the route /api/me/export.
 */
router.get("/me/export", requireAuthUser, (req, res, next) => {
  req.url = "/users/me/export";
  next("router");
});

/**
 * GET /users/me/export — GDPR Art. 20 Right to Data Portability.
 * Returns a structured JSON export of all personal data held for the user.
 */
router.get("/users/me/export", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    const nobleScoreLogs = await db.select()
      .from(nobleScoreLogTable)
      .where(eq(nobleScoreLogTable.user_id, userId))
      .orderBy(desc(nobleScoreLogTable.timestamp));

    const pillarProgress = await db.select()
      .from(zuil_voortgangTable)
      .where(eq(zuil_voortgangTable.user_id, userId));

    const exportPayload = {
      exported_at: new Date().toISOString(),
      gdpr_basis: "Art. 20 GDPR — Right to Data Portability",
      account: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        birth_year: user.birth_year,
        gender_identity: user.gender_identity,
        gender_expression: user.gender_expression,
        language_code: user.language_code,
        active_region: user.active_region,
        region_history: user.region_history,
        country_of_origin: user.country_of_origin,
        ambition_level: user.ambition_level,
        subscription_tier: user.subscription_tier,
        objectives: user.objectives,
        interests_sports: user.interests_sports,
        interests_cuisine: user.interests_cuisine,
        interests_dress_code: user.interests_dress_code,
        situational_interests: user.situational_interests,
        onboarding_completed: user.onboarding_completed,
        daily_streak: user.daily_streak,
        last_activity_date: user.last_activity_date,
        created_at: user.created_at,
        profiling_consent: user.profiling_consent,
      },
      noble_score: {
        current: user.noble_score,
        log: nobleScoreLogs.map((l) => ({
          id: l.id,
          scenario_id: l.scenario_id,
          score_delta: l.score_delta,
          trigger: l.trigger,
          level_name_after: l.level_name_after,
          timestamp: l.timestamp,
        })),
      },
      behavioral_profile: user.behavior_profile ?? DEFAULT_BEHAVIOR_PROFILE,
      pillar_progress: pillarProgress.map((p) => ({
        pillar: p.pillar,
        score: p.score,
        current_title: p.current_title,
        updated_at: p.updated_at,
      })),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cortea-data-export-${userId.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json"`,
    );
    return res.json(exportPayload);
  } catch (err) {
    req.log.error({ err }, "Failed to generate data export");
    return res.status(500).json({ error: "We encountered a difficulty generating your data export." });
  }
});

/**
 * PATCH /users/profile/profiling-consent — GDPR Art. 21 Right to Object.
 * Toggles behavioural profiling on or off for the authenticated user.
 */
const ProfilingConsentSchema = z.object({
  profiling_consent: z.boolean(),
});

router.patch("/users/profile/profiling-consent", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = ProfilingConsentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Expected { profiling_consent: boolean }." });
    }

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    await db.update(usersTable)
      .set({ profiling_consent: parsed.data.profiling_consent })
      .where(eq(usersTable.id, userId));

    return res.json({ profiling_consent: parsed.data.profiling_consent });
  } catch (err) {
    req.log.error({ err }, "Failed to update profiling consent");
    return res.status(500).json({ error: "A difficulty arose while saving your profiling preference." });
  }
});

router.delete("/users/profile", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    await db.delete(nobleScoreLogTable).where(eq(nobleScoreLogTable.user_id, userId));
    await db.delete(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    return res.json({ message: "Your profile has been gracefully removed from our records." });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user profile");
    return res.status(500).json({ error: "A difficulty arose while removing your profile." });
  }
});

export default router;
