import { Router } from "express";
import { db } from "@workspace/db";
import { useCasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { calibrateTranslationsByIds, calibrateI18nMap, upsertContentTranslationRows, type CalibrationModule } from "../../lib/register-calibration.js";
import { requireAdmin } from "./require-admin.js";

const router = Router();

// ── Register Calibration ──────────────────────────────────────────────────────

const CalibrateRequestSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(50),
  module: z.enum(["standard", "elite"]),
  dry_run: z.boolean().optional(),
  force: z.boolean().optional(),
});

const TranslationRowSchema = z.object({
  language_code: z.string().min(2).max(8),
  key: z.string().min(1).max(255),
  value: z.string().min(1),
  formality_register: z.string().optional(),
  rtl_flag: z.boolean().optional(),
  region_link: z.string().nullable().optional(),
});

const TranslationsUpsertSchema = z.object({
  rows: z.array(TranslationRowSchema).min(1).max(200),
  module: z.enum(["standard", "elite"]).optional(),
  dry_run: z.boolean().optional(),
  force: z.boolean().optional(),
});

router.post("/admin/translations/upsert", requireAdmin, async (req, res) => {
  const parsed = TranslationsUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid upsert request.",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { rows, module, dry_run, force } = parsed.data;

  try {
    const result = await upsertContentTranslationRows(rows, {
      module: module as CalibrationModule | undefined,
      dryRun: dry_run,
      force,
    });
    return res.json(result);
  } catch (err) {
    req.log?.error({ err }, "Translations upsert failed");
    return res.status(500).json({ error: "Translation upsert failed." });
  }
});

router.post("/admin/translations/calibrate", requireAdmin, async (req, res) => {
  const parsed = CalibrateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid calibration request.",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { ids, module, dry_run, force } = parsed.data;

  try {
    const summary = await calibrateTranslationsByIds(ids, module as CalibrationModule, {
      dryRun: dry_run,
      force,
    });
    return res.json(summary);
  } catch (err) {
    req.log?.error({ err }, "Register calibration failed");
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("AI_INTEGRATIONS_ANTHROPIC")) {
      return res.status(503).json({ error: "Calibration service is not configured." });
    }
    return res.status(500).json({ error: "Register calibration failed." });
  }
});

// ── Use Cases CRUD ────────────────────────────────────────────────────────────

const UseCaseCreateSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9_-]+$/, "slug must be lowercase alphanumeric with hyphens/underscores"),
  title: z.string().min(1).max(255),
  region_code: z.string().min(1).max(20),
  flag_emoji: z.string().min(1).max(10).optional().default("🌍"),
  formality_level: z.string().min(1).max(60),
  domain_tags: z.array(z.string()).optional().default([]),
  pillar_weights: z.record(z.string(), z.number().min(0).max(10)).optional().default({}),
  description: z.string().optional().default(""),
  cover_context: z.string().optional().default(""),
  primary_tool: z.string().min(1).max(60).optional().default("atelier"),
});

const UseCasePatchSchema = UseCaseCreateSchema.partial();

/** GET /admin/use-cases — list all use cases */
router.get("/admin/use-cases", requireAdmin, async (req, res) => {
  try {
    const rows = await db.select().from(useCasesTable).orderBy(useCasesTable.id);
    return res.json(rows);
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to list use cases");
    return res.status(500).json({ error: "Could not retrieve use cases." });
  }
});

/** POST /admin/use-cases — create a new use case */
router.post("/admin/use-cases", requireAdmin, async (req, res) => {
  try {
    const parsed = UseCaseCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed.", issues: parsed.error.issues });
    }
    const data = parsed.data;

    const [existing] = await db
      .select({ id: useCasesTable.id })
      .from(useCasesTable)
      .where(eq(useCasesTable.slug, data.slug))
      .limit(1);
    if (existing) {
      return res.status(409).json({ error: `A use case with slug "${data.slug}" already exists.` });
    }

    const [created] = await db
      .insert(useCasesTable)
      .values({
        slug: data.slug,
        title: data.title,
        region_code: data.region_code,
        flag_emoji: data.flag_emoji,
        formality_level: data.formality_level,
        domain_tags: data.domain_tags,
        pillar_weights: data.pillar_weights,
        description: data.description,
        cover_context: data.cover_context,
        primary_tool: data.primary_tool,
      })
      .returning();

    return res.status(201).json(created);
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to create use case");
    return res.status(500).json({ error: "Could not create use case." });
  }
});

/** PATCH /admin/use-cases/:id — update a use case */
router.patch("/admin/use-cases/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid use case ID." });

    const parsed = UseCasePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed.", issues: parsed.error.issues });
    }
    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No fields provided to update." });
    }

    const [existing] = await db
      .select({ id: useCasesTable.id })
      .from(useCasesTable)
      .where(eq(useCasesTable.id, id))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Use case not found." });

    if (data.slug) {
      const [slugConflict] = await db
        .select({ id: useCasesTable.id })
        .from(useCasesTable)
        .where(eq(useCasesTable.slug, data.slug))
        .limit(1);
      if (slugConflict && slugConflict.id !== id) {
        return res.status(409).json({ error: `A use case with slug "${data.slug}" already exists.` });
      }
    }

    const [updated] = await db
      .update(useCasesTable)
      .set(data)
      .where(eq(useCasesTable.id, id))
      .returning();

    return res.json(updated);
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to update use case");
    return res.status(500).json({ error: "Could not update use case." });
  }
});

/** DELETE /admin/use-cases/:id — delete a use case */
router.delete("/admin/use-cases/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid use case ID." });

    const [existing] = await db
      .select({ id: useCasesTable.id })
      .from(useCasesTable)
      .where(eq(useCasesTable.id, id))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Use case not found." });

    await db.delete(useCasesTable).where(eq(useCasesTable.id, id));

    return res.json({ ok: true, message: "Use case deleted." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete use case");
    return res.status(500).json({ error: "Could not delete use case." });
  }
});

export default router;
