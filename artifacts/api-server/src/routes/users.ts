import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, nobleScoreLogTable, zuil_voortgangTable, DEFAULT_BEHAVIOR_PROFILE, type BehaviorProfile, type PrivacySettings } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
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
      return res.status(404).json({ message: "Your profile has not yet been established." });
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
    return res.status(500).json({ message: "We encountered a difficulty retrieving your profile." });
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
      return res.status(400).json({ message: "The information provided does not meet the required form." });
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

    return res.status(404).json({ message: "No account exists for this session. Please register first." });
  } catch (err) {
    req.log.error({ err }, "Failed to create/update user profile");
    return res.status(500).json({ message: "A difficulty arose while establishing your profile." });
  }
});

const UpdateProfileBodySchema = z.object({
  birth_year: z.number().int().min(1900).max(2010).optional().nullable(),
  gender_identity: z.string().optional().nullable(),
  gender_expression: z.string().optional().nullable(),
  ambition_level: z.enum(["casual", "professional", "diplomatic"]).optional(),
  language_code: z.string().regex(/^[a-z]{2,3}$/).optional(),
  active_region: z.string().regex(/^[A-Z]{2,3}$/).optional(),
  subscription_tier: z.enum(["guest", "traveller", "ambassador"]).optional(),
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
      return res.status(400).json({ message: "The information provided does not meet the required form." });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    const data = bodyParsed.data;

    if (data.username) {
      const [taken] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(eq(usersTable.username, data.username), ne(usersTable.id, userId))).limit(1);
      if (taken) return res.status(409).json({ code: "USERNAME_TAKEN", message: "This username is already claimed by another member." });
    }

    if (data.full_name) {
      const [taken] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(eq(usersTable.full_name, data.full_name), ne(usersTable.id, userId))).limit(1);
      if (taken) return res.status(409).json({ code: "FULL_NAME_TAKEN", message: "This display name is already in use by another member." });
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
        ...(data.country_of_origin !== undefined && { country_of_origin: data.country_of_origin }),
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
    return res.status(500).json({ message: "A difficulty arose while updating your profile." });
  }
}

router.put("/users/profile", requireAuthUser, handleUpdateProfile);
router.patch("/users/profile", requireAuthUser, handleUpdateProfile);

const UpdateRegionBodySchema = z.object({
  region_code: z.string().min(1),
});

router.patch("/users/profile/region", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const bodyParsed = UpdateRegionBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ message: "The region code provided is not recognised." });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    const newHistory = Array.from(new Set([...existing.region_history, bodyParsed.data.region_code]));

    const [updated] = await db.update(usersTable)
      .set({
        active_region: bodyParsed.data.region_code,
        region_history: newHistory,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json({ ...safeUser, age_group: computeAgeGroup(updated.birth_year), gender: updated.gender_identity ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to update region");
    return res.status(500).json({ message: "The region update encountered a difficulty." });
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
    if (!user) return res.status(404).json({ message: "Profile not found." });
    return res.json(user.behavior_profile ?? DEFAULT_BEHAVIOR_PROFILE);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch behavior profile");
    return res.status(500).json({ message: "The behavioral profile is momentarily unavailable." });
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
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    await db.update(usersTable)
      .set({ privacy_settings: null })
      .where(eq(usersTable.id, userId));

    return res.json({ privacy_settings: null });
  } catch (err) {
    req.log.error({ err }, "Failed to reset privacy settings");
    return res.status(500).json({ message: "A difficulty arose while resetting your privacy settings." });
  }
});

router.patch("/users/profile/privacy", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = PrivacySettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "The privacy settings provided are not in the expected form." });
    }

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    await db.update(usersTable)
      .set({ privacy_settings: parsed.data })
      .where(eq(usersTable.id, userId));

    return res.json({ privacy_settings: parsed.data });
  } catch (err) {
    req.log.error({ err }, "Failed to update privacy settings");
    return res.status(500).json({ message: "A difficulty arose while saving your privacy settings." });
  }
});

router.delete("/users/profile", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    await db.delete(nobleScoreLogTable).where(eq(nobleScoreLogTable.user_id, userId));
    await db.delete(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    return res.json({ message: "Your profile has been gracefully removed from our records." });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user profile");
    return res.status(500).json({ message: "A difficulty arose while removing your profile." });
  }
});

export default router;
