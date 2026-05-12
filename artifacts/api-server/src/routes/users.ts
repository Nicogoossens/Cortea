import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, compassHistoryTable, nobleScoreLogTable, zuil_voortgangTable, userCountryInterestsTable, companionLinksTable, invitationsTable, roleplayCompletionsTable, roleplayReflectionsTable, learningTrackProgressTable, interestCatalogTable, DEFAULT_BEHAVIOR_PROFILE, type BehaviorProfile, type PrivacySettings, type RegisterBiasSignal } from "@workspace/db";
import { eq, and, or, ne, desc, gte, isNull, sql } from "drizzle-orm";
import { inferRegisterBias, type PureRegisterBiasSignal } from "../lib/learning-engine-pure";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import { getFounderCodeForEmail } from "./waitlist";

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
    const authUserId = getResolvedUserId(req);
    // Optional ?user_id= for public-view mode (viewing another user's profile).
    const queriedUserId = typeof req.query.user_id === "string" && req.query.user_id.length > 0
      ? req.query.user_id
      : null;
    const isPublicView = queriedUserId !== null && queriedUserId !== authUserId;
    const targetUserId = isPublicView ? queriedUserId : authUserId;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: "Profile not found." });
    }

    // Public view — return only the fields needed for the profile page
    // privacy placeholder (elite_privacy_mode, noble_score, display_name).
    // Sensitive fields (email, behavior_profile, signals) are never exposed.
    // When elite_privacy_mode=true, noble_score and badges are omitted from
    // public responses so they are never visible to other users.
    if (isPublicView) {
      const privacyOn = user.elite_privacy_mode ?? false;
      return res.json({
        id: user.id,
        display_name: user.display_name,
        elite_privacy_mode: privacyOn,
        ...(privacyOn ? {} : { noble_score: user.noble_score }),
        age_group: computeAgeGroup(user.birth_year, privacyOn ? undefined : user.noble_score),
        privacy_settings: user.privacy_settings ?? null,
      });
    }

    const { session_token: _st, verification_token: _vt, password_hash: _ph, ...safeUser } = user;

    // Surface unredeemed Founding 100 status so the membership UI can show
    // a "Founding member — 1 month free at checkout" notice for matched users.
    const founderCode = await getFounderCodeForEmail(user.email);

    return res.json({
      ...safeUser,
      age_group: computeAgeGroup(user.birth_year, user.noble_score),
      gender: user.gender_identity ?? null,
      privacy_settings: user.privacy_settings ?? null,
      is_founding_member: !!founderCode,
      founder_code: founderCode,
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
      const { session_token: _st, verification_token: _vt, password_hash: _ph, ...safeUser } = updated;
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
  explicit_language_choice: z.boolean().optional(),
  active_region: z.string().regex(/^[A-Z]{2,3}$/).optional(),
  country_of_origin: z.string().max(100).optional().nullable(),
  objectives: z.array(z.enum(["business", "elite", "romantic", "world_traveller"])).optional(),
  interests_sports: z.array(z.string()).optional(),
  interests_cuisine: z.array(z.string()).optional(),
  interests_dress_code: z.array(z.string()).optional(),
  social_circles: z.array(z.string()).optional(),
  cultural_interests: z.array(z.string()).optional(),
  onboarding_completed: z.boolean().optional(),
  username: z.string().max(50).optional().nullable(),
  full_name: z.string().max(150).optional().nullable(),
  avatar_url: z.string().max(2000000).optional().nullable(),
  situational_interests: z.array(z.enum([
    "business", "gastronomy", "arts_culture",
    "music_entertainment", "formal_events", "lifestyle_wellness", "travel_hospitality",
  ])).optional(),
  calling_card_tagline: z.string().max(100).optional().nullable(),
  interests_extended: z.record(z.string(), z.array(z.string())).optional(),
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
        ...(data.explicit_language_choice !== undefined && { explicit_language_choice: data.explicit_language_choice }),
        ...(data.active_region !== undefined && { active_region: data.active_region }),
        ...originUpdate,
        ...(data.username !== undefined && { username: data.username }),
        ...(data.full_name !== undefined && { full_name: data.full_name }),
        ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
        ...(data.objectives !== undefined && { objectives: data.objectives }),
        ...(data.interests_sports !== undefined && { interests_sports: data.interests_sports }),
        ...(data.interests_cuisine !== undefined && { interests_cuisine: data.interests_cuisine }),
        ...(data.interests_dress_code !== undefined && { interests_dress_code: data.interests_dress_code }),
        ...(data.social_circles !== undefined && { social_circles: data.social_circles }),
        ...(data.cultural_interests !== undefined && { cultural_interests: data.cultural_interests }),
        ...(data.onboarding_completed !== undefined && { onboarding_completed: data.onboarding_completed }),
        ...(data.situational_interests !== undefined && { situational_interests: data.situational_interests }),
        ...(data.calling_card_tagline !== undefined && { calling_card_tagline: data.calling_card_tagline }),
        ...(data.interests_extended !== undefined && { interests_extended: data.interests_extended }),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const { session_token: _st, verification_token: _vt, password_hash: _ph, ...safeUser } = updated;
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

    // Setting a region as your active focus is itself an explicit signal of
    // interest — auto-add (or un-hide) the region in the user's interests so
    // subsequent visits show it in their tracked-countries list. Previously
    // the API rejected unknown regions with 403, but that produced confusing
    // "Could not save" errors when picking a country from Course Settings.
    await db.insert(userCountryInterestsTable).values({
      user_id: userId,
      region_code: incomingRegion,
      hidden_at: null,
    }).onConflictDoUpdate({
      target: [userCountryInterestsTable.user_id, userCountryInterestsTable.region_code],
      set: { hidden_at: null },
    });

    const newHistory = Array.from(new Set([...existing.region_history, incomingRegion]));

    const [updated] = await db.update(usersTable)
      .set({
        active_region: incomingRegion,
        region_history: newHistory,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const { session_token: _st, verification_token: _vt, password_hash: _ph, ...safeUser } = updated;
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
  rememberPreferences: z.boolean().optional().default(false),
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

    // GDPR Art. 17 — Right to Erasure. Tables with ON DELETE CASCADE FK to
    // users.id (user_badges, learning_track_progress, learning_track_attempts,
    // user_country_interests) are removed automatically when the users row is
    // deleted below. The remaining tables either store the user reference as
    // a plain TEXT column without an FK constraint, or reference the user via
    // multiple columns (sender/recipient, inviter/invitee, author/target),
    // so we delete them explicitly here.
    await db.delete(nobleScoreLogTable).where(eq(nobleScoreLogTable.user_id, userId));
    await db.delete(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));
    await db.delete(roleplayCompletionsTable).where(eq(roleplayCompletionsTable.user_id, userId));
    await db.delete(roleplayReflectionsTable).where(
      or(
        eq(roleplayReflectionsTable.author_id, userId),
        eq(roleplayReflectionsTable.target_user_id, userId),
      ),
    );
    await db.delete(companionLinksTable).where(
      or(
        eq(companionLinksTable.user_a_id, userId),
        eq(companionLinksTable.user_b_id, userId),
      ),
    );
    await db.delete(invitationsTable).where(
      or(
        eq(invitationsTable.inviter_id, userId),
        eq(invitationsTable.invitee_id, userId),
      ),
    );
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    return res.json({ message: "Your profile has been gracefully removed from our records." });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user profile");
    return res.status(500).json({ error: "A difficulty arose while removing your profile." });
  }
});

// ─── GET /api/catalog/interests — interest_catalog query ─────────────────────
router.get("/catalog/interests", async (req: Request, res: Response) => {
  try {
    const taxonomy = typeof req.query.taxonomy === "string" ? req.query.taxonomy : null;
    const register = typeof req.query.register === "string" ? req.query.register : null;

    let rows = await db
      .select({
        slug:           interestCatalogTable.slug,
        taxonomy:       interestCatalogTable.taxonomy,
        label_i18n_key: interestCatalogTable.label_i18n_key,
        registers:      interestCatalogTable.registers,
        display_order:  interestCatalogTable.display_order,
      })
      .from(interestCatalogTable)
      .orderBy(interestCatalogTable.display_order);

    if (taxonomy) rows = rows.filter((r) => r.taxonomy === taxonomy);
    if (register) rows = rows.filter((r) => (r.registers as string[]).includes(register));

    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to query interest catalog");
    return res.status(500).json({ error: "Could not retrieve catalog entries." });
  }
});

// ─── Master Framework v1.1 §11.5 — Onboarding extended fields ───────────────

const OnboardingBodySchema = z.object({
  country_of_origin:    z.string().max(5).optional().nullable(),
  objectives:           z.array(z.string().max(50)).optional(),
  situational_interests: z.array(z.string().max(100)).optional(),
  world_choice:         z.enum(["A", "B", "C"]).optional(),
  archetype:            z.string().max(50).optional().nullable(),
  secondary_archetype:  z.string().max(50).optional().nullable(),
  social_circles:       z.array(z.string().max(100)).min(1).max(4).optional(),
  cultural_interests:   z.array(z.string().max(100)).min(1).max(4).optional(),
  selected_interests:   z.array(z.string().max(200)).min(1).max(4).optional(),
  interests_sports:     z.array(z.string()).optional(),
  interests_cuisine:    z.array(z.string()).optional(),
  interests_dress_code: z.array(z.string()).optional(),
  interests_extended:   z.record(z.string(), z.array(z.string())).optional(),
  learning_intent:      z.record(z.string(), z.enum(["surface", "competent", "mastery"])).optional(),
  onboarding_completed: z.boolean().optional(),
});

/**
 * PUT /api/users/me/onboarding
 *
 * Dedicated endpoint for the 10-step onboarding extended fields.
 * Called incrementally after each new step (4-10) — the client submits only
 * the fields that were updated in that step.
 *
 * Register-bias resolution:
 *  - Step 4 (world_choice): adds a ±30 signal and immediately computes bias.
 *  - Step 8 (selected_interests): re-runs inferRegisterBias on the full
 *    accumulated signal stack to produce the authoritative final result.
 *
 * Learning intent:
 *  - Step 9: upserts learning_track_progress rows for each pillar supplied,
 *    using the user's current active_region and register = "middle_class".
 *
 * Onboarding-completed gate:
 *  - Only sets onboarding_completed = true once (never reverts existing users).
 */
router.put("/users/me/onboarding", requireAuthUser, async (req: Request, res: Response) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = OnboardingBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "The information provided does not meet the required form." });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = {};

    // ── Step 1: country_of_origin — honour the same permanent-lock semantics ──
    // as /api/users/profile so the onboarding route cannot bypass immutability.
    if (data.country_of_origin !== undefined) {
      const incoming = (data.country_of_origin ?? "").trim() || null;
      if (existing.country_of_origin_locked_at) {
        if (incoming && incoming !== existing.country_of_origin) {
          return res.status(403).json({
            code: "ORIGIN_LOCKED",
            error: "Your country of origin is permanent. Please contact support if a correction is required.",
          });
        }
        // No-op: field already locked — skip writing
      } else if (incoming) {
        updates.country_of_origin = incoming;
        updates.country_of_origin_locked_at = new Date();
      } else {
        updates.country_of_origin = null;
      }
    }
    // ── Steps 2–3 ─────────────────────────────────────────────────────────────
    if (data.objectives !== undefined)           updates.objectives           = data.objectives;
    if (data.situational_interests !== undefined) updates.situational_interests = data.situational_interests;

    // ── Step 4: World choice → register_bias signal ──────────────────────────
    if (data.world_choice !== undefined) {
      const WORLD_SIGNAL_MAP = {
        A: { signal: "onboarding_world_choice_A", weight: -30 },
        B: { signal: "onboarding_world_choice_B", weight: +30 },
        C: { signal: "onboarding_world_choice_C", weight:   0 },
      } as const;
      const mapping = WORLD_SIGNAL_MAP[data.world_choice];
      const newSignal: RegisterBiasSignal = {
        signal:      mapping.signal,
        weight:      mapping.weight,
        recorded_at: new Date().toISOString(),
      };
      // Replace any previous onboarding_world_choice signal (idempotent).
      const existing_signals: RegisterBiasSignal[] = Array.isArray(existing.register_bias_signals)
        ? (existing.register_bias_signals as RegisterBiasSignal[])
        : [];
      const pruned = existing_signals.filter((s) => !s.signal.startsWith("onboarding_world_choice_"));
      const allSignals: PureRegisterBiasSignal[] = [...pruned, newSignal];

      updates.register_bias_signals = allSignals;
      updates.register_bias        = inferRegisterBias(allSignals);
      updates.elite_privacy_mode   = data.world_choice === "B" ? true : existing.elite_privacy_mode;
    }

    // ── Step 5: Archetype ────────────────────────────────────────────────────
    if (data.archetype !== undefined)           updates.archetype           = data.archetype;
    if (data.secondary_archetype !== undefined)  updates.secondary_archetype = data.secondary_archetype;

    // ── Interest weight maps for signal construction ─────────────────────────
    const CIRCLE_WEIGHTS: Record<string, number> = {
      old_money: 20, diplomatic_corps: 20, landed_gentry: 15, yacht_set: 20,
      hunting_set: 10, arts_patronage: 10, fashion_world: 10, haute_cuisine: 5,
      philanthropy: 5, corporate_executive: 5, academia: 0, religious_leadership: 0,
    };
    const CULTURE_WEIGHTS: Record<string, number> = {
      horology: 20, wine_culture: 15, antiquities: 15, fine_art: 10, opera: 10,
      interior_design: 10, gastronomy: 10, classical_music: 5, ballet: 5,
      architecture: 5, heritage_travel: 5, literature: 0,
    };
    const SPORTS_WEIGHTS: Record<string, number> = {
      polo: 25, horse_riding: 20, sailing: 20, hunting: 20, fencing: 15,
      rowing: 10, golf: 10, tennis: 5, squash: 5,
    };

    function avgWeight(ids: string[], map: Record<string, number>): number {
      if (ids.length === 0) return 0;
      return Math.round(ids.reduce((s, id) => s + (map[id] ?? 0), 0) / ids.length);
    }

    // ── Step 6: Social circles ───────────────────────────────────────────────
    if (data.social_circles !== undefined) {
      updates.social_circles = data.social_circles;
      const w = avgWeight(data.social_circles, CIRCLE_WEIGHTS);
      const currentSignals: PureRegisterBiasSignal[] = Array.isArray(updates.register_bias_signals)
        ? (updates.register_bias_signals as PureRegisterBiasSignal[])
        : Array.isArray(existing.register_bias_signals)
          ? (existing.register_bias_signals as PureRegisterBiasSignal[])
          : [];
      const pruned = currentSignals.filter((s) => s.signal !== "onboarding_social_circles");
      const merged: PureRegisterBiasSignal[] = [...pruned, { signal: "onboarding_social_circles", weight: w, recorded_at: new Date().toISOString() }];
      updates.register_bias_signals = merged;
      updates.register_bias = inferRegisterBias(merged);
    }

    // ── Step 7: Cultural interests ───────────────────────────────────────────
    if (data.cultural_interests !== undefined) {
      updates.cultural_interests = data.cultural_interests;
      const w = avgWeight(data.cultural_interests, CULTURE_WEIGHTS);
      const currentSignals: PureRegisterBiasSignal[] = Array.isArray(updates.register_bias_signals)
        ? (updates.register_bias_signals as PureRegisterBiasSignal[])
        : Array.isArray(existing.register_bias_signals)
          ? (existing.register_bias_signals as PureRegisterBiasSignal[])
          : [];
      const pruned = currentSignals.filter((s) => s.signal !== "onboarding_cultural_interests");
      const merged: PureRegisterBiasSignal[] = [...pruned, { signal: "onboarding_cultural_interests", weight: w, recorded_at: new Date().toISOString() }];
      updates.register_bias_signals = merged;
      updates.register_bias = inferRegisterBias(merged);
    }

    // ── Step 8: Sports / gastronomy / dresscode + selected_interests ─────────
    if (data.selected_interests !== undefined)  updates.selected_interests  = data.selected_interests;
    if (data.interests_sports !== undefined)     updates.interests_sports     = data.interests_sports;
    if (data.interests_cuisine !== undefined)    updates.interests_cuisine    = data.interests_cuisine;
    if (data.interests_dress_code !== undefined) updates.interests_dress_code = data.interests_dress_code;
    if (data.interests_extended !== undefined) {
      const existingExt = (existing.interests_extended ?? {}) as Record<string, string[]>;
      updates.interests_extended = { ...existingExt, ...data.interests_extended };
    }

    // After step 8: add sports signal then re-run inferRegisterBias on all accumulated signals.
    if (data.selected_interests !== undefined) {
      const sportsIds = data.interests_sports ?? [];
      const w = avgWeight(sportsIds, SPORTS_WEIGHTS);
      const currentSignals: PureRegisterBiasSignal[] = Array.isArray(updates.register_bias_signals)
        ? (updates.register_bias_signals as PureRegisterBiasSignal[])
        : Array.isArray(existing.register_bias_signals)
          ? (existing.register_bias_signals as PureRegisterBiasSignal[])
          : [];
      const pruned = currentSignals.filter((s) => s.signal !== "onboarding_sports");
      const allSignals: PureRegisterBiasSignal[] = [...pruned, { signal: "onboarding_sports", weight: w, recorded_at: new Date().toISOString() }];
      updates.register_bias_signals = allSignals;
      updates.register_bias = inferRegisterBias(allSignals);
    }

    // ── onboarding_completed — only set to true, never revert ────────────────
    if (data.onboarding_completed === true && !existing.onboarding_completed) {
      const resolvedCountry = data.country_of_origin !== undefined
        ? data.country_of_origin
        : existing.country_of_origin;
      if (!resolvedCountry) {
        return res.status(400).json({ error: "Country of origin is required to complete onboarding." });
      }
      const resolvedObjectives = data.objectives !== undefined ? data.objectives : existing.objectives;
      const resolvedSituational = data.situational_interests !== undefined ? data.situational_interests : existing.situational_interests;
      if (!resolvedObjectives || resolvedObjectives.length === 0) {
        return res.status(400).json({ error: "Objectives (step 2) are required to complete onboarding." });
      }
      if (!resolvedSituational || resolvedSituational.length === 0) {
        return res.status(400).json({ error: "Situational interests (step 3) are required to complete onboarding." });
      }
      const existingSignals: RegisterBiasSignal[] = Array.isArray(existing.register_bias_signals)
        ? (existing.register_bias_signals as RegisterBiasSignal[]) : [];
      const incomingSignals: RegisterBiasSignal[] = Array.isArray(updates.register_bias_signals)
        ? (updates.register_bias_signals as RegisterBiasSignal[]) : existingSignals;
      const hasWorldSignal = incomingSignals.some((s) => s.signal.startsWith("onboarding_world_choice_"));
      if (!hasWorldSignal) {
        return res.status(400).json({ error: "World choice (step 4) is required to complete onboarding." });
      }
      // world_choice is not a DB column — infer it from the bias signals already resolved above.
      const worldSignal = incomingSignals.find((s) => s.signal.startsWith("onboarding_world_choice_"));
      const resolvedWorldChoice: "A" | "B" | "C" | null =
        data.world_choice !== undefined
          ? data.world_choice
          : worldSignal
            ? (worldSignal.signal.slice(-1) as "A" | "B" | "C")
            : null;
      const resolvedArchetype = data.archetype !== undefined ? data.archetype : existing.archetype;
      if (!resolvedArchetype && resolvedWorldChoice !== "A") {
        return res.status(400).json({ error: "Archetype (step 5) is required to complete onboarding." });
      }
      // ── Steps 6–8: min 1 / max matches UI caps ───────────────────────────────
      const resolvedCircles = (data.social_circles !== undefined ? data.social_circles : existing.social_circles) ?? [];
      const resolvedCulture = (data.cultural_interests !== undefined ? data.cultural_interests : existing.cultural_interests) ?? [];
      const resolvedSelected = (data.selected_interests !== undefined ? data.selected_interests : existing.selected_interests) ?? [];
      if (resolvedCircles.length < 1 || resolvedCircles.length > 4) {
        return res.status(400).json({ error: "Please select 1–4 social circles (step 6) before completing." });
      }
      if (resolvedCulture.length < 1 || resolvedCulture.length > 4) {
        return res.status(400).json({ error: "Please select 1–4 cultural interests (step 7) before completing." });
      }
      if (resolvedSelected.length < 1 || resolvedSelected.length > 9) {
        return res.status(400).json({ error: "Please select at least 1 lifestyle interest (step 8) before completing." });
      }
      updates.onboarding_completed = true;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
    }

    // ── Step 9: Learning intent → upsert learning_track_progress ─────────────
    if (data.learning_intent && Object.keys(data.learning_intent).length > 0) {
      try {
        const regionCode = existing.active_region;
        const resolvedRegister =
          (updates.register_bias as string | undefined)
          ?? (existing.register_bias as string | null)
          ?? "middle_class";
        for (const [pillar, intent] of Object.entries(data.learning_intent)) {
          await db.execute(sql`
            INSERT INTO learning_track_progress
              (user_id, register, region_code, research_pillar, phase, learning_intent)
            VALUES
              (${userId}, ${resolvedRegister}, ${regionCode}, ${pillar}, 1, ${intent})
            ON CONFLICT (user_id, register, region_code, research_pillar, phase)
              WHERE research_pillar IS NOT NULL
            DO UPDATE SET learning_intent = EXCLUDED.learning_intent
          `);
        }
      } catch (intentErr) {
        req.log.warn({ intentErr }, "learning_intent upsert failed — onboarding still saved");
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save onboarding step");
    return res.status(500).json({ error: "Er trad een probleem op bij het opslaan van uw onboarding." });
  }
});

// ─── GET /users/compass-history ──────────────────────────────────────────────
// Returns the last 30 days of Compass snapshots for the authenticated user
// (Master Framework v1.1 §9.4 / §10.3 — 30-day evolution overlay).
router.get("/users/compass-history", requireAuthUser, async (req, res) => {
  try {
    const userId = await getResolvedUserId(req);
    if (!userId) return res.status(401).json({ error: "Niet ingelogd." });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await db
      .select()
      .from(compassHistoryTable)
      .where(and(
        eq(compassHistoryTable.user_id, userId),
        gte(compassHistoryTable.recorded_at, thirtyDaysAgo),
      ))
      .orderBy(compassHistoryTable.recorded_at);

    return res.json(history);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass history");
    return res.status(500).json({ error: "Compass history momentarily unavailable." });
  }
});

// ─── POST /users/register-signal ─────────────────────────────────────────────
// Records a register toggle signal for bias evolution (Master Framework §10.1).
router.post("/users/register-signal", requireAuthUser, async (req, res) => {
  try {
    const userId = await getResolvedUserId(req);
    if (!userId) return res.status(401).json({ error: "Niet ingelogd." });

    const { signal } = z.object({
      signal: z.enum(["middle_class", "elite", "both"]),
    }).parse(req.body);

    const [user] = await db
      .select({ register_bias_signals: usersTable.register_bias_signals, register_bias_locked: usersTable.register_bias_locked })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) return res.status(404).json({ error: "User not found." });
    // Respect locked bias — record the signal but skip re-inference.
    const SIGNAL_WEIGHTS: Record<string, number> = {
      middle_class: -10,
      elite:        +10,
      both:           0,
    };
    const newSignal: RegisterBiasSignal = {
      signal:      `toggle_${signal}` as RegisterBiasSignal["signal"],
      weight:      SIGNAL_WEIGHTS[signal] ?? 0,
      recorded_at: new Date().toISOString(),
    };
    const existing: RegisterBiasSignal[] = Array.isArray(user.register_bias_signals)
      ? (user.register_bias_signals as RegisterBiasSignal[])
      : [];
    // Keep last 50 toggle signals; don't discard onboarding signals.
    const toggleHistory = existing.filter((s) => s.signal.startsWith("toggle_")).slice(-49);
    const nonToggle     = existing.filter((s) => !s.signal.startsWith("toggle_"));
    const merged        = [...nonToggle, ...toggleHistory, newSignal];
    const newBias       = user.register_bias_locked
      ? undefined
      : inferRegisterBias(merged as PureRegisterBiasSignal[]);

    await db.update(usersTable)
      .set({
        register_bias_signals: merged,
        ...(newBias !== undefined ? { register_bias: newBias } : {}),
      })
      .where(eq(usersTable.id, userId));

    return res.json({ ok: true, register_bias: newBias ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to record register signal");
    return res.status(500).json({ error: "Signal recording temporarily unavailable." });
  }
});

// ─── GET /users/register-bias-signals ────────────────────────────────────────
// Returns the full audit log of register signals for the authenticated user.
router.get("/users/register-bias-signals", requireAuthUser, async (req, res) => {
  try {
    const userId = await getResolvedUserId(req);
    if (!userId) return res.status(401).json({ error: "Niet ingelogd." });

    const [user] = await db
      .select({ register_bias_signals: usersTable.register_bias_signals })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    return res.json(user?.register_bias_signals ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch register bias signals");
    return res.status(500).json({ error: "Register signals temporarily unavailable." });
  }
});

// ─── POST /users/register-bias ────────────────────────────────────────────────
// Manually sets the user's register_bias (with optional lock).
// Called by Profile "Toon beide werelden gelijkmatig" action (§10.2).
router.post("/users/register-bias", requireAuthUser, async (req, res) => {
  try {
    const userId = await getResolvedUserId(req);
    if (!userId) return res.status(401).json({ error: "Niet ingelogd." });

    const { bias, locked } = z.object({
      bias:   z.enum(["middle_class", "elite", "balanced"]),
      locked: z.boolean().optional(),
    }).parse(req.body);

    const updates: Record<string, unknown> = { register_bias: bias };
    if (locked !== undefined) updates.register_bias_locked = locked;

    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));

    return res.json({ ok: true, register_bias: bias });
  } catch (err) {
    req.log.error({ err }, "Failed to set register bias");
    return res.status(500).json({ error: "Register bias update temporarily unavailable." });
  }
});

// ─── POST /users/register-bias/recompute ─────────────────────────────────────
// Re-infers register_bias from accumulated signals and unlocks it.
// Called by Profile "Aanbevelingen herijken" action (§10.2).
router.post("/users/register-bias/recompute", requireAuthUser, async (req, res) => {
  try {
    const userId = await getResolvedUserId(req);
    if (!userId) return res.status(401).json({ error: "Niet ingelogd." });

    const [user] = await db
      .select({ register_bias_signals: usersTable.register_bias_signals })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    const signals = (user?.register_bias_signals ?? []) as PureRegisterBiasSignal[];
    const newBias = inferRegisterBias(signals);

    await db.update(usersTable)
      .set({ register_bias: newBias, register_bias_locked: false })
      .where(eq(usersTable.id, userId));

    return res.json({ ok: true, register_bias: newBias });
  } catch (err) {
    req.log.error({ err }, "Failed to recompute register bias");
    return res.status(500).json({ error: "Register bias recompute temporarily unavailable." });
  }
});

export default router;
