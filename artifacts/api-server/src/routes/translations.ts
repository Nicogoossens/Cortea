import { Router } from "express";
import { db } from "@workspace/db";
import { translationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/translations", async (req, res) => {
  try {
    const { language_code } = req.query;

    if (!language_code) {
      return res.status(400).json({ message: "A language code is required to retrieve translations." });
    }

    const rows = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.language_code, language_code as string));

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
