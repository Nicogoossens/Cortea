import { Router, type Request, type Response, type NextFunction } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "@workspace/db";
import { usersTable, scenariosTable, cultureProtocolsTable, compassRegionsTable, translationsTable, nobleScoreLogTable, zuil_voortgangTable, type CompassLocaleMap } from "@workspace/db";
import { eq, ilike, or, desc, sql, count } from "drizzle-orm";
import { z } from "zod";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, "../../../../");

const router = Router();

/**
 * Middleware: verifies Bearer token and confirms the user has is_admin=true.
 */
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      .select({ id: usersTable.id, is_admin: usersTable.is_admin })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token is not recognised." });
      return;
    }
    if (!user.is_admin) {
      res.status(403).json({ error: "This section is restricted to administrators." });
      return;
    }
    (req as Request & { resolvedUserId: string }).resolvedUserId = user.id;
    next();
  } catch (err) {
    res.status(500).json({ error: "A difficulty arose validating your session." });
  }
}

const SearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

/** GET /admin/users — list / search users with true pagination */
router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters." });
    }
    const { q, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const whereClause = q
      ? or(ilike(usersTable.email, `%${q}%`), ilike(usersTable.full_name, `%${q}%`))
      : undefined;

    const [totalRow] = await db
      .select({ total: count() })
      .from(usersTable)
      .where(whereClause);

    const rows = await db
      .select({
        id: usersTable.id,
        full_name: usersTable.full_name,
        email: usersTable.email,
        email_verified: usersTable.email_verified,
        subscription_tier: usersTable.subscription_tier,
        subscription_status: usersTable.subscription_status,
        noble_score: usersTable.noble_score,
        is_admin: usersTable.is_admin,
        suspended_at: usersTable.suspended_at,
        created_at: usersTable.created_at,
        language_code: usersTable.language_code,
        country_of_origin: usersTable.country_of_origin,
        objectives: usersTable.objectives,
        onboarding_completed: usersTable.onboarding_completed,
      })
      .from(usersTable)
      .where(whereClause)
      .orderBy(desc(usersTable.created_at))
      .limit(limit)
      .offset(offset);

    const total = totalRow?.total ?? 0;
    return res.json({ users: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    req.log.error({ err }, "Admin: failed to list users");
    return res.status(500).json({ error: "A difficulty arose listing users." });
  }
});

/** GET /admin/users/:id — get full user detail */
router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found." });
    const { session_token: _st, verification_token: _vt, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    req.log.error({ err }, "Admin: failed to get user");
    return res.status(500).json({ error: "A difficulty arose retrieving the user." });
  }
});

const PatchUserBodySchema = z.object({
  email_verified: z.boolean().optional(),
  suspended_at: z.string().nullable().optional(),
  subscription_tier: z.enum(["guest", "traveller", "ambassador"]).optional(),
  subscription_status: z.string().optional(),
  is_admin: z.boolean().optional(),
});

/** PATCH /admin/users/:id — update user status / tier */
router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const parsed = PatchUserBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid data provided.", details: parsed.error.flatten().fieldErrors });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    const data = parsed.data;
    const updatePayload: Record<string, unknown> = {};
    if (data.email_verified !== undefined) updatePayload.email_verified = data.email_verified;
    if (data.suspended_at !== undefined) {
      updatePayload.suspended_at = data.suspended_at ? new Date(data.suspended_at) : null;
    }
    if (data.subscription_tier !== undefined) updatePayload.subscription_tier = data.subscription_tier;
    if (data.subscription_status !== undefined) updatePayload.subscription_status = data.subscription_status;
    if (data.is_admin !== undefined) updatePayload.is_admin = data.is_admin;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No updatable fields were provided." });
    }

    const [updated] = await db
      .update(usersTable)
      .set(updatePayload)
      .where(eq(usersTable.id, id))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (err) {
    req.log.error({ err }, "Admin: failed to patch user");
    return res.status(500).json({ error: "A difficulty arose updating the user." });
  }
});

/** PATCH /admin/users/:id/suspend — suspend a user account */
router.patch("/admin/users/:id/suspend", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    const [updated] = await db
      .update(usersTable)
      .set({ suspended_at: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to suspend user");
    return res.status(500).json({ error: "A difficulty arose suspending the user." });
  }
});

/** PATCH /admin/users/:id/unsuspend — reinstate a suspended user */
router.patch("/admin/users/:id/unsuspend", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    const [updated] = await db
      .update(usersTable)
      .set({ suspended_at: null })
      .where(eq(usersTable.id, id))
      .returning();

    const { session_token: _st, verification_token: _vt, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to unsuspend user");
    return res.status(500).json({ error: "A difficulty arose reinstating the user." });
  }
});

/** DELETE /admin/users/:id — permanently remove a user and all their data */
router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    if (id === requesterId) {
      return res.status(400).json({ error: "An administrator may not delete their own account through this endpoint." });
    }

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "User not found." });

    await db.delete(nobleScoreLogTable).where(eq(nobleScoreLogTable.user_id, id));
    await db.delete(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, id));
    await db.delete(usersTable).where(eq(usersTable.id, id));

    return res.json({ message: "The user's record has been permanently removed." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete user");
    return res.status(500).json({ error: "A difficulty arose deleting the user." });
  }
});

// ── Content Management ────────────────────────────────────────────────────────

/** GET /admin/content/status — row counts + translation coverage per table */
router.get("/admin/content/status", requireAdmin, async (req, res) => {
  try {
    const [scenarios] = await db.select({ total: count() }).from(scenariosTable);
    const [protocols] = await db.select({ total: count() }).from(cultureProtocolsTable);
    const [regions] = await db.select({ total: count() }).from(compassRegionsTable);

    const translationsByLang = await db
      .select({ lang: translationsTable.language_code, total: count() })
      .from(translationsTable)
      .groupBy(translationsTable.language_code);

    // Scenario translation coverage: count how many have title_i18n for each lang
    const allScenarios = await db
      .select({ title_i18n: sql<Record<string, string> | null>`title_i18n` })
      .from(scenariosTable);

    const scenarioLangs = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja"];
    const scenarioTranslationCoverage: Record<string, number> = {};
    for (const lang of scenarioLangs) {
      scenarioTranslationCoverage[lang] = allScenarios.filter(
        (s) => s.title_i18n && s.title_i18n[lang]
      ).length;
    }

    return res.json({
      scenarios: scenarios.total,
      culture_protocols: protocols.total,
      compass_regions: regions.total,
      translations: translationsByLang.reduce((acc, r) => {
        acc[r.lang] = r.total;
        return acc;
      }, {} as Record<string, number>),
      scenario_translation_coverage: scenarioTranslationCoverage,
      total_scenarios: allScenarios.length,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to get content status");
    return res.status(500).json({ error: "A difficulty arose retrieving content status." });
  }
});

/** POST /admin/content/seed — trigger idempotent seed scripts */
router.post("/admin/content/seed", requireAdmin, async (req, res) => {
  try {
    const results: string[] = [];
    let anyFailed = false;

    const run = async (label: string, cmd: string, timeoutMs = 120_000) => {
      try {
        const { stdout, stderr } = await execAsync(cmd, {
          cwd: WORKSPACE_ROOT,
          env: { ...process.env },
          timeout: timeoutMs,
        });
        results.push(`[${label}] OK\n${stdout.trim()}`);
        if (stderr.trim()) results.push(`[${label}] stderr: ${stderr.trim()}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`[${label}] ERROR: ${msg}`);
        anyFailed = true;
      }
    };

    await run("Atelier", "pnpm --filter db seed");
    await run("Compass", "pnpm --filter db seed:compass");
    await run("Translations", "node scripts/seed-translations.mjs");
    await run("Admin", "node scripts/ensure-admin.mjs");
    await run("Scenario Translations", "node scripts/scenario-translate.mjs", 600_000);

    return res.status(anyFailed ? 207 : 200).json({ ok: !anyFailed, results });
  } catch (err) {
    req.log?.error({ err }, "Admin: seed failed");
    return res.status(500).json({ error: "A difficulty arose triggering the seed." });
  }
});

// ── JSON Bulk Import ──────────────────────────────────────────────────────────

const ScenarioImportSchema = z.object({
  title: z.string().min(1),
  pillar: z.number().int().min(1).max(5),
  region_code: z.string().length(2),
  age_group: z.string().default("all"),
  gender_applicability: z.string().default("all"),
  context: z.string().default("social"),
  difficulty_level: z.number().int().min(1).max(5).default(1),
  estimated_minutes: z.number().int().min(1).max(60).default(5),
  noble_score_impact: z.number().int().min(1).max(20).default(5),
  content_json: z.object({
    situation: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.object({
      text: z.string().min(1),
      correct: z.boolean(),
      explanation: z.string().min(1),
    })).min(2).max(6),
  }),
});

const CompassRegionImportSchema = z.object({
  region_code: z.string().length(2),
  flag_emoji: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
});

const BulkImportBodySchema = z.object({
  type: z.enum(["scenarios", "compass_regions"]),
  items: z.array(z.unknown()).min(1).max(500),
});

/** POST /admin/content/import — bulk upsert scenarios or compass regions from JSON */
router.post("/admin/content/import", requireAdmin, async (req, res) => {
  try {
    const parsed = BulkImportBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid import payload.",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { type, items } = parsed.data;
    let inserted = 0;
    const errors: string[] = [];

    if (type === "scenarios") {
      for (let i = 0; i < items.length; i++) {
        const result = ScenarioImportSchema.safeParse(items[i]);
        if (!result.success) {
          errors.push(`Item ${i}: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
          continue;
        }
        await db
          .insert(scenariosTable)
          .values(result.data)
          .onConflictDoNothing({ target: [scenariosTable.region_code, scenariosTable.pillar, scenariosTable.title] });
        inserted++;
      }
    } else if (type === "compass_regions") {
      for (let i = 0; i < items.length; i++) {
        const result = CompassRegionImportSchema.safeParse(items[i]);
        if (!result.success) {
          errors.push(`Item ${i}: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
          continue;
        }
        const { region_code, flag_emoji, content } = result.data;
        const typedContent = content as CompassLocaleMap;
        await db
          .insert(compassRegionsTable)
          .values({ region_code, flag_emoji: flag_emoji ?? "", content: typedContent })
          .onConflictDoUpdate({
            target: compassRegionsTable.region_code,
            set: {
              content: typedContent,
              ...(flag_emoji ? { flag_emoji } : {}),
            },
          });
        inserted++;
      }
    }

    return res.json({
      ok: true,
      inserted,
      errors_count: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: import failed");
    return res.status(500).json({ error: "A difficulty arose during bulk import." });
  }
});

export default router;
