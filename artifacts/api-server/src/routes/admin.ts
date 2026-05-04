import express, { Router, type Request, type Response, type NextFunction } from "express";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { db } from "@workspace/db";
import { usersTable, scenariosTable, cultureProtocolsTable, compassRegionsTable, translationsTable, nobleScoreLogTable, zuil_voortgangTable, learningTrackQuestionsTable, ccProtocolRemovalsTable, useCasesTable, onboardingEventsTable, workerRunsTable, type CompassLocaleMap, CC_SUBCATEGORIES } from "@workspace/db";
import { parseLearningTrackMd } from "@workspace/db/parse-learning-track-md";
import { runAtelierSeed } from "@workspace/db/seed";
import { runCompassSeed } from "@workspace/db/seed-compass";
import { eq, ilike, or, desc, sql, count, inArray, and } from "drizzle-orm";
import { z } from "zod";
import { extractToken } from "../lib/auth-middleware";
import { calibrateTranslationsByIds, calibrateI18nMap, upsertContentTranslationRows, type CalibrationModule } from "../lib/register-calibration";

const execAsync = promisify(exec);
const __currentDir = path.dirname(fileURLToPath(import.meta.url));
// In the compiled bundle (dist/index.mjs) __currentDir ends with /dist — 3 levels to workspace root.
// In development (src/routes/admin.ts via tsx) it ends with /routes — 4 levels to workspace root.
const WORKSPACE_ROOT = __currentDir.endsWith("/dist")
  ? path.resolve(__currentDir, "../../../")
  : path.resolve(__currentDir, "../../../../");

const router = Router();

/**
 * Middleware: verifies session (cookie or Bearer fallback) and confirms is_admin=true.
 */
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const [user] = await db
      .select({ id: usersTable.id, is_admin: usersTable.is_admin, suspended_at: usersTable.suspended_at })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token is not recognised." });
      return;
    }
    if (user.suspended_at) {
      res.status(403).json({ error: "This account has been suspended. Please contact support." });
      return;
    }
    if (!user.is_admin) {
      res.status(403).json({ error: "This section is restricted to administrators." });
      return;
    }
    (req as Request & { resolvedUserId: string }).resolvedUserId = user.id;
    next();
  } catch {
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
        active_region: usersTable.active_region,
        objectives: usersTable.objectives,
        onboarding_completed: usersTable.onboarding_completed,
        utm_source: usersTable.utm_source,
        utm_medium: usersTable.utm_medium,
        utm_campaign: usersTable.utm_campaign,
        utm_content: usersTable.utm_content,
        utm_term: usersTable.utm_term,
      })
      .from(usersTable)
      .where(whereClause)
      .orderBy(desc(usersTable.created_at))
      .limit(limit)
      .offset(offset);

    const total = totalRow?.total ?? 0;
    return res.json({ users: rows, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
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
    const { session_token: _st, verification_token: _vt, password_hash: _ph, situational_interests: _si, ...safeUser } = user;
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

    const { session_token: _st, verification_token: _vt, password_hash: _ph2, situational_interests: _si2, ...safeUser } = updated;
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

    const { session_token: _st, verification_token: _vt, password_hash: _ph3, situational_interests: _si3, ...safeUser } = updated;
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

    const { session_token: _st, verification_token: _vt, password_hash: _ph4, situational_interests: _si4, ...safeUser } = updated;
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

    await db.transaction(async (tx) => {
      await tx.delete(nobleScoreLogTable).where(eq(nobleScoreLogTable.user_id, id));
      await tx.delete(zuil_voortgangTable).where(eq(zuil_voortgangTable.user_id, id));
      await tx.delete(usersTable).where(eq(usersTable.id, id));
    });

    return res.json({ message: "The user's record has been permanently removed." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete user");
    return res.status(500).json({ error: "A difficulty arose deleting the user." });
  }
});

// ── UTM Attribution Analytics ────────────────────────────────────────────────

/**
 * GET /admin/utm-attribution — campaign attribution breakdown for marketing.
 *
 * Returns counts of registered users grouped by each UTM dimension
 * (source / medium / campaign / content / term) plus the top combined
 * source+medium+campaign tuples and overall totals.
 *
 * Only users with at least one UTM field populated count as "attributed";
 * the rest are reported as `unattributed` so the marketing team can gauge
 * coverage of their tagged links.
 */
router.get("/admin/utm-attribution", requireAdmin, async (req, res) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(usersTable);

    const [{ attributed }] = await db
      .select({ attributed: count() })
      .from(usersTable)
      .where(
        or(
          sql`${usersTable.utm_source} IS NOT NULL`,
          sql`${usersTable.utm_medium} IS NOT NULL`,
          sql`${usersTable.utm_campaign} IS NOT NULL`,
          sql`${usersTable.utm_content} IS NOT NULL`,
          sql`${usersTable.utm_term} IS NOT NULL`,
        ),
      );

    async function groupBreakdown(col: typeof usersTable.utm_source) {
      const rows = await db
        .select({ value: col, total: count() })
        .from(usersTable)
        .where(sql`${col} IS NOT NULL`)
        .groupBy(col)
        .orderBy(desc(count()))
        .limit(50);
      return rows.map((r) => ({ value: r.value ?? "(none)", count: r.total }));
    }

    const [bySource, byMedium, byCampaign, byContent, byTerm] = await Promise.all([
      groupBreakdown(usersTable.utm_source),
      groupBreakdown(usersTable.utm_medium),
      groupBreakdown(usersTable.utm_campaign),
      groupBreakdown(usersTable.utm_content),
      groupBreakdown(usersTable.utm_term),
    ]);

    const topCombined = await db
      .select({
        utm_source: usersTable.utm_source,
        utm_medium: usersTable.utm_medium,
        utm_campaign: usersTable.utm_campaign,
        total: count(),
      })
      .from(usersTable)
      .where(
        or(
          sql`${usersTable.utm_source} IS NOT NULL`,
          sql`${usersTable.utm_medium} IS NOT NULL`,
          sql`${usersTable.utm_campaign} IS NOT NULL`,
        ),
      )
      .groupBy(usersTable.utm_source, usersTable.utm_medium, usersTable.utm_campaign)
      .orderBy(desc(count()))
      .limit(25);

    return res.json({
      total_users: total,
      attributed_users: attributed,
      unattributed_users: total - attributed,
      by_source: bySource,
      by_medium: byMedium,
      by_campaign: byCampaign,
      by_content: byContent,
      by_term: byTerm,
      top_combined: topCombined.map((r) => ({
        utm_source: r.utm_source,
        utm_medium: r.utm_medium,
        utm_campaign: r.utm_campaign,
        count: r.total,
      })),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to compute UTM attribution");
    return res.status(500).json({ error: "A difficulty arose computing UTM attribution." });
  }
});

// ── Content Management ────────────────────────────────────────────────────────

/** GET /admin/content/status — row counts + translation coverage per table */
router.get("/admin/content/status", requireAdmin, async (req, res) => {
  try {
    const [scenarios] = await db.select({ total: count() }).from(scenariosTable);
    const [protocols] = await db.select({ total: count() }).from(cultureProtocolsTable);
    const [regions] = await db.select({ total: count() }).from(compassRegionsTable);
    const [ltqTotal] = await db.select({ total: count() }).from(learningTrackQuestionsTable);
    const ltqByRegion = await db
      .select({ region_code: learningTrackQuestionsTable.region_code, total: count() })
      .from(learningTrackQuestionsTable)
      .groupBy(learningTrackQuestionsTable.region_code)
      .orderBy(learningTrackQuestionsTable.region_code);

    const translationsByLang = await db
      .select({ lang: translationsTable.language_code, total: count() })
      .from(translationsTable)
      .groupBy(translationsTable.language_code);

    // Scenario translation coverage: count how many have title_i18n for each lang
    const allScenarios = await db
      .select({ title_i18n: sql<Record<string, string> | null>`title_i18n` })
      .from(scenariosTable);

    const scenarioLangs = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];
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
      learning_track_questions: ltqTotal.total,
      learning_track_questions_by_region: ltqByRegion.reduce((acc, r) => {
        acc[r.region_code] = r.total;
        return acc;
      }, {} as Record<string, number>),
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

/**
 * GET /admin/compass-regions — list every compass region (published + stub).
 * Returns: region_code, flag_emoji, is_published, locale_count, completeness (0-100).
 * Completeness = avg across locales of filled etiquette fields / 9.
 */
router.get("/admin/compass-regions", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(compassRegionsTable);

    const REQUIRED = [
      "region_name",
      "core_value",
      "biggest_taboo",
      "dining_etiquette",
      "language_notes",
      "gift_protocol",
      "dress_code",
      "dos",
      "donts",
    ] as const;

    const out = rows.map((row) => {
      const content = (row.content ?? {}) as Record<string, Record<string, unknown>>;
      const locales = Object.keys(content);
      let completeness = 0;
      if (locales.length > 0) {
        let totalFilled = 0;
        for (const loc of locales) {
          const c = content[loc] ?? {};
          for (const field of REQUIRED) {
            const v = c[field];
            if (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.length > 0 : false) {
              totalFilled++;
            }
          }
        }
        completeness = Math.round((totalFilled / (locales.length * REQUIRED.length)) * 100);
      }
      return {
        region_code: row.region_code,
        flag_emoji: row.flag_emoji,
        is_published: row.is_published,
        locale_count: locales.length,
        completeness,
      };
    });

    out.sort((a, b) => {
      if (a.is_published !== b.is_published) return a.is_published ? -1 : 1;
      if (a.completeness !== b.completeness) return b.completeness - a.completeness;
      return a.region_code.localeCompare(b.region_code);
    });

    return res.json(out);
  } catch (err) {
    _req.log?.error({ err }, "Admin: failed to list compass regions");
    return res.status(500).json({ error: "A difficulty arose listing compass regions." });
  }
});

const PublishToggleSchema = z.object({
  is_published: z.boolean(),
});

/** PATCH /admin/compass-regions/:regionCode — toggle is_published. */
router.patch("/admin/compass-regions/:regionCode", requireAdmin, async (req, res) => {
  try {
    const regionCode = req.params.regionCode.toUpperCase();
    const parsed = PublishToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "is_published (boolean) is required." });
    }
    const result = await db
      .update(compassRegionsTable)
      .set({ is_published: parsed.data.is_published })
      .where(eq(compassRegionsTable.region_code, regionCode))
      .returning({ region_code: compassRegionsTable.region_code });
    if (result.length === 0) {
      return res.status(404).json({ error: `Region '${regionCode}' not found.` });
    }
    return res.json({ ok: true, region_code: regionCode, is_published: parsed.data.is_published });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to toggle compass region publish flag");
    return res.status(500).json({ error: "A difficulty arose updating the region." });
  }
});

// ── Migration guard ───────────────────────────────────────────────────────────

interface MigrationEntry {
  id: string;
  verificationQuery?: string;
  verificationResult?: { rowCount: number; note?: string };
}

interface MigrationCheckFailure {
  id: string;
  verificationQuery: string;
  expectedRowCount: number;
  actualRowCount: number;
  note: string;
}

/**
 * Reads applied.json and runs each migration's verificationQuery against the DB.
 * Only checks migrations where verificationResult.rowCount > 0 (structural schema
 * changes — columns, tables, constraints). Data-cleanup migrations (rowCount === 0)
 * are skipped because zero rows is an ambiguous signal.
 *
 * Returns ok=true when every checked migration passes, or a list of failures.
 */
async function checkMigrations(): Promise<{ ok: boolean; failures: MigrationCheckFailure[] }> {
  const appliedJsonPath = path.join(WORKSPACE_ROOT, "lib/db/migrations/applied.json");
  const { migrations }: { migrations: MigrationEntry[] } = JSON.parse(
    readFileSync(appliedJsonPath, "utf-8"),
  );

  const failures: MigrationCheckFailure[] = [];

  for (const migration of migrations) {
    const { verificationQuery, verificationResult } = migration;
    if (!verificationQuery) continue;

    const expectedRowCount = verificationResult?.rowCount ?? 0;
    if (expectedRowCount === 0) {
      continue;
    }

    let actualRowCount = 0;
    try {
      const result = await db.execute(sql.raw(verificationQuery));
      actualRowCount = result.rows.length;
    } catch {
      actualRowCount = 0;
    }

    if (actualRowCount < expectedRowCount) {
      failures.push({
        id: migration.id,
        verificationQuery,
        expectedRowCount,
        actualRowCount,
        note: verificationResult?.note ?? "",
      });
    }
  }

  return { ok: failures.length === 0, failures };
}

/** POST /admin/content/seed — trigger idempotent seed scripts */
router.post("/admin/content/seed", requireAdmin, async (req, res) => {
  try {
    // ── Pre-flight: verify all tracked DB migrations are present ─────────────
    const { ok: migrationsOk, failures } = await checkMigrations();
    if (!migrationsOk) {
      const missing = failures.map((f) => ({
        migration: f.id,
        expected_rows: f.expectedRowCount,
        actual_rows: f.actualRowCount,
        verification_query: f.verificationQuery,
        note: f.note,
      }));
      req.log?.error({ missing }, "Admin: seed aborted — missing DB migrations");
      return res.status(409).json({
        ok: false,
        error: "One or more required DB migrations have not been applied. Run the missing migrations before seeding.",
        missing_migrations: missing,
      });
    }

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

    try {
      await runAtelierSeed();
      results.push("[Atelier] OK");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`[Atelier] ERROR: ${msg}`);
      anyFailed = true;
    }

    try {
      await runCompassSeed();
      results.push("[Compass] OK");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`[Compass] ERROR: ${msg}`);
      anyFailed = true;
    }

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
  bolton_cluster: z.number().int().min(1).max(5).nullable().optional(),
  behavioral_tags: z.array(z.string()).optional().default([]),
  correction_style: z.string().nullable().optional(),
  // Social class register fields (all optional, safe defaults)
  social_class: z.enum(["universal", "elite", "middle_class"]).optional().default("universal"),
  demographic_bracket: z.enum(["common", "men_19_30", "women_19_30", "men_30_50", "women_30_50", "men_50plus", "women_50plus"]).nullable().optional(),
  interaction_pair: z.string().nullable().optional(),
  phase_module: z.enum(["MOD_A", "MOD_B", "MOD_C", "MOD_D", "MOD_E", "MOD_F", "MOD_G"]).nullable().optional(),
  research_pillar: z.enum(["P1", "P2", "P3", "P4"]).nullable().optional(),
  content_json: z.object({
    situation: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.object({
      text: z.string().min(1),
      /** answer_tier: 1 = Good/Correct, 2 = Slightly Different/Acceptable, 3 = Would not do that/Incorrect */
      answer_tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      /** correct is kept for backwards compatibility; answer_tier takes precedence if both supplied */
      correct: z.boolean().optional(),
      explanation: z.string().min(1),
      behavior_signal: z.string().optional(),
    })).min(2).max(6),
    historical_context: z.string().optional(),
  }),
});

const CultureProtocolImportSchema = z.object({
  region_code: z.string().min(2).max(10),
  pillar: z.number().int().min(0).max(5).default(0),
  rule_type: z.string().default(""),
  rule_description: z.string().default(""),
  gender_applicability: z.string().default("all"),
  context: z.string().default("general"),
  source_reference: z.string().nullable().optional(),
  // CC Screening Worker fields
  source_book: z.string().nullable().optional(),
  source_page: z.string().nullable().optional(),
  pillar_code: z.enum(["Z1", "Z2", "Z3", "Z4", "Z5"]).nullable().optional(),
  subcategory: z.string().nullable().optional(),
  rule_raw: z.string().nullable().optional(),
  rule_cc: z.string().nullable().optional(),
  rule_cc_i18n: z.record(z.string(), z.string()).optional(),
  personas: z.array(z.string()).optional(),
  modules: z.array(z.string()).optional(),
  urgency: z.number().int().min(1).max(3).optional(),
  verified: z.boolean().optional().default(false),
  // Social class register field (optional, safe default)
  social_class: z.enum(["universal", "elite", "middle_class"]).optional().default("universal"),
});

const REQUIRED_LOCALE_FIELDS = [
  "region_name",
  "core_value",
  "biggest_taboo",
  "dining_etiquette",
  "language_notes",
  "gift_protocol",
  "dress_code",
  "dos",
  "donts",
] as const;

const CompassRegionImportSchema = z.object({
  region_code: z.string().length(2),
  flag_emoji: z.string().optional(),
  content: z
    .record(z.string(), z.unknown())
    .refine((c) => Object.keys(c).length >= 1, {
      message:
        "content must contain at least one locale key (e.g. 'en-GB') with the etiquette fields filled in.",
    })
    .refine(
      (c) => {
        for (const [, locale] of Object.entries(c)) {
          if (!locale || typeof locale !== "object" || Array.isArray(locale)) return false;
          const obj = locale as Record<string, unknown>;
          for (const field of REQUIRED_LOCALE_FIELDS) {
            if (!(field in obj)) return false;
          }
        }
        return true;
      },
      {
        message:
          "Each locale in content must include all etiquette fields: region_name, core_value, biggest_taboo, dining_etiquette, language_notes, gift_protocol, dress_code, dos, donts.",
      }
    ),
});

const LearningTrackImportSchema = z.object({
  register: z.enum(["middle_class", "elite"]),
  research_pillar: z.string().nullable().optional(),
  phase: z.number().int().min(1).max(5),
  level: z.number().int().min(1).max(5),
  region_code: z.string().min(2).max(10),
  demographic: z.string().default("common"),
  question_text: z.string().min(1),
  historical_context: z.string().nullable().optional(),
  options: z.array(z.object({
    text: z.string().min(1),
    answer_tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    motivation: z.string().min(1),
  })).min(2).max(6).refine(
    (opts) => opts.filter((o) => o.answer_tier === 1).length === 1,
    { message: "Exactly one option must have answer_tier = 1 (the best answer)." },
  ),
  lang: z.string().default("en"),
});

const BulkImportBodySchema = z.object({
  type: z.enum(["scenarios", "compass_regions", "culture_protocols", "learning_tracks"]),
  items: z.array(z.unknown()).min(1).max(5000),
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

    const newScenarioIds: number[] = [];

    if (type === "scenarios") {
      for (let i = 0; i < items.length; i++) {
        const result = ScenarioImportSchema.safeParse(items[i]);
        if (!result.success) {
          errors.push(`Item ${i}: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
          continue;
        }
        const rows = await db
          .insert(scenariosTable)
          .values(result.data)
          .onConflictDoNothing({ target: [scenariosTable.region_code, scenariosTable.pillar, scenariosTable.title] })
          .returning({ id: scenariosTable.id });
        if (rows.length > 0) {
          newScenarioIds.push(rows[0].id);
          inserted++;
        }
      }

      // Spawn translation worker in the background for newly inserted scenarios only
      if (newScenarioIds.length > 0) {
        const minId = Math.min(...newScenarioIds);
        const maxId = Math.max(...newScenarioIds);
        const ids = [...newScenarioIds];
        const child = spawn(
          "node",
          ["scripts/scenario-translate.mjs", "--from", String(minId), "--to", String(maxId)],
          { cwd: WORKSPACE_ROOT, env: { ...process.env }, stdio: "ignore" },
        );
        req.log?.info({ newScenarioIds: ids, minId, maxId }, "Admin: scenario translate worker spawned in background");

        // Auto-trigger register calibration once translation has completed.
        // Each scenario's `social_class` selects the target register
        // (middle_class → standard, elite → elite, universal → skipped).
        child.on("exit", async (code) => {
          if (code !== 0) {
            req.log?.warn({ code, ids }, "Admin: scenario translate worker exited non-zero; skipping calibration");
            return;
          }
          try {
            const rows = await db
              .select({
                id: scenariosTable.id,
                social_class: scenariosTable.social_class,
                content_i18n: scenariosTable.content_i18n,
              })
              .from(scenariosTable)
              .where(inArray(scenariosTable.id, ids));

            for (const row of rows) {
              if (!row.content_i18n) continue;
              const module: CalibrationModule | null =
                row.social_class === "elite"
                  ? "elite"
                  : row.social_class === "middle_class"
                    ? "standard"
                    : null;
              if (!module) continue;

              // Calibrate every user-facing ScenarioContent field per locale:
              // situation, question, historical_context, plus each option's
              // text / explanation / behavior_signal.
              const calibrated: Record<string, typeof row.content_i18n[string]> = {
                ...(row.content_i18n as Record<string, NonNullable<typeof row.content_i18n>[string]>),
              };
              let anyChanged = false;
              for (const [locale, content] of Object.entries(calibrated)) {
                const fieldMap: Record<string, string> = {
                  situation: content.situation ?? "",
                  question: content.question ?? "",
                };
                if (content.historical_context) fieldMap.historical_context = content.historical_context;

                // Calibrate top-level fields per-locale.
                const perFieldResult: Record<string, string> = {};
                for (const [field, text] of Object.entries(fieldMap)) {
                  if (!text) continue;
                  const r = await calibrateI18nMap({ [locale]: text }, module);
                  perFieldResult[field] = r.calibrated[locale] ?? text;
                  if (r.changed) anyChanged = true;
                }

                // Calibrate every option's text / explanation / behavior_signal.
                const calibratedOptions = await Promise.all(
                  (content.options ?? []).map(async (opt) => {
                    const out = { ...opt };
                    for (const field of ["text", "explanation", "behavior_signal"] as const) {
                      const v = (opt as unknown as Record<string, unknown>)[field];
                      if (typeof v !== "string" || v.length === 0) continue;
                      const r = await calibrateI18nMap({ [locale]: v }, module);
                      const next = r.calibrated[locale] ?? v;
                      if (r.changed) anyChanged = true;
                      (out as unknown as Record<string, unknown>)[field] = next;
                    }
                    return out;
                  })
                );

                calibrated[locale] = {
                  ...content,
                  ...(perFieldResult.situation !== undefined ? { situation: perFieldResult.situation } : {}),
                  ...(perFieldResult.question !== undefined ? { question: perFieldResult.question } : {}),
                  ...(perFieldResult.historical_context !== undefined
                    ? { historical_context: perFieldResult.historical_context }
                    : {}),
                  options: calibratedOptions,
                };
              }

              if (anyChanged) {
                await db
                  .update(scenariosTable)
                  .set({ content_i18n: calibrated })
                  .where(eq(scenariosTable.id, row.id));
              }
            }
            req.log?.info({ ids, count: rows.length }, "Admin: scenario register calibration completed");
          } catch (calErr) {
            req.log?.warn({ calErr, ids }, "Admin: scenario register calibration failed");
          }
        });
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
          .values({
            region_code,
            flag_emoji: flag_emoji ?? "",
            content: typedContent,
            is_published: true,
          })
          .onConflictDoUpdate({
            target: compassRegionsTable.region_code,
            set: {
              content: typedContent,
              is_published: true,
              ...(flag_emoji ? { flag_emoji } : {}),
            },
          });
        inserted++;
      }
    } else if (type === "culture_protocols") {
      for (let i = 0; i < items.length; i++) {
        const result = CultureProtocolImportSchema.safeParse(items[i]);
        if (!result.success) {
          errors.push(`Item ${i}: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
          continue;
        }
        await db
          .insert(cultureProtocolsTable)
          .values(result.data)
          .onConflictDoNothing({ target: [cultureProtocolsTable.region_code, cultureProtocolsTable.pillar, cultureProtocolsTable.rule_type] });
        inserted++;
      }
    } else if (type === "learning_tracks") {
      const BATCH_SIZE = 500;
      const valid: z.infer<typeof LearningTrackImportSchema>[] = [];

      for (let i = 0; i < items.length; i++) {
        const result = LearningTrackImportSchema.safeParse(items[i]);
        if (!result.success) {
          errors.push(`Item ${i}: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
          continue;
        }
        valid.push(result.data);
      }

      for (let i = 0; i < valid.length; i += BATCH_SIZE) {
        const batch = valid.slice(i, i + BATCH_SIZE);
        const rows = await db
          .insert(learningTrackQuestionsTable)
          .values(batch)
          .onConflictDoNothing()
          .returning({ id: learningTrackQuestionsTable.id });
        inserted += rows.length;
      }
    }

    return res.json({
      ok: true,
      inserted,
      errors_count: errors.length,
      errors: errors.slice(0, 20),
      ...(newScenarioIds.length > 0 && {
        translation_queued: true,
        translation_scenario_ids: newScenarioIds,
        translation_note: "Translations into 9 languages are being generated in the background. This may take a few minutes.",
      }),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: import failed");
    return res.status(500).json({ error: "A difficulty arose during bulk import." });
  }
});

// ── Learning Track MD Import ───────────────────────────────────────────────────


/** POST /admin/content/import-learning-tracks-md — parse & import a canonical MD file */
router.post(
  "/admin/content/import-learning-tracks-md",
  requireAdmin,
  express.text({ limit: "10mb", type: ["text/plain", "text/markdown", "application/octet-stream"] }),
  async (req, res) => {
    try {
      const content = typeof req.body === "string" ? req.body : "";
      if (!content.trim()) {
        return res.status(400).json({ error: "Empty or missing MD content." });
      }

      const { questions, parseErrors } = parseLearningTrackMd(content);

      if (questions.length === 0) {
        return res.status(422).json({
          error: "No valid questions could be parsed from this file.",
          errors_count: parseErrors.length,
          errors: parseErrors,
          inserted: 0,
          skipped: 0,
        });
      }

      const BATCH_SIZE = 500;
      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const rows = await db
          .insert(learningTrackQuestionsTable)
          .values(batch)
          .onConflictDoNothing()
          .returning({ id: learningTrackQuestionsTable.id });
        inserted += rows.length;
        skipped += batch.length - rows.length;
      }

      req.log?.info({ inserted, skipped, parseErrors: parseErrors.length }, "Admin: MD learning track import done");

      return res.json({
        ok: true,
        parsed: questions.length,
        inserted,
        skipped,
        errors_count: parseErrors.length,
        errors: parseErrors,
      });
    } catch (err) {
      req.log?.error({ err }, "Admin: MD learning track import failed");
      return res.status(500).json({ error: "A difficulty arose during MD import." });
    }
  },
);

// ── CC Screening Worker ────────────────────────────────────────────────────────

// Load the authoritative CC handbook as the system prompt context
function loadCCHandbook(): string {
  const handbookPath = path.resolve(process.cwd(), "../../docs/CC_Screening_Worker.md");
  try {
    const handbookContent = readFileSync(handbookPath, "utf-8");
    return `Je bent de CC-Screening-Worker voor het project Context & Courtesy.
Je gedragsregels, classificatieschema en outputformaat staan volledig beschreven in je kennisbank hieronder.
Volg altijd de 10-stappen workflow. Reageer uitsluitend in het gevraagde JSON-formaat, tenzij je om verduidelijking moet vragen.
Schrijf nooit letterlijke boektekst over.

## Uitvoer JSON formaat (antwoord UITSLUITEND met geldig JSON, geen andere tekst)
{
  "source_book": "<code>",
  "source_page": "<pagina>",
  "region": "<UK|CN|CA|AU|UNIVERSAL>",
  "pillar": "<Z1|Z2|Z3|Z4|Z5>",
  "subcategory": "<subcategorie>",
  "rule_raw": "<korte parafrase van de ruwe feit — intern gebruik>",
  "rule_cc": "<C&C mentor-formulering — app-tekst>",
  "personas": ["P1", "P2"],
  "modules": ["GYM", "AID"],
  "urgency": 2,
  "verified": false
}

## Foutmeldingen (gebruik deze exacte JSON structuur)
- Fragment onduidelijk → {"error": "UNCLEAR", "message": "Fragment is te vaag. Verduidelijk de context."}
- Geen etiquetteregel → {"error": "NO_RULE", "message": "Geen extraheerbare etiquetteregel gevonden in dit fragment."}
- Letterlijk citaat → {"error": "COPYRIGHT", "message": "Auteursrechtveiligheid: parafraseer eerst het fragment zelf."}

## Kennisbank (volledig handbook)
${handbookContent}`;
  } catch {
    // Fallback minimal prompt if file cannot be read
    return `Je bent de CC-Screening-Worker voor het project Context & Courtesy.
Extraheer etiquetteregels uit boekteksten naar het 5-Zuilen-schema (Z1-Z5).
Antwoord UITSLUITEND met geldig JSON conform het outputformaat:
{"source_book":"<code>","source_page":"<pagina>","region":"<UK|CN|CA|AU|UNIVERSAL>","pillar":"<Z1|Z2|Z3|Z4|Z5>","subcategory":"<sub>","rule_raw":"<parafrase>","rule_cc":"<C&C stem>","personas":["P1","P2","P3"],"modules":["GYM","AID","CMP"],"urgency":2,"verified":false}`;
  }
}

// Initialise once at startup
const CC_SYSTEM_PROMPT = loadCCHandbook();

const CCScreenRequestSchema = z.object({
  fragment: z.string().min(10).max(5000),
  source_book: z.enum(["DH", "AV", "ME", "MG", "DN", "CB", "CA", "CM"]),
  source_page: z.string().min(1).max(20),
});

const CC_VALID_PILLARS = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
const CC_VALID_REGIONS = ["UK", "CN", "CA", "AU", "UNIVERSAL", "US", "FR", "DE", "JP", "AE"] as const;
const CC_VALID_PERSONAS = ["P1", "P2", "P3"] as const;
const CC_VALID_MODULES = ["GYM", "AID", "CMP"] as const;

const CCSaveRequestSchema = z.object({
  source_book: z.enum(["DH", "AV", "ME", "MG", "DN", "CB", "CA", "CM"]),
  source_page: z.string().min(1).max(20),
  region: z.string().min(2).max(20),
  pillar: z.enum(CC_VALID_PILLARS),
  subcategory: z.string().min(1).max(100),
  rule_raw: z.string().min(5).max(2000),
  rule_cc: z.string().min(10).max(2000),
  personas: z.array(z.enum(CC_VALID_PERSONAS)).min(1),
  modules: z.array(z.enum(CC_VALID_MODULES)).min(1),
  urgency: z.number().int().min(1).max(3),
  _note: z.string().optional(),
});

/** POST /admin/cc-screen — run CC Screening Worker on a text fragment */
router.post("/admin/cc-screen", requireAdmin, async (req, res) => {
  try {
    const parsed = CCScreenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request.", details: parsed.error.flatten().fieldErrors });
    }

    const { fragment, source_book, source_page } = parsed.data;
    const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
    const anthropicKey  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    if (!anthropicBase || !anthropicKey) {
      return res.status(503).json({ error: "AI integration not configured." });
    }

    const userMessage = `Verwerk het volgende tekstfragment uit bronboek ${source_book}, pagina ${source_page}:

---
${fragment}
---

Volg de 10-stappen workflow en geef de output als geldig JSON-object.`;

    const aiResponse = await fetch(`${anthropicBase}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        temperature: 0.2,
        system: CC_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      req.log?.error({ status: aiResponse.status, errText }, "CC Screening: AI call failed");
      return res.status(502).json({ error: "AI service error." });
    }

    const aiData = await aiResponse.json() as { content: Array<{ text: string }> };
    const rawText = aiData.content?.[0]?.text?.trim() ?? "";

    // Extract JSON from response (handle markdown fences)
    let jsonText = rawText;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];
    else jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed2: Record<string, unknown>;
    try {
      parsed2 = JSON.parse(jsonText);
    } catch {
      return res.status(422).json({ error: "AI returned invalid JSON.", raw: rawText.substring(0, 500) });
    }

    // Handle AI-reported errors
    if (typeof parsed2.error === "string") {
      return res.status(422).json({ error: parsed2.error, details: parsed2.message });
    }

    // ── Quality validation ─────────────────────────────────────────────────────
    const warnings: string[] = [];

    // 1. rule_cc must not be empty
    if (!parsed2.rule_cc || typeof parsed2.rule_cc !== "string" || (parsed2.rule_cc as string).length < 10) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: "rule_cc is missing or too short." });
    }

    // 2. rule_raw must not be empty
    if (!parsed2.rule_raw || typeof parsed2.rule_raw !== "string" || (parsed2.rule_raw as string).length < 5) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: "rule_raw is missing or too short." });
    }

    // 3. Copyright heuristic — check if rule_cc contains long quoted sequences from fragment
    const fragmentWords = fragment.toLowerCase().split(/\s+/);
    const ruleCcWords = (parsed2.rule_cc as string).toLowerCase().split(/\s+/);
    let consecutiveMatches = 0;
    let maxConsecutive = 0;
    for (const word of ruleCcWords) {
      if (fragmentWords.includes(word) && word.length > 4) {
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 0;
      }
    }
    if (maxConsecutive >= 8) {
      warnings.push("rule_cc may contain near-literal text from the source. Review before saving.");
    }

    // 4. Urgency validation
    const urgency = Number(parsed2.urgency);
    if (!Number.isInteger(urgency) || urgency < 1 || urgency > 3) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: "urgency must be 1, 2, or 3." });
    }
    if (urgency === 3) {
      warnings.push("Urgency 3 (kritisch) — per spec mag max 20% van de regels in een batch urgency=3 hebben. Controleer dit voor bulk-opslag.");
    }

    // 5. verified must always be false
    parsed2.verified = false;

    // 6. Pillar validation — AI returns "pillar" field
    const pillarVal = (parsed2.pillar ?? parsed2.pillar_code) as string;
    if (!CC_VALID_PILLARS.includes(pillarVal as typeof CC_VALID_PILLARS[number])) {
      return res.status(422).json({ error: "INVALID_OUTPUT", details: `pillar must be one of ${CC_VALID_PILLARS.join(", ")}.` });
    }
    // Normalise to "pillar" field name for downstream use
    parsed2.pillar = pillarVal;
    delete parsed2.pillar_code;

    // 7. Region must be specific (not continent-level)
    const regionUpper = (parsed2.region as string)?.toUpperCase();
    if (!CC_VALID_REGIONS.includes(regionUpper as typeof CC_VALID_REGIONS[number])) {
      warnings.push(`region '${parsed2.region}' is not a recognised code — use UNIVERSAL or verify.`);
    }

    // 8. Modules normalisation — AI may return "modules" or "modules_cc"
    if (!parsed2.modules && parsed2.modules_cc) {
      parsed2.modules = parsed2.modules_cc;
      delete parsed2.modules_cc;
    }

    return res.json({ ok: true, record: parsed2, warnings });
  } catch (err) {
    req.log?.error({ err }, "CC Screening: unexpected error");
    return res.status(500).json({ error: "A difficulty arose processing the fragment." });
  }
});

// ── CC Translation helper ─────────────────────────────────────────────────────

const CC_TARGET_LANGUAGES: Record<string, string> = {
  nl: "Dutch",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ar: "Arabic",
  ja: "Japanese",
  zh: "Chinese (Simplified Mandarin)",
};

/**
 * Translates a rule_cc string into all 9 non-English supported languages
 * using a single Claude call. Returns a Record<langCode, translatedText>.
 */
async function translateRuleCc(
  ruleCc: string,
  pillarCode: string,
  subcategory: string,
  req: Request,
): Promise<Record<string, string>> {
  const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const anthropicKey  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!anthropicBase || !anthropicKey) return {};

  const languageList = Object.entries(CC_TARGET_LANGUAGES)
    .map(([code, name]) => `"${code}": "${name}"`)
    .join(", ");

  const systemPrompt = `You are a professional cultural etiquette translator.
You translate etiquette rules from English into multiple languages.
Rules:
- Preserve the mentor/coaching tone of the original
- Keep proper nouns and culture-specific terms as-is
- Output ONLY valid JSON, no other text
- Each translation must be natural, idiomatic, and accurate`;

  const userMessage = `Translate this etiquette rule (pillar: ${pillarCode}, subcategory: ${subcategory}) into the following languages.
Return ONLY a JSON object with language codes as keys.

Rule (English): "${ruleCc}"

Target languages: { ${languageList} }

Expected output format:
{
  "nl": "<Dutch translation>",
  "fr": "<French translation>",
  "de": "<German translation>",
  "es": "<Spanish translation>",
  "pt": "<Portuguese translation>",
  "it": "<Italian translation>",
  "ar": "<Arabic translation>",
  "ja": "<Japanese translation>",
  "zh": "<Chinese translation>"
}`;

  const aiResponse = await fetch(`${anthropicBase}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!aiResponse.ok) {
    req.log?.warn({ status: aiResponse.status }, "CC Translation: AI call failed");
    return {};
  }

  const aiData = await aiResponse.json() as { content: Array<{ text: string }> };
  const rawText = aiData.content?.[0]?.text?.trim() ?? "";

  let jsonText = rawText;
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonText = jsonMatch[0];

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const lang of Object.keys(CC_TARGET_LANGUAGES)) {
      if (typeof parsed[lang] === "string" && (parsed[lang] as string).length > 0) {
        result[lang] = parsed[lang] as string;
      }
    }
    req.log?.info({ langs: Object.keys(result) }, "CC Translation: completed");
    return result;
  } catch {
    req.log?.warn({ rawText: rawText.substring(0, 300) }, "CC Translation: could not parse AI JSON");
    return {};
  }
}

/** POST /admin/cc-save — persist an approved CC record to culture_protocols */
router.post("/admin/cc-save", requireAdmin, async (req, res) => {
  try {
    const parsed = CCSaveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid record.", details: parsed.error.flatten().fieldErrors });
    }

    const data = parsed.data;

    // ── Full pre-save validation gate (mirrors §9 Quality Checklist) ──────────

    // 1. Pillar must be a valid Zuil code
    if (!CC_VALID_PILLARS.includes(data.pillar)) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: `pillar must be one of ${CC_VALID_PILLARS.join(", ")}.` });
    }

    // 2. Region must be a known country code (not continent-level)
    const regionUp = data.region.toUpperCase();
    if (!CC_VALID_REGIONS.includes(regionUp as typeof CC_VALID_REGIONS[number])) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: `region '${data.region}' is not a recognised code. Use UNIVERSAL or a valid country code.` });
    }

    // 3. Subcategory must belong to the assigned Zuil
    const validSubcategories = CC_SUBCATEGORIES[data.pillar as keyof typeof CC_SUBCATEGORIES] ?? [];
    if (!validSubcategories.includes(data.subcategory)) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: `subcategory '${data.subcategory}' is not valid for pillar ${data.pillar}. Valid: ${validSubcategories.join(", ")}.` });
    }

    // 4. At least one persona must be assigned
    if (data.personas.length === 0) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: "At least one persona must be assigned." });
    }

    // 5. At least one module must be assigned
    if (data.modules.length === 0) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: "At least one module must be assigned." });
    }

    // 6. rule_cc must not be suspiciously similar to rule_raw (basic paraphrase check)
    if (data.rule_cc.trim().toLowerCase() === data.rule_raw.trim().toLowerCase()) {
      return res.status(400).json({ error: "VALIDATION_FAILED", details: "rule_cc and rule_raw are identical — rule_cc must be rephrased in C&C mentor style." });
    }

    // 7. verified must always be false — hard enforce (cannot be set by caller)
    // (verified is omitted from CCSaveRequestSchema; always inserted as false)

    // 8. urgency=3 cap — max 20% of CC records may be urgency=3
    if (data.urgency === 3) {
      const totalRows = await db.select({ n: count() }).from(cultureProtocolsTable)
        .where(sql`source_book IS NOT NULL`);
      const urgency3Rows = await db.select({ n: count() }).from(cultureProtocolsTable)
        .where(sql`source_book IS NOT NULL AND urgency = 3`);
      const total = totalRows[0]?.n ?? 0;
      const urgent3 = urgency3Rows[0]?.n ?? 0;
      if (total >= 5 && urgent3 / total >= 0.20) {
        return res.status(400).json({
          error: "URGENCY_CAP_EXCEEDED", details: `Max 20% of CC records may be urgency=3. Current: ${urgent3}/${total} (${Math.round(urgent3 / total * 100)}%). Review urgency rating.`,
        });
      }
    }

    // Map pillar string (Z1–Z5) → integer for legacy pillar column
    const pillarToInt: Record<string, number> = { Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5 };
    const pillarInt = pillarToInt[data.pillar] ?? 0;

    // Build unique rule_type slug (subcategory + timestamp satisfies unique constraint)
    const ruleTypeSlug = `${data.subcategory}_${Date.now()}`;

    const [inserted] = await db.insert(cultureProtocolsTable).values({
      region_code: regionUp,
      pillar: pillarInt,
      rule_type: ruleTypeSlug,
      rule_description: data.rule_cc,
      source_reference: `${data.source_book}:${data.source_page}`,
      // CC Screening Worker fields
      source_book: data.source_book,
      source_page: data.source_page,
      pillar_code: data.pillar,
      subcategory: data.subcategory,
      rule_raw: data.rule_raw,
      rule_cc: data.rule_cc,
      personas: data.personas,
      modules: data.modules,
      urgency: data.urgency,
      verified: false,
    }).returning();

    // ── Automatic multilingual translation of rule_cc ─────────────────────────
    let translations: Record<string, string> = {};
    try {
      translations = await translateRuleCc(data.rule_cc, data.pillar, data.subcategory, req);
      if (Object.keys(translations).length > 0) {
        await db
          .update(cultureProtocolsTable)
          .set({ rule_cc_i18n: translations })
          .where(eq(cultureProtocolsTable.id, inserted.id));
      }
    } catch (translErr) {
      req.log?.warn({ translErr, id: inserted.id }, "CC Save: translation step failed — record saved without translations");
    }

    // ── Auto-trigger register calibration for the freshly translated content ──
    // CC mentor copy is by design accessible/middle-class, so we calibrate the
    // JSONB map to the "standard" register. Fire-and-forget so the request
    // returns immediately; the calibrated values overwrite rule_cc_i18n once
    // the per-locale evaluations complete.
    if (Object.keys(translations).length > 0) {
      const ccId = inserted.id;
      void calibrateI18nMap(translations, "standard")
        .then(async (cal) => {
          if (cal.changed) {
            await db
              .update(cultureProtocolsTable)
              .set({ rule_cc_i18n: cal.calibrated })
              .where(eq(cultureProtocolsTable.id, ccId));
          }
          req.log?.info(
            { ccId, unchanged: cal.unchanged, rewritten: cal.rewritten, errors: cal.errors },
            "CC Save: register calibration completed"
          );
        })
        .catch((calErr) => {
          req.log?.warn({ calErr, ccId }, "CC Save: register calibration failed");
        });
    }

    return res.json({ ok: true, id: inserted.id, translations });
  } catch (err) {
    req.log?.error({ err }, "CC Save: failed to persist record");
    return res.status(500).json({ error: "A difficulty arose saving the record." });
  }
});

// ── CC Protocol Review (Pending Verification) ─────────────────────────────────

/** GET /admin/cc-protocols — list unverified CC-extracted records for editorial review */
router.get("/admin/cc-protocols", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: count() })
      .from(cultureProtocolsTable)
      .where(sql`verified = false AND source_book IS NOT NULL`);

    const rows = await db
      .select({
        id: cultureProtocolsTable.id,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        source_reference: cultureProtocolsTable.source_reference,
        verified: cultureProtocolsTable.verified,
        created_at: cultureProtocolsTable.created_at,
      })
      .from(cultureProtocolsTable)
      .where(sql`verified = false AND source_book IS NOT NULL`)
      .orderBy(desc(cultureProtocolsTable.urgency), desc(cultureProtocolsTable.created_at))
      .limit(limit)
      .offset(offset);

    return res.json({
      records: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to list pending CC protocols");
    return res.status(500).json({ error: "A difficulty arose retrieving pending records." });
  }
});

const PatchCCProtocolBodySchema = z.object({
  approve: z.boolean().optional(),
  rule_cc: z.string().min(1).optional(),
  subcategory: z.string().min(1).optional(),
  urgency: z.number().int().min(1).max(3).optional(),
  region_code: z.string().min(2).max(10).optional(),
});

/** GET /admin/cc-protocols/verified — list verified CC records with reviewer info */
router.get("/admin/cc-protocols/verified", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: count() })
      .from(cultureProtocolsTable)
      .where(sql`verified = true AND source_book IS NOT NULL`);

    const rows = await db
      .select({
        id: cultureProtocolsTable.id,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        source_reference: cultureProtocolsTable.source_reference,
        verified: cultureProtocolsTable.verified,
        created_at: cultureProtocolsTable.created_at,
        reviewed_by: cultureProtocolsTable.reviewed_by,
        reviewed_at: cultureProtocolsTable.reviewed_at,
        reviewer_name: usersTable.full_name,
      })
      .from(cultureProtocolsTable)
      .leftJoin(usersTable, eq(cultureProtocolsTable.reviewed_by, usersTable.id))
      .where(sql`verified = true AND source_book IS NOT NULL`)
      .orderBy(desc(cultureProtocolsTable.reviewed_at))
      .limit(limit)
      .offset(offset);

    return res.json({
      records: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to list verified CC protocols");
    return res.status(500).json({ error: "A difficulty arose retrieving verified records." });
  }
});

/** PATCH /admin/cc-protocols/:id — update fields and/or approve a pending CC-extracted record */
router.patch("/admin/cc-protocols/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const parsed = PatchCCProtocolBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body.", details: parsed.error.flatten().fieldErrors });
    }

    const body = parsed.data;
    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    // Only operate on pending extracted rows (source_book IS NOT NULL AND verified = false)
    const [existing] = await db
      .select({ id: cultureProtocolsTable.id, verified: cultureProtocolsTable.verified, source_book: cultureProtocolsTable.source_book })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record and cannot be managed through this endpoint." });
    }

    const hasFieldUpdates = body.rule_cc !== undefined || body.subcategory !== undefined
      || body.urgency !== undefined || body.region_code !== undefined;
    const shouldApprove = body.approve === true || (!hasFieldUpdates && Object.keys(body).length === 0);

    if (existing.verified) {
      return res.status(409).json({ error: "Record is already verified and can no longer be modified through this endpoint." });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.rule_cc !== undefined) updatePayload.rule_cc = body.rule_cc;
    if (body.subcategory !== undefined) updatePayload.subcategory = body.subcategory;
    if (body.urgency !== undefined) updatePayload.urgency = body.urgency;
    if (body.region_code !== undefined) updatePayload.region_code = body.region_code.toUpperCase();
    if (shouldApprove) {
      updatePayload.verified = true;
      updatePayload.reviewed_by = requesterId;
      updatePayload.reviewed_at = new Date();
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No updatable fields were provided." });
    }

    const whereCondition = and(
      eq(cultureProtocolsTable.id, id),
      sql`source_book IS NOT NULL`,
      eq(cultureProtocolsTable.verified, false),
    );

    const [updated] = await db
      .update(cultureProtocolsTable)
      .set(updatePayload)
      .where(whereCondition)
      .returning({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        rule_cc: cultureProtocolsTable.rule_cc,
        subcategory: cultureProtocolsTable.subcategory,
        urgency: cultureProtocolsTable.urgency,
        region_code: cultureProtocolsTable.region_code,
      });

    if (!updated) {
      return res.status(409).json({ error: "Record not found or is no longer in pending state." });
    }

    // ── Auto re-translate + re-calibrate when rule_cc was updated ─────────────
    // Mirrors the cc-save save-path: re-fetch translations for the new English
    // text and run register calibration over the resulting i18n map. Both
    // steps are fire-and-forget so the response is not delayed.
    if (body.rule_cc !== undefined && updated.rule_cc) {
      const ccId = updated.id;
      const newRuleCc: string = updated.rule_cc;
      const pillarCode = (updated as { pillar_code?: string | null }).pillar_code ?? "Z1";
      const subcat = updated.subcategory ?? "general";
      void (async () => {
        try {
          const fresh = await translateRuleCc(newRuleCc, pillarCode, subcat, req);
          if (Object.keys(fresh).length === 0) return;
          await db
            .update(cultureProtocolsTable)
            .set({ rule_cc_i18n: fresh })
            .where(eq(cultureProtocolsTable.id, ccId));
          const cal = await calibrateI18nMap(fresh, "standard");
          if (cal.changed) {
            await db
              .update(cultureProtocolsTable)
              .set({ rule_cc_i18n: cal.calibrated })
              .where(eq(cultureProtocolsTable.id, ccId));
          }
          req.log?.info(
            { ccId, unchanged: cal.unchanged, rewritten: cal.rewritten, errors: cal.errors },
            "CC Update: re-translation + register calibration completed"
          );
        } catch (e) {
          req.log?.warn({ e, ccId }, "CC Update: re-translation/calibration failed");
        }
      })();
    }

    return res.json({ ok: true, ...updated });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to update CC protocol");
    return res.status(500).json({ error: "A difficulty arose updating the record." });
  }
});

/** DELETE /admin/cc-protocols/:id — permanently remove a pending CC-extracted record */
router.delete("/admin/cc-protocols/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    // Only operate on pending extracted rows (source_book IS NOT NULL AND verified = false)
    // Fetch full snapshot fields needed for the removal audit log
    const [existing] = await db
      .select({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
      })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record and cannot be managed through this endpoint." });
    }
    if (existing.verified) {
      return res.status(409).json({ error: "Only pending (unverified) records may be deleted through this endpoint." });
    }

    // Atomic transaction: persist audit snapshot then hard-delete the row
    let deletedId: number | null = null;
    await db.transaction(async (tx) => {
      // Insert audit snapshot before the row disappears
      await tx.insert(ccProtocolRemovalsTable).values({
        protocol_id: existing.id,
        removed_by: requesterId,
        removed_at: new Date(),
        region_code: existing.region_code,
        pillar_code: existing.pillar_code,
        subcategory: existing.subcategory,
        rule_cc: existing.rule_cc,
        rule_raw: existing.rule_raw,
        urgency: existing.urgency,
        source_book: existing.source_book,
        source_page: existing.source_page,
      });

      // Hard-delete (conditions re-checked in WHERE for race safety)
      const [row] = await tx
        .delete(cultureProtocolsTable)
        .where(and(
          eq(cultureProtocolsTable.id, id),
          sql`source_book IS NOT NULL`,
          eq(cultureProtocolsTable.verified, false),
        ))
        .returning({ id: cultureProtocolsTable.id });

      if (!row) throw new Error("RACE_CONDITION");
      deletedId = row.id;
    });

    if (!deletedId) {
      return res.status(409).json({ error: "Record not found or is no longer in pending state." });
    }

    return res.json({ ok: true, message: "Record permanently removed." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete CC protocol");
    return res.status(500).json({ error: "A difficulty arose deleting the record." });
  }
});

// ── Verified CC records: edit / unverify / delete ─────────────────────────────
//
// Once a CC-extracted record is approved (verified=true) the regular
// PATCH/DELETE endpoints refuse to touch it. These two endpoints give
// editorial reviewers a way to (a) correct mistakes after approval,
// (b) push a record back to the pending queue, or (c) permanently remove
// a verified record. All paths are admin-only and audit-logged via the
// existing ccProtocolRemovalsTable on hard delete.

const PatchVerifiedCCBodySchema = z.object({
  rule_cc: z.string().min(1).optional(),
  subcategory: z.string().min(1).optional(),
  urgency: z.number().int().min(1).max(3).optional(),
  region_code: z.string().min(2).max(10).optional(),
  unverify: z.boolean().optional(),
});

/** PATCH /admin/cc-protocols/:id/verified — correct fields on or unverify a verified CC record */
router.patch("/admin/cc-protocols/:id/verified", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const parsed = PatchVerifiedCCBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body.", details: parsed.error.flatten().fieldErrors });
    }
    const body = parsed.data;
    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    const [existing] = await db
      .select({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        source_book: cultureProtocolsTable.source_book,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        urgency: cultureProtocolsTable.urgency,
        region_code: cultureProtocolsTable.region_code,
      })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record." });
    }
    if (!existing.verified) {
      return res.status(409).json({ error: "Record is not verified — use the pending endpoint instead." });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.rule_cc !== undefined) updatePayload.rule_cc = body.rule_cc;
    if (body.subcategory !== undefined) updatePayload.subcategory = body.subcategory;
    if (body.urgency !== undefined) updatePayload.urgency = body.urgency;
    if (body.region_code !== undefined) updatePayload.region_code = body.region_code.toUpperCase();
    if (body.unverify === true) {
      updatePayload.verified = false;
      updatePayload.reviewed_by = null;
      updatePayload.reviewed_at = null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: "No updatable fields were provided." });
    }

    const [updated] = await db
      .update(cultureProtocolsTable)
      .set(updatePayload)
      .where(and(
        eq(cultureProtocolsTable.id, id),
        sql`source_book IS NOT NULL`,
        eq(cultureProtocolsTable.verified, true),
      ))
      .returning({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        rule_cc: cultureProtocolsTable.rule_cc,
        subcategory: cultureProtocolsTable.subcategory,
        urgency: cultureProtocolsTable.urgency,
        region_code: cultureProtocolsTable.region_code,
      });

    if (!updated) {
      return res.status(409).json({ error: "Record not found or no longer verified." });
    }

    // Audit trail: emit a structured log entry for every verified-record mutation.
    // Captures who acted, what changed (before/after), and whether the record
    // was sent back to the pending queue. Searchable via pino's JSON output.
    req.log?.info(
      {
        ccId: id,
        actor: requesterId,
        action: body.unverify === true ? "verified.unverify" : "verified.correct",
        before: {
          rule_cc: existing.rule_cc,
          subcategory: existing.subcategory,
          urgency: existing.urgency,
          region_code: existing.region_code,
        },
        after: {
          rule_cc: updated.rule_cc,
          subcategory: updated.subcategory,
          urgency: updated.urgency,
          region_code: updated.region_code,
          verified: updated.verified,
        },
      },
      "Admin: verified CC protocol mutated",
    );

    // Re-translate + re-calibrate when rule_cc changed (mirrors the pending PATCH path).
    if (body.rule_cc !== undefined && updated.rule_cc) {
      const ccId = updated.id;
      const newRuleCc: string = updated.rule_cc;
      const pillarCode = existing.pillar_code ?? "Z1";
      const subcat = updated.subcategory ?? existing.subcategory ?? "general";
      void (async () => {
        try {
          const fresh = await translateRuleCc(newRuleCc, pillarCode, subcat, req);
          if (Object.keys(fresh).length === 0) return;
          await db
            .update(cultureProtocolsTable)
            .set({ rule_cc_i18n: fresh })
            .where(eq(cultureProtocolsTable.id, ccId));
          const cal = await calibrateI18nMap(fresh, "standard");
          if (cal.changed) {
            await db
              .update(cultureProtocolsTable)
              .set({ rule_cc_i18n: cal.calibrated })
              .where(eq(cultureProtocolsTable.id, ccId));
          }
          req.log?.info({ ccId }, "Verified CC: re-translation + register calibration completed");
        } catch (e) {
          req.log?.warn({ e, ccId }, "Verified CC: re-translation/calibration failed");
        }
      })();
    }

    return res.json({ ok: true, ...updated });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to update verified CC protocol");
    return res.status(500).json({ error: "A difficulty arose updating the record." });
  }
});

/** DELETE /admin/cc-protocols/:id/verified — permanently remove a verified CC record */
router.delete("/admin/cc-protocols/:id/verified", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid record ID." });

    const requesterId = (req as Request & { resolvedUserId: string }).resolvedUserId;

    const [existing] = await db
      .select({
        id: cultureProtocolsTable.id,
        verified: cultureProtocolsTable.verified,
        source_book: cultureProtocolsTable.source_book,
        source_page: cultureProtocolsTable.source_page,
        region_code: cultureProtocolsTable.region_code,
        pillar_code: cultureProtocolsTable.pillar_code,
        subcategory: cultureProtocolsTable.subcategory,
        rule_cc: cultureProtocolsTable.rule_cc,
        rule_raw: cultureProtocolsTable.rule_raw,
        urgency: cultureProtocolsTable.urgency,
      })
      .from(cultureProtocolsTable)
      .where(eq(cultureProtocolsTable.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ error: "Record not found." });
    if (!existing.source_book) {
      return res.status(409).json({ error: "This record is not a CC-extracted record." });
    }
    if (!existing.verified) {
      return res.status(409).json({ error: "Record is not verified — use the pending endpoint instead." });
    }

    let deletedId: number | null = null;
    await db.transaction(async (tx) => {
      await tx.insert(ccProtocolRemovalsTable).values({
        protocol_id: existing.id,
        removed_by: requesterId,
        removed_at: new Date(),
        region_code: existing.region_code,
        pillar_code: existing.pillar_code,
        subcategory: existing.subcategory,
        rule_cc: existing.rule_cc,
        rule_raw: existing.rule_raw,
        urgency: existing.urgency,
        source_book: existing.source_book,
        source_page: existing.source_page,
      });

      const [row] = await tx
        .delete(cultureProtocolsTable)
        .where(and(
          eq(cultureProtocolsTable.id, id),
          sql`source_book IS NOT NULL`,
          eq(cultureProtocolsTable.verified, true),
        ))
        .returning({ id: cultureProtocolsTable.id });

      if (!row) throw new Error("RACE_CONDITION");
      deletedId = row.id;
    });

    if (!deletedId) {
      return res.status(409).json({ error: "Record not found or no longer verified." });
    }

    return res.json({ ok: true, message: "Verified record permanently removed." });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to delete verified CC protocol");
    return res.status(500).json({ error: "A difficulty arose deleting the record." });
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

// ── Register Calibration ─────────────────────────────────────────────────────
//
// On-demand entry point for the register-calibration worker. Accepts one or
// more translation row IDs, evaluates each against the requested module
// register, and (unless dry_run) writes back the rewritten value plus the
// quality_reviewed_at / calibrated_module stamps.
//
// Designed to be called from any admin CRUD flow that creates or updates
// translation rows for module-content keys (scenario.*, situation.*,
// counsel_advice.*, etc.) so new content receives correct register treatment
// without a manual CLI run.

const CalibrateRequestSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(50),
  module: z.enum(["standard", "elite"]),
  dry_run: z.boolean().optional(),
  force: z.boolean().optional(),
});

// Centralized write path: upserts module-content translation rows AND
// auto-fires register calibration on every row whose key matches a content
// prefix. Any admin CRUD flow that needs to persist a translation row should
// use this endpoint (or import upsertContentTranslationRows directly) instead
// of writing to the translations table by hand, so the manual CLI worker step
// is never required.

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
    const id = parseInt(req.params.id, 10);
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
    const id = parseInt(req.params.id, 10);
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

// ── Onboarding Funnel ────────────────────────────────────────────────────────

/**
 * GET /admin/onboarding-funnel — conversion stats for onboarding step 5
 * (plan choice). Sourced from the onboarding_events table populated by
 * POST /onboarding/plan-choice.
 *
 * Query params:
 *   bucket: "day" | "week"  (default "day") — bucket size for the time series.
 *   days:   integer 1-365   (default 30)    — lookback window in days.
 *
 * Returns:
 *   - totals: how many users reached step 5, breakdown by action
 *     (selected_tier / skipped / skipped_unauth) and by selected tier,
 *     plus how often the recommended tier was followed.
 *   - series: per-bucket counts (reached, by action, recommendation_followed).
 */
router.get("/admin/onboarding-funnel", requireAdmin, async (req, res) => {
  try {
    const bucket = req.query.bucket === "week" ? "week" : "day";
    const daysRaw = Number(req.query.days);
    const days = Number.isFinite(daysRaw) && daysRaw >= 1 && daysRaw <= 365
      ? Math.floor(daysRaw)
      : 30;

    const since = sql`now() - (${days} || ' days')::interval`;
    const evt = onboardingEventsTable;
    const planChoice = and(
      eq(evt.event_type, "plan_choice"),
      sql`${evt.created_at} >= ${since}`,
    );

    const [totalsRow] = await db
      .select({ total: count() })
      .from(evt)
      .where(planChoice);
    const reached = totalsRow?.total ?? 0;

    const actionRows = await db
      .select({ action: evt.action, total: count() })
      .from(evt)
      .where(planChoice)
      .groupBy(evt.action);

    const tierRows = await db
      .select({ tier: evt.tier, total: count() })
      .from(evt)
      .where(and(planChoice, eq(evt.action, "selected_tier")))
      .groupBy(evt.tier);

    const [recRow] = await db
      .select({ followed: count() })
      .from(evt)
      .where(
        and(
          planChoice,
          eq(evt.action, "selected_tier"),
          sql`${evt.tier} IS NOT NULL`,
          sql`${evt.recommended_tier} IS NOT NULL`,
          sql`${evt.tier} = ${evt.recommended_tier}`,
        ),
      );
    const [selectedWithRecRow] = await db
      .select({ total: count() })
      .from(evt)
      .where(
        and(
          planChoice,
          eq(evt.action, "selected_tier"),
          sql`${evt.tier} IS NOT NULL`,
          sql`${evt.recommended_tier} IS NOT NULL`,
        ),
      );

    const bucketExpr = bucket === "week"
      ? sql<string>`to_char(date_trunc('week', ${evt.created_at}), 'YYYY-MM-DD')`
      : sql<string>`to_char(date_trunc('day', ${evt.created_at}), 'YYYY-MM-DD')`;

    const seriesRows = await db
      .select({
        bucket: bucketExpr,
        action: evt.action,
        tier: evt.tier,
        recommended_tier: evt.recommended_tier,
        total: count(),
      })
      .from(evt)
      .where(planChoice)
      .groupBy(bucketExpr, evt.action, evt.tier, evt.recommended_tier)
      .orderBy(bucketExpr);

    type SeriesPoint = {
      bucket: string;
      reached: number;
      selected_tier: number;
      skipped: number;
      skipped_unauth: number;
      recommendation_followed: number;
      recommendation_eligible: number;
    };
    const seriesMap = new Map<string, SeriesPoint>();
    for (const r of seriesRows) {
      const key = r.bucket;
      const point = seriesMap.get(key) ?? {
        bucket: key,
        reached: 0,
        selected_tier: 0,
        skipped: 0,
        skipped_unauth: 0,
        recommendation_followed: 0,
        recommendation_eligible: 0,
      };
      point.reached += r.total;
      if (r.action === "selected_tier") point.selected_tier += r.total;
      else if (r.action === "skipped") point.skipped += r.total;
      else if (r.action === "skipped_unauth") point.skipped_unauth += r.total;
      if (r.action === "selected_tier" && r.tier && r.recommended_tier) {
        point.recommendation_eligible += r.total;
        if (r.tier === r.recommended_tier) point.recommendation_followed += r.total;
      }
      seriesMap.set(key, point);
    }
    const series = Array.from(seriesMap.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));

    const byAction: Record<string, number> = {};
    for (const r of actionRows) byAction[r.action] = r.total;

    const byTier: Record<string, number> = {};
    for (const r of tierRows) byTier[r.tier ?? "unknown"] = r.total;

    return res.json({
      window_days: days,
      bucket,
      totals: {
        reached,
        by_action: byAction,
        by_tier: byTier,
        recommendation_followed: recRow?.followed ?? 0,
        recommendation_eligible: selectedWithRecRow?.total ?? 0,
      },
      series,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: failed to compute onboarding funnel");
    return res.status(500).json({ error: "A difficulty arose computing the onboarding funnel." });
  }
});

// ── Translation Control Panel: Worker Runs ─────────────────────────────────────

/** GET /admin/worker-runs — recent worker run history (last 60 rows) */
router.get("/admin/worker-runs", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(workerRunsTable)
      .orderBy(desc(workerRunsTable.started_at))
      .limit(60);
    return res.json({ ok: true, runs: rows });
  } catch (err) {
    req.log?.error({ err }, "Admin: worker-runs fetch failed");
    return res.status(500).json({ error: "Failed to fetch worker runs." });
  }
});

// ── LTQ Translation Status / Trigger ──────────────────────────────────────────

const SUPPORTED_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"] as const;
type SupportedLang = typeof SUPPORTED_LANGS[number];

/** GET /admin/ltq/translation-status — per-lang + per-register coverage of learning_track_questions */
router.get("/admin/ltq/translation-status", requireAdmin, async (req, res) => {
  try {
    // Total EN questions overall + per register
    const enRow = await db.execute(
      sql`SELECT COUNT(*) AS total FROM learning_track_questions WHERE lang = 'en'`
    );
    const enTotal = Number((enRow.rows[0] as { total: string }).total);

    const enByRegisterRows = await db.execute(
      sql`SELECT register, COUNT(*) AS total
          FROM learning_track_questions
          WHERE lang = 'en'
          GROUP BY register`
    );
    const enByRegister: Record<string, number> = {};
    for (const r of enByRegisterRows.rows as { register: string; total: string }[]) {
      enByRegister[r.register] = Number(r.total);
    }

    // Per-lang overall counts
    const perLangRows = await db.execute(
      sql`SELECT lang, COUNT(*) AS cnt
          FROM learning_track_questions
          WHERE lang != 'en'
          GROUP BY lang
          ORDER BY lang`
    );
    const perLang: Record<string, { count: number; pct: number }> = {};
    for (const row of perLangRows.rows as { lang: string; cnt: string }[]) {
      const n = Number(row.cnt);
      perLang[row.lang] = { count: n, pct: enTotal > 0 ? Math.round((n / enTotal) * 100) : 0 };
    }

    // Per-lang per-register counts
    const perLangRegRows = await db.execute(
      sql`SELECT lang, register, COUNT(*) AS cnt
          FROM learning_track_questions
          WHERE lang != 'en'
          GROUP BY lang, register
          ORDER BY lang, register`
    );
    type RegMap = Record<string, { count: number; pct: number }>;
    const perLangReg: Record<string, RegMap> = {};
    for (const row of perLangRegRows.rows as { lang: string; register: string; cnt: string }[]) {
      if (!perLangReg[row.lang]) perLangReg[row.lang] = {};
      const n = Number(row.cnt);
      const enReg = enByRegister[row.register] ?? 0;
      perLangReg[row.lang][row.register] = {
        count: n,
        pct: enReg > 0 ? Math.round((n / enReg) * 100) : 0,
      };
    }

    // Last run per ltq-translation-* sweeper
    const lastRuns = await db.execute(
      sql`SELECT DISTINCT ON (sweeper) sweeper, started_at, finished_at, items_processed,
             estimated_usd, status, metadata
          FROM worker_runs
          WHERE sweeper LIKE 'ltq-translation-%'
          ORDER BY sweeper, started_at DESC`
    );
    type LastRunRow = { sweeper: string; metadata?: Record<string, unknown> | null; [k: string]: unknown };
    const lastRunByLang: Record<string, LastRunRow> = {};
    for (const r of lastRuns.rows as LastRunRow[]) {
      const lang = r.sweeper.replace("ltq-translation-", "");
      lastRunByLang[lang] = r;
    }

    return res.json({
      ok: true,
      en_total: enTotal,
      en_by_register: enByRegister,
      langs: SUPPORTED_LANGS.map((lang) => {
        const run = lastRunByLang[lang];
        const meta = run?.metadata ?? {};
        const quality_metrics =
          typeof meta.avg_score === "number"
            ? {
                avg_score: meta.avg_score,
                pct_passed: typeof meta.pct_passed === "number" ? meta.pct_passed : null,
                pct_rewritten: typeof meta.pct_rewritten === "number" ? meta.pct_rewritten : null,
              }
            : null;
        return {
          lang,
          ...(perLang[lang] ?? { count: 0, pct: 0 }),
          by_register: perLangReg[lang] ?? {},
          last_run: run ?? null,
          quality_metrics,
        };
      }),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: ltq/translation-status failed");
    return res.status(500).json({ error: "Failed to compute LTQ translation status." });
  }
});

const LtqTranslateSchema = z.object({
  lang: z.enum(SUPPORTED_LANGS).optional(),
  region: z.enum(["AE", "BE"]).optional(),
  register: z.enum(["middle_class", "elite"]).optional(),
  limit: z.number().int().positive().optional(),
  no_quality: z.boolean().optional(),
  parallel: z.number().int().min(1).max(4).optional(),
});

/** POST /admin/ltq/translate — spawn LTQ translation worker in background */
router.post("/admin/ltq/translate", requireAdmin, async (req, res) => {
  const parsed = LtqTranslateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }

  const { lang, region, register, limit, no_quality, parallel } = parsed.data;

  const script = lang
    ? "scripts/translate-learning-track-questions.mjs"
    : "scripts/translate-learning-track-all-langs.mjs";

  const childArgs: string[] = [script];
  if (lang)      { childArgs.push("--lang",     lang); }
  if (region)    { childArgs.push("--region",   region); }
  if (register)  { childArgs.push("--register", register); }
  if (limit)     { childArgs.push("--limit",    String(limit)); }
  if (no_quality){ childArgs.push("--no-quality"); }
  if (!lang && parallel) { childArgs.push("--parallel", String(parallel)); }

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ script, lang, region, register }, "Admin: LTQ translate worker spawned");

  return res.json({
    ok: true,
    message: lang
      ? `LTQ translation worker for [${lang.toUpperCase()}] spawned in background.`
      : `LTQ all-languages orchestrator spawned (parallel=${parallel ?? 1}).`,
    pid: child.pid,
    args: childArgs,
  });
});

// ── Scenario Translation Status / Trigger ─────────────────────────────────────

/** GET /admin/scenarios/translation-status — per-lang coverage of scenario i18n */
router.get("/admin/scenarios/translation-status", requireAdmin, async (req, res) => {
  try {
    const totalRow = await db.execute(
      sql`SELECT COUNT(*) AS total FROM scenarios`
    );
    const total = Number((totalRow.rows[0] as { total: string }).total);

    const perLangRows = await db.execute(
      sql`SELECT lang, COUNT(DISTINCT id) AS cnt
          FROM scenarios,
               LATERAL jsonb_object_keys(COALESCE(title_i18n::jsonb, '{}')) AS lang
          GROUP BY lang
          ORDER BY lang`
    );

    const perLang: Record<string, number> = {};
    for (const r of perLangRows.rows as { lang: string; cnt: string }[]) {
      perLang[r.lang] = Number(r.cnt);
    }

    const lastRun = await db
      .select()
      .from(workerRunsTable)
      .where(eq(workerRunsTable.sweeper, "scenario-translation"))
      .orderBy(desc(workerRunsTable.started_at))
      .limit(1);

    return res.json({
      ok: true,
      total,
      langs: SUPPORTED_LANGS.map((lang) => {
        const n = perLang[lang] ?? 0;
        return { lang, count: n, pct: total > 0 ? Math.round((n / total) * 100) : 0 };
      }),
      last_run: lastRun[0] ?? null,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: scenarios/translation-status failed");
    return res.status(500).json({ error: "Failed to compute scenario translation status." });
  }
});

const ScenarioTranslateSchema = z.object({
  lang: z.enum(SUPPORTED_LANGS).optional(),
  id: z.number().int().positive().optional(),
  force: z.boolean().optional(),
});

/** POST /admin/scenarios/translate — spawn scenario translate worker */
router.post("/admin/scenarios/translate", requireAdmin, async (req, res) => {
  const parsed = ScenarioTranslateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }
  const { lang, id, force } = parsed.data;

  const childArgs = ["scripts/scenario-translate.mjs"];
  if (lang)  { childArgs.push("--lang",  lang); }
  if (id)    { childArgs.push("--id",    String(id)); }
  if (force) { childArgs.push("--force"); }

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ lang, id, force }, "Admin: scenario translate worker spawned");

  return res.json({
    ok: true,
    message: lang
      ? `Scenario translation worker for [${lang.toUpperCase()}] spawned in background.`
      : "Scenario translation worker (all languages) spawned in background.",
    pid: child.pid,
  });
});

// ── Compass Translation Status / Trigger ──────────────────────────────────────

/** GET /admin/compass/translation-status — per-lang coverage of compass_regions.content */
router.get("/admin/compass/translation-status", requireAdmin, async (req, res) => {
  try {
    const totalRow = await db.execute(
      sql`SELECT COUNT(*) AS total FROM compass_regions WHERE is_published = true`
    );
    const total = Number((totalRow.rows[0] as { total: string }).total);

    const perLangRows = await db.execute(
      sql`SELECT lang, COUNT(DISTINCT region_code) AS cnt
          FROM compass_regions,
               LATERAL jsonb_object_keys(COALESCE(content, '{}')) AS lang
          WHERE is_published = true
          GROUP BY lang
          ORDER BY lang`
    );

    const perLang: Record<string, number> = {};
    for (const r of perLangRows.rows as { lang: string; cnt: string }[]) {
      perLang[r.lang] = Number(r.cnt);
    }

    const lastRun = await db
      .select()
      .from(workerRunsTable)
      .where(eq(workerRunsTable.sweeper, "compass-translation"))
      .orderBy(desc(workerRunsTable.started_at))
      .limit(1);

    return res.json({
      ok: true,
      total,
      langs: SUPPORTED_LANGS.map((lang) => {
        const n = perLang[lang] ?? 0;
        return { lang, count: n, pct: total > 0 ? Math.round((n / total) * 100) : 0 };
      }),
      last_run: lastRun[0] ?? null,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: compass/translation-status failed");
    return res.status(500).json({ error: "Failed to compute compass translation status." });
  }
});

const CompassTranslateSchema = z.object({
  lang: z.enum(SUPPORTED_LANGS).optional(),
  region: z.string().optional(),
  force: z.boolean().optional(),
});

/** POST /admin/compass/translate — spawn compass translate worker */
router.post("/admin/compass/translate", requireAdmin, async (req, res) => {
  const parsed = CompassTranslateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }
  const { lang, region, force } = parsed.data;

  const childArgs = ["scripts/translate-compass-content.mjs"];
  if (lang)   { childArgs.push("--lang",   lang); }
  if (region) { childArgs.push("--region", region); }
  if (force)  { childArgs.push("--force"); }

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ lang, region, force }, "Admin: compass translate worker spawned");

  return res.json({
    ok: true,
    message: lang
      ? `Compass translation worker for [${lang.toUpperCase()}] spawned in background.`
      : "Compass translation worker (all languages) spawned in background.",
    pid: child.pid,
  });
});

// ── Counsel Seeds Coverage / Generate ─────────────────────────────────────────

const COUNSEL_DOMAINS = [
  "gastronomy", "business", "eloquence",
  "formal_events", "dress_code", "cultural_knowledge",
] as const;

const COUNSEL_SEED_TOTAL = 206;

/** GET /admin/counsel-seeds/coverage — per-domain coverage of counsel_region_seeds */
router.get("/admin/counsel-seeds/coverage", requireAdmin, async (req, res) => {
  try {
    const perDomainRows = await db.execute(
      sql`SELECT domain,
               COUNT(*) FILTER (WHERE status = 'active')              AS active,
               COUNT(*) FILTER (WHERE status IN ('draft','reviewed'))  AS draft
          FROM counsel_region_seeds
          GROUP BY domain`
    );

    const perDomain: Record<string, { active: number; draft: number }> = {};
    for (const r of perDomainRows.rows as { domain: string; active: string; draft: string }[]) {
      perDomain[r.domain] = { active: Number(r.active), draft: Number(r.draft) };
    }

    const lastRun = await db
      .select()
      .from(workerRunsTable)
      .where(eq(workerRunsTable.sweeper, "counsel-seed"))
      .orderBy(desc(workerRunsTable.started_at))
      .limit(1);

    return res.json({
      ok: true,
      total_regions: COUNSEL_SEED_TOTAL,
      domains: COUNSEL_DOMAINS.map((d) => {
        const counts = perDomain[d] ?? { active: 0, draft: 0 };
        const covered = counts.active + counts.draft;
        return {
          domain: d,
          active: counts.active,
          draft: counts.draft,
          missing: Math.max(0, COUNSEL_SEED_TOTAL - covered),
          pct: Math.round((counts.active / COUNSEL_SEED_TOTAL) * 100),
        };
      }),
      last_run: lastRun[0] ?? null,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: counsel-seeds/coverage failed");
    return res.status(500).json({ error: "Failed to compute counsel seeds coverage." });
  }
});

const CounselSeedGenerateSchema = z.object({
  domain: z.enum(COUNSEL_DOMAINS).optional(),
  force: z.boolean().optional(),
});

/** POST /admin/counsel-seeds/generate — spawn counsel seed batch worker */
router.post("/admin/counsel-seeds/generate", requireAdmin, async (req, res) => {
  const parsed = CounselSeedGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }
  const { domain, force } = parsed.data;

  const childArgs = ["scripts/counsel-seed-batch.mjs"];
  if (domain) { childArgs.push("--domain", domain); }
  if (force)  { childArgs.push("--force"); }

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ domain, force }, "Admin: counsel seed batch worker spawned");

  return res.json({
    ok: true,
    message: domain
      ? `Counsel seed batch worker voor domein [${domain}] gestart.`
      : "Counsel seed batch worker (alle domeinen) gestart.",
    pid: child.pid,
  });
});

// ── Counsel Seeds — Translation Status & Trigger ──────────────────────────────

const COUNSEL_TRANS_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"] as const;
type CounselTransLang = typeof COUNSEL_TRANS_LANGS[number];

const CounselSeedTranslateSchema = z.object({
  lang: z.enum(COUNSEL_TRANS_LANGS),
  batch_size: z.number().int().min(1).max(200).optional(),
  force: z.boolean().optional(),
});

/**
 * GET /admin/counsel-seeds/translation-status
 * Per-language count of active seeds that already have a content_i18n entry.
 */
router.get("/admin/counsel-seeds/translation-status", requireAdmin, async (req, res) => {
  try {
    // Total active seeds
    const totalRows = await db.execute(
      sql`SELECT COUNT(*)::int AS total FROM counsel_region_seeds WHERE status = 'active'`
    );
    const total = Number((totalRows.rows[0] as { total: number })?.total ?? 0);

    // Per-language: count seeds whose content_i18n has an entry for that lang
    const langCounts: Record<string, number> = {};
    for (const lang of COUNSEL_TRANS_LANGS) {
      const r = await db.execute(
        sql`SELECT COUNT(*)::int AS n
            FROM counsel_region_seeds
            WHERE status = 'active'
              AND content_i18n IS NOT NULL
              AND content_i18n->>${lang} IS NOT NULL`
      );
      langCounts[lang] = Number((r.rows[0] as { n: number })?.n ?? 0);
    }

    const lastRun = await db
      .select()
      .from(workerRunsTable)
      .where(eq(workerRunsTable.sweeper, "counsel-seed-translation"))
      .orderBy(desc(workerRunsTable.started_at))
      .limit(1);

    return res.json({
      ok: true,
      total,
      langs: COUNSEL_TRANS_LANGS.map((lang) => ({
        lang,
        count: langCounts[lang] ?? 0,
        pct:   total > 0 ? Math.round(((langCounts[lang] ?? 0) / total) * 100) : 0,
      })),
      last_run: lastRun[0] ?? null,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: counsel-seeds/translation-status failed");
    return res.status(500).json({ error: "Failed to compute counsel seeds translation status." });
  }
});

/**
 * POST /admin/counsel-seeds/translate
 * Spawns scripts/translate-counsel-seeds.mjs for ONE language (manual, no sweeper).
 * Body: { lang: string (required), batch_size?: number, force?: boolean }
 */
router.post("/admin/counsel-seeds/translate", requireAdmin, async (req, res) => {
  const parsed = CounselSeedTranslateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Ongeldige parameters. `lang` is verplicht en moet een van de 9 doeltalen zijn.",
      details: parsed.error.flatten(),
    });
  }
  const { lang, batch_size, force } = parsed.data;

  const childArgs = ["scripts/translate-counsel-seeds.mjs", "--lang", lang];
  if (batch_size) childArgs.push("--batch-size", String(batch_size));
  if (force)      childArgs.push("--force");

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ lang, batch_size, force }, "Admin: counsel seed translation worker spawned");

  return res.json({
    ok:      true,
    message: `Vertaalworker voor Atelier-distillaten [${lang.toUpperCase()}] gestart.`,
    pid:     child.pid,
  });
});

export default router;
