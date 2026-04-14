import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, nobleScoreLogTable, zuil_voortgangTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const DEFAULT_USER_ID = "default-user";

const UserIdQuerySchema = z.object({
  user_id: z.string().min(1).default(DEFAULT_USER_ID),
});

router.get("/users/profile", async (req, res) => {
  try {
    const parsed = UserIdQuerySchema.safeParse(req.query);
    const userId = parsed.success ? parsed.data.user_id : DEFAULT_USER_ID;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({ message: "Your profile has not yet been established. Allow us to create one for you." });
    }

    return res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user profile");
    return res.status(500).json({ message: "We encountered a difficulty retrieving your profile. Please allow a moment and try again." });
  }
});

const CreateProfileBodySchema = z.object({
  id: z.string().min(1),
  birth_year: z.number().int().min(1900).max(2010).optional().nullable(),
  gender_identity: z.string().optional().nullable(),
  gender_expression: z.string().optional().nullable(),
  ambition_level: z.enum(["casual", "professional", "diplomatic"]).optional(),
  language_code: z.string().optional(),
  active_region: z.string().optional(),
});

router.post("/users/profile", async (req, res) => {
  try {
    const parsed = CreateProfileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "The information provided does not meet the required form. Please review and resubmit." });
    }

    const data = parsed.data;
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, data.id)).limit(1);

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
        .where(eq(usersTable.id, data.id))
        .returning();
      return res.json(updated);
    }

    const [newUser] = await db.insert(usersTable).values({
      id: data.id,
      birth_year: data.birth_year ?? null,
      gender_identity: data.gender_identity ?? null,
      gender_expression: data.gender_expression ?? null,
      ambition_level: data.ambition_level ?? "casual",
      language_code: data.language_code ?? "en",
      active_region: data.active_region ?? "GB",
      region_history: [],
      noble_score: 0,
      subscription_tier: "guest",
    }).returning();

    return res.json(newUser);
  } catch (err) {
    req.log.error({ err }, "Failed to create/update user profile");
    return res.status(500).json({ message: "A difficulty arose while establishing your profile. Please try again." });
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
});

router.put("/users/profile", async (req, res) => {
  try {
    const queryParsed = UserIdQuerySchema.safeParse(req.query);
    const userId = queryParsed.success ? queryParsed.data.user_id : DEFAULT_USER_ID;

    const bodyParsed = UpdateProfileBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ message: "The information provided does not meet the required form. Please review and resubmit." });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    const data = bodyParsed.data;
    const [updated] = await db.update(usersTable)
      .set({
        ...(data.birth_year !== undefined && { birth_year: data.birth_year }),
        ...(data.gender_identity !== undefined && { gender_identity: data.gender_identity }),
        ...(data.gender_expression !== undefined && { gender_expression: data.gender_expression }),
        ...(data.ambition_level !== undefined && { ambition_level: data.ambition_level }),
        ...(data.language_code !== undefined && { language_code: data.language_code }),
        ...(data.active_region !== undefined && { active_region: data.active_region }),
        ...(data.subscription_tier !== undefined && { subscription_tier: data.subscription_tier }),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update user profile");
    return res.status(500).json({ message: "A difficulty arose while updating your profile. Please try again." });
  }
});

const UpdateRegionBodySchema = z.object({
  region_code: z.string().min(1),
});

router.patch("/users/profile/region", async (req, res) => {
  try {
    const queryParsed = UserIdQuerySchema.safeParse(req.query);
    const userId = queryParsed.success ? queryParsed.data.user_id : DEFAULT_USER_ID;

    const bodyParsed = UpdateRegionBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ message: "The region code provided is not recognised. Please verify and resubmit." });
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

    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update region");
    return res.status(500).json({ message: "The region update encountered a difficulty. Please try again." });
  }
});

router.delete("/users/profile", async (req, res) => {
  try {
    const queryParsed = UserIdQuerySchema.safeParse(req.query);
    const userId = queryParsed.success ? queryParsed.data.user_id : DEFAULT_USER_ID;

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
    return res.status(500).json({ message: "A difficulty arose while removing your profile. Please try again." });
  }
});

export default router;
