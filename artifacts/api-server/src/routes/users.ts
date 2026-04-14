import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const DEFAULT_USER_ID = "default-user";

router.get("/users/profile", async (req, res) => {
  try {
    const userId = (req.query.user_id as string) || DEFAULT_USER_ID;
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
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, data.id)).limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(usersTable)
        .set({
          birth_year: data.birth_year ?? existing[0].birth_year,
          gender_identity: data.gender_identity ?? existing[0].gender_identity,
          ambition_level: data.ambition_level ?? existing[0].ambition_level,
          language_code: data.language_code ?? existing[0].language_code,
          active_region: data.active_region ?? existing[0].active_region,
        })
        .where(eq(usersTable.id, data.id))
        .returning();
      return res.json(updated);
    }

    const [newUser] = await db.insert(usersTable).values({
      id: data.id,
      birth_year: data.birth_year ?? null,
      gender_identity: data.gender_identity ?? null,
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

const UpdateRegionBodySchema = z.object({
  region_code: z.string().min(1),
});

router.patch("/users/profile/region", async (req, res) => {
  try {
    const parsed = UpdateRegionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "The region code provided is not recognised. Please verify and resubmit." });
    }

    const userId = (req.query.user_id as string) || DEFAULT_USER_ID;
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!existing) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    const newHistory = Array.from(new Set([...existing.region_history, parsed.data.region_code]));

    const [updated] = await db.update(usersTable)
      .set({
        active_region: parsed.data.region_code,
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

export default router;
