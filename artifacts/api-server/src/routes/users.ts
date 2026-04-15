import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, nobleScoreLogTable, zuil_voortgangTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";

const router = Router();

/**
 * Middleware: resolves the user from an `Authorization: Bearer <session_token>` header.
 * Always requires a valid token — no fallback to any default identity.
 * Sets `req.resolvedUserId` on success.
 */
async function requireAuthUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token provided is not recognised." });
      return;
    }
    (req as Request & { resolvedUserId: string }).resolvedUserId = user.id;
    next();
  } catch (err) {
    res.status(500).json({ error: "A difficulty arose validating your session." });
  }
}

function getResolvedUserId(req: Request): string {
  return (req as Request & { resolvedUserId?: string }).resolvedUserId!;
}

/** Compute a broad age group from birth year for etiquette calibration. */
function computeAgeGroup(birthYear: number | null | undefined): string {
  if (!birthYear) return "unknown";
  const age = new Date().getFullYear() - birthYear;
  if (age < 25) return "young_professional";
  if (age < 40) return "mid_career";
  if (age < 60) return "senior";
  return "elder";
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
      age_group: computeAgeGroup(user.birth_year),
      gender: user.gender_identity ?? null,
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
  language_code: z.string().optional(),
  active_region: z.string().optional(),
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
  language_code: z.string().optional(),
  active_region: z.string().optional(),
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
});

router.put("/users/profile", requireAuthUser, async (req, res) => {
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
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json({ ...safeUser, age_group: computeAgeGroup(updated.birth_year), gender: updated.gender_identity ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to update user profile");
    return res.status(500).json({ message: "A difficulty arose while updating your profile." });
  }
});

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
