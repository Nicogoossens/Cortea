import express, { Router } from "express";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import { readFileSync } from "fs";
import { db } from "@workspace/db";
import {
  scenariosTable,
  cultureProtocolsTable,
  compassRegionsTable,
  learningTrackQuestionsTable,
  translationsTable,
  type CompassLocaleMap,
} from "@workspace/db";
import { parseCompassMd, scoreContent, type CompassCountryData } from "../../lib/compass-md-parser.js";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { parseLearningTrackMd } from "@workspace/db/parse-learning-track-md";
import { runAtelierSeed } from "@workspace/db/seed";
import { runCompassSeed } from "@workspace/db/seed-compass";
import { eq, sql, count, inArray } from "drizzle-orm";
import { z } from "zod";
import { calibrateI18nMap, type CalibrationModule } from "../../lib/register-calibration.js";
import { requireAdmin, WORKSPACE_ROOT } from "./require-admin.js";

const execAsync = promisify(exec);
const router = Router();

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

/** GET /admin/compass-regions — list every compass region (published + stub). */
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
      const content = (row.content ?? {}) as unknown as Record<string, Record<string, unknown>>;
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
    const regionCode = String(req.params.regionCode).toUpperCase();
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

// ── Granular Seed Endpoints ───────────────────────────────────────────────────

/** POST /admin/content/seed/atelier — seed only Atelier (counsel_region_seeds) */
router.post("/admin/content/seed/atelier", requireAdmin, async (req, res) => {
  try {
    await runAtelierSeed();
    return res.json({ ok: true, results: ["[Atelier] OK"] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, results: [`[Atelier] ERROR: ${msg}`] });
  }
});

/** POST /admin/content/seed/compass — seed only Compass (compass_regions) */
router.post("/admin/content/seed/compass", requireAdmin, async (req, res) => {
  try {
    await runCompassSeed();
    return res.json({ ok: true, results: ["[Compass] OK"] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, results: [`[Compass] ERROR: ${msg}`] });
  }
});

/** POST /admin/content/seed/translations — seed only UI translations */
router.post("/admin/content/seed/translations", requireAdmin, async (req, res) => {
  const results: string[] = [];
  let anyFailed = false;
  try {
    const { stdout, stderr } = await execAsync("node scripts/seed-translations.mjs", {
      cwd: WORKSPACE_ROOT,
      env: { ...process.env },
      timeout: 120_000,
    });
    results.push(`[Translations] OK\n${stdout.trim()}`);
    if (stderr.trim()) results.push(`[Translations] stderr: ${stderr.trim()}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`[Translations] ERROR: ${msg}`);
    anyFailed = true;
  }
  return res.status(anyFailed ? 500 : 200).json({ ok: !anyFailed, results });
});

/** POST /admin/content/seed/admin-account — ensure admin account exists */
router.post("/admin/content/seed/admin-account", requireAdmin, async (req, res) => {
  const results: string[] = [];
  let anyFailed = false;
  try {
    const { stdout, stderr } = await execAsync("node scripts/ensure-admin.mjs", {
      cwd: WORKSPACE_ROOT,
      env: { ...process.env },
      timeout: 30_000,
    });
    results.push(`[Admin] OK\n${stdout.trim()}`);
    if (stderr.trim()) results.push(`[Admin] stderr: ${stderr.trim()}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`[Admin] ERROR: ${msg}`);
    anyFailed = true;
  }
  return res.status(anyFailed ? 500 : 200).json({ ok: !anyFailed, results });
});

// ── Dev-only: Clear tables for fresh import ───────────────────────────────────

const CLEARABLE_TABLES = ["compass_regions", "scenarios", "culture_protocols", "learning_track_questions"] as const;
type ClearableTable = typeof CLEARABLE_TABLES[number];

const ClearTableSchema = z.object({
  table: z.enum(CLEARABLE_TABLES),
  confirm: z.literal("CLEAR"),
});

/** DELETE /admin/content/clear — wipe a single content table (DEV ONLY). */
router.delete("/admin/content/clear", requireAdmin, async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "This endpoint is not available in production." });
  }
  const parsed = ClearTableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid body. Provide { table: \"compass_regions\" | \"scenarios\" | \"culture_protocols\" | \"learning_track_questions\", confirm: \"CLEAR\" }.",
      details: parsed.error.flatten(),
    });
  }
  const { table } = parsed.data;
  const tableMap: Record<ClearableTable, string> = {
    compass_regions: "compass_regions",
    scenarios: "scenarios",
    culture_protocols: "culture_protocols",
    learning_track_questions: "learning_track_questions",
  };
  const tableName = tableMap[table];
  try {
    const result = await db.execute(sql.raw(`DELETE FROM ${tableName}`));
    const deleted = (result as { rowCount?: number }).rowCount ?? 0;
    req.log?.info({ table: tableName, deleted }, "Admin: table cleared (dev only)");
    return res.json({ ok: true, table: tableName, deleted });
  } catch (err) {
    req.log?.error({ err, table: tableName }, "Admin: failed to clear table");
    return res.status(500).json({ error: `Failed to clear ${tableName}.` });
  }
});

// ── Compass Import from Google Drive / Local MD files ─────────────────────────

const CompassDriveImportSchema = z.object({
  file_ids: z.array(z.string().min(1)).optional(),
  force_overwrite: z.boolean().optional().default(false),
});

const COMPASS_DRIVE_FOLDER_ID = "11ZBpySd49lF-vrXnLixfHtxLtJCTLQ5W";

function getDriveConnector(): ReplitConnectors {
  if (!process.env.REPLIT_CONNECTORS_HOSTNAME || !process.env.REPL_IDENTITY) {
    throw new Error(
      "Replit connector env vars not available (REPLIT_CONNECTORS_HOSTNAME / REPL_IDENTITY). " +
      "Ensure the google-drive connector is active in the Replit environment."
    );
  }
  return new ReplitConnectors();
}

async function listCompassDriveFiles(): Promise<Array<{ id: string; name: string }>> {
  const connectors = getDriveConnector();
  const q = encodeURIComponent(`'${COMPASS_DRIVE_FOLDER_ID}' in parents`);
  const fields = encodeURIComponent("files(id,name,mimeType)");
  const resp = await connectors.proxy(
    "google-drive",
    `/drive/v3/files?q=${q}&fields=${fields}&pageSize=50`,
    { method: "GET" }
  );
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Drive folder listing failed (${resp.status}): ${body}`);
  }
  const data = (await resp.json()) as { files?: Array<{ id: string; name: string; mimeType: string }> };
  return (data.files ?? [])
    .filter((f) => f.mimeType === "text/markdown" || f.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchDriveFile(fileId: string): Promise<string> {
  const connectors = getDriveConnector();
  const resp = await connectors.proxy(
    "google-drive",
    `/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { method: "GET" }
  );
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Drive proxy ${resp.status} for file ${fileId}: ${body}`);
  }
  return resp.text();
}

/** POST /admin/content/import-compass-from-drive */
router.post("/admin/content/import-compass-from-drive", requireAdmin, async (req, res) => {
  const parsed = CompassDriveImportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }
  const { file_ids, force_overwrite } = parsed.data;

  const mdTexts: string[] = [];
  const sources: string[] = [];
  const fetchErrors: string[] = [];

  let resolvedFileIds: Array<{ id: string; name: string }>;
  if (file_ids && file_ids.length > 0) {
    resolvedFileIds = file_ids.map((id) => ({ id, name: id }));
  } else {
    try {
      resolvedFileIds = await listCompassDriveFiles();
      req.log?.info({ count: resolvedFileIds.length, folder: COMPASS_DRIVE_FOLDER_ID }, "Admin: auto-discovered Drive files");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(502).json({
        ok: false,
        error: `Failed to list Drive folder "${COMPASS_DRIVE_FOLDER_ID}": ${msg}`,
      });
    }
    if (resolvedFileIds.length === 0) {
      return res.status(404).json({ error: `No markdown files found in Drive folder "${COMPASS_DRIVE_FOLDER_ID}".` });
    }
  }

  for (const { id, name } of resolvedFileIds) {
    try {
      const content = await fetchDriveFile(id);
      mdTexts.push(content);
      sources.push(`drive:${name}(${id})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      fetchErrors.push(msg);
      req.log?.warn({ id, name, err: msg }, "Admin: failed to fetch Drive file");
    }
  }
  if (mdTexts.length === 0) {
    return res.status(502).json({
      ok: false,
      error: "Failed to fetch any files from Google Drive.",
      fetch_errors: fetchErrors,
    });
  }

  const { countries, skipped, errors: parseErrors } = parseCompassMd(mdTexts);
  if (countries.length === 0) {
    return res.status(422).json({
      ok: false,
      error: "Parsed 0 countries. Check that the files follow the Compass markdown format.",
      sources,
      skipped,
      parse_errors: parseErrors,
    });
  }

  let imported = 0;
  let updated_existing = 0;
  let skipped_quality = 0;
  const upsertErrors: string[] = [];

  for (const country of countries) {
    try {
      const enGbContent = country.content_en_gb;

      if (force_overwrite) {
        await db
          .insert(compassRegionsTable)
          .values({
            region_code: country.region_code,
            flag_emoji: country.flag_emoji,
            content: { "en-GB": enGbContent } as CompassLocaleMap,
            is_published: true,
          })
          .onConflictDoUpdate({
            target: compassRegionsTable.region_code,
            set: {
              content: { "en-GB": enGbContent } as CompassLocaleMap,
              flag_emoji: country.flag_emoji,
              is_published: true,
            },
          })
          .returning({ region_code: compassRegionsTable.region_code });
        updated_existing++;
      } else {
        const insertResult = await db
          .insert(compassRegionsTable)
          .values({
            region_code: country.region_code,
            flag_emoji: country.flag_emoji,
            content: { "en-GB": enGbContent } as CompassLocaleMap,
            is_published: true,
          })
          .onConflictDoNothing({ target: compassRegionsTable.region_code })
          .returning({ region_code: compassRegionsTable.region_code });

        if (insertResult.length > 0) {
          imported++;
        } else {
          const existing = await db.execute(
            sql`SELECT content->'en-GB' AS en_gb FROM compass_regions WHERE region_code = ${country.region_code} LIMIT 1`
          );
          const existingEnGb = (existing.rows[0] as { en_gb: CompassCountryData["content_en_gb"] | null })?.en_gb;

          const incomingScore = scoreContent(enGbContent);
          const existingScore = existingEnGb ? scoreContent(existingEnGb) : -1;

          if (incomingScore > existingScore) {
            await db.execute(
              sql`UPDATE compass_regions
                  SET content    = jsonb_set(COALESCE(content, '{}'), '{en-GB}', ${JSON.stringify(enGbContent)}::jsonb),
                      flag_emoji = ${country.flag_emoji},
                      is_published = true
                  WHERE region_code = ${country.region_code}`
            );
            updated_existing++;
          } else {
            skipped_quality++;
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      upsertErrors.push(`${country.region_code}: ${msg}`);
    }
  }

  const verifyRow = await db.execute(
    sql`SELECT COUNT(*) AS n FROM compass_regions WHERE is_published = true`
  );
  const publishedCount = Number((verifyRow.rows[0] as { n: string }).n ?? 0);

  req.log?.info({ imported, updated_existing, publishedCount, sources }, "Admin: compass import from Drive/local complete");

  return res.json({
    ok: true,
    sources,
    parsed_countries: countries.length,
    imported_new: imported,
    updated_existing,
    skipped_quality_preserved: skipped_quality,
    skipped_unknown: skipped.length,
    skipped,
    parse_errors: parseErrors,
    upsert_errors: upsertErrors,
    fetch_errors: fetchErrors,
    published_count_after: publishedCount,
    merge_safe: !force_overwrite,
  });
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
      answer_tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
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
      message: "content must contain at least one locale key (e.g. 'en-GB') with the etiquette fields filled in.",
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
    let ltqTranslationQueued = false;

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

                const perFieldResult: Record<string, string> = {};
                for (const [field, text] of Object.entries(fieldMap)) {
                  if (!text) continue;
                  const r = await calibrateI18nMap({ [locale]: text }, module);
                  perFieldResult[field] = r.calibrated[locale] ?? text;
                  if (r.changed) anyChanged = true;
                }

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

      if (inserted > 0) {
        spawn(
          "node",
          ["scripts/translate-learning-track-all-langs.mjs", "--parallel", "2"],
          { cwd: WORKSPACE_ROOT, env: { ...process.env }, stdio: "ignore" },
        );
        ltqTranslationQueued = true;
        req.log?.info({ inserted }, "Admin: LTQ all-languages translation worker spawned");
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
      ...(ltqTranslationQueued && {
        translation_queued: true,
        translation_estimated_usd: Math.round(inserted * 9 * 0.008 * 100) / 100,
        translation_note: "LTQ translations into 9 target languages (nl + 8 doeltalen) are being generated in the background (2 parallel workers, register-aware prompts + inline quality evaluation). This may take several minutes per language.",
      }),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: import failed");
    return res.status(500).json({ error: "A difficulty arose during bulk import." });
  }
});

// ── Learning Track MD Import ──────────────────────────────────────────────────

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

export default router;
