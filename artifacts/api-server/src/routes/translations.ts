import { Router } from "express";
import { db } from "@workspace/db";
import { translationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const TranslationsQuerySchema = z.object({
  language_code: z.string().min(1).max(10),
});

router.get("/translations", async (req, res) => {
  try {
    const parsed = TranslationsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "A language code is required to retrieve translations." });
    }

    const rows = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.language_code, parsed.data.language_code));

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch translations");
    return res.status(500).json({ message: "Translations are momentarily unavailable." });
  }
});

export default router;
