import { Router } from "express";
import { spawn } from "child_process";
import { db } from "@workspace/db";
import { workerRunsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin, WORKSPACE_ROOT, SUPPORTED_LANGS } from "./require-admin.js";

const router = Router();

// ── Translation Control Panel: Weekly Cost Aggregate ──────────────────────────

/** GET /admin/translation/week-cost — total AI spend for translation sweepers in the last 7 days. */
router.get("/admin/translation/week-cost", requireAdmin, async (req, res) => {
  try {
    const result = await db.execute(
      sql`SELECT COALESCE(SUM(estimated_usd), 0)::float8 AS usd
          FROM worker_runs
          WHERE started_at >= NOW() - INTERVAL '7 days'
            AND (
              sweeper LIKE 'ltq-translation%'
              OR sweeper LIKE 'scenario-translation%'
              OR sweeper LIKE 'compass-content-translation%'
              OR sweeper LIKE 'compass-translation%'
              OR sweeper LIKE 'counsel-seed%'
            )`
    );
    const weekUsd = Number((result.rows[0] as { usd: number }).usd ?? 0);
    return res.json({ ok: true, week_usd: weekUsd });
  } catch (err) {
    req.log?.error({ err }, "Admin: translation/week-cost failed");
    return res.status(500).json({ error: "Failed to compute weekly translation cost." });
  }
});

// ── Translation Control Panel: Worker Runs ────────────────────────────────────

/** GET /admin/worker-runs — recent worker run history. */
router.get("/admin/worker-runs", requireAdmin, async (req, res) => {
  try {
    const limitParam = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100) : 50;
    const sweeperFilter = typeof req.query.sweeper === "string" && req.query.sweeper.length > 0
      ? req.query.sweeper : null;
    const langFilter = typeof req.query.lang === "string" && req.query.lang.length > 0
      ? req.query.lang.toLowerCase() : null;
    const activeOnly = req.query.active === "1";

    const whereClause = activeOnly
      ? sweeperFilter && langFilter
        ? sql`sweeper = ${sweeperFilter} AND (LOWER(metadata->>'lang') = ${langFilter} OR LOWER(metadata->>'language') = ${langFilter}) AND finished_at IS NULL AND status = 'running'`
        : sweeperFilter
        ? sql`sweeper LIKE ${sweeperFilter + "%"} AND finished_at IS NULL AND status = 'running'`
        : sql`finished_at IS NULL AND status = 'running'`
      : sweeperFilter && langFilter
        ? sql`sweeper = ${sweeperFilter} AND (LOWER(metadata->>'lang') = ${langFilter} OR LOWER(metadata->>'language') = ${langFilter})`
        : sweeperFilter
        ? sql`sweeper LIKE ${sweeperFilter + "%"}`
        : undefined;

    const query = db
      .select()
      .from(workerRunsTable)
      .where(whereClause)
      .orderBy(desc(workerRunsTable.started_at));

    const rows = activeOnly ? await query : await query.limit(limit);
    return res.json({ ok: true, runs: rows });
  } catch (err) {
    req.log?.error({ err }, "Admin: worker-runs fetch failed");
    return res.status(500).json({ error: "Failed to fetch worker runs." });
  }
});

// ── LTQ Translation Status / Trigger ─────────────────────────────────────────

const LtqTranslateSchema = z.object({
  lang: z.enum(SUPPORTED_LANGS).optional(),
  region_code: z.enum(["AE", "BE"]).optional(),
  register: z.enum(["middle_class", "elite"]).optional(),
  limit: z.number().int().positive().optional(),
  no_quality: z.boolean().optional(),
  parallel: z.number().int().min(1).max(4).optional(),
  target: z.enum(["dev", "prod"]).optional(),
});

/** GET /admin/ltq/translation-status — per-lang + per-register coverage of learning_track_questions. */
router.get("/admin/ltq/translation-status", requireAdmin, async (req, res) => {
  try {
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

    const enByRegionRegisterRows = await db.execute(
      sql`SELECT region_code, register, COUNT(*) AS total
          FROM learning_track_questions
          WHERE lang = 'en'
          GROUP BY region_code, register`
    );
    const enByRegionRegister: Record<string, Record<string, number>> = {};
    for (const r of enByRegionRegisterRows.rows as { region_code: string; register: string; total: string }[]) {
      if (!enByRegionRegister[r.region_code]) enByRegionRegister[r.region_code] = {};
      enByRegionRegister[r.region_code][r.register] = Number(r.total);
    }

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

    const gridRows = await db.execute(
      sql`SELECT lang, region_code, register, COUNT(*) AS cnt
          FROM learning_track_questions
          WHERE lang != 'en'
          GROUP BY lang, region_code, register`
    );
    const grid: Record<string, Record<string, Record<string, { count: number; pct: number }>>> = {};
    for (const row of gridRows.rows as { lang: string; region_code: string; register: string; cnt: string }[]) {
      if (!grid[row.region_code]) grid[row.region_code] = {};
      if (!grid[row.region_code][row.register]) grid[row.region_code][row.register] = {};
      const n = Number(row.cnt);
      const enBase = enByRegionRegister[row.region_code]?.[row.register] ?? 0;
      grid[row.region_code][row.register][row.lang] = {
        count: n,
        pct: enBase > 0 ? Math.round((n / enBase) * 100) : 0,
      };
    }

    const qualRuns = await db.execute(
      sql`SELECT sweeper, metadata, started_at
          FROM worker_runs
          WHERE sweeper LIKE 'ltq-translation-%'
            AND finished_at IS NOT NULL
          ORDER BY started_at DESC
          LIMIT 200`
    );
    type QualRunRow = { sweeper: string; started_at: string; metadata?: Record<string, unknown> | null };
    type QualCell = { avg_score: number; pct_passed: number | null; pct_rewritten: number | null };

    const lastRunByLang: Record<string, QualRunRow> = {};
    const prevRunByLang: Record<string, QualRunRow> = {};
    const rawQual: Record<string, Record<string, Record<string, QualCell>>> = {};

    for (const r of qualRuns.rows as QualRunRow[]) {
      const lang = r.sweeper.replace("ltq-translation-", "");
      if (!lastRunByLang[lang]) {
        lastRunByLang[lang] = r;
      } else if (!prevRunByLang[lang]) {
        prevRunByLang[lang] = r;
      }

      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const avgScore = typeof meta.avg_score === "number" ? meta.avg_score : null;
      if (avgScore === null) continue;

      const runRegion   = typeof meta.region   === "string" ? meta.region   : "__all__";
      const runRegister = typeof meta.register === "string" ? meta.register : "__all__";

      if (!rawQual[runRegion]) rawQual[runRegion] = {};
      if (!rawQual[runRegion][runRegister]) rawQual[runRegion][runRegister] = {};
      if (!rawQual[runRegion][runRegister][lang]) {
        rawQual[runRegion][runRegister][lang] = {
          avg_score: avgScore,
          pct_passed:   typeof meta.pct_passed_first_try === "number" ? meta.pct_passed_first_try : null,
          pct_rewritten: typeof meta.pct_rewritten       === "number" ? meta.pct_rewritten         : null,
        };
      }
    }

    const resolveQual = (region: string, register: string, lang: string): QualCell | null =>
      rawQual[region]?.[register]?.[lang]
      ?? rawQual[region]?.["__all__"]?.[lang]
      ?? rawQual["__all__"]?.[register]?.[lang]
      ?? rawQual["__all__"]?.["__all__"]?.[lang]
      ?? null;

    const REGIONS   = ["BE", "AE"] as const;
    const REGISTERS = ["middle_class", "elite"] as const;
    const gridQuality: Record<string, Record<string, Record<string, QualCell | null>>> = {};
    for (const rgn of REGIONS) {
      gridQuality[rgn] = {};
      for (const reg of REGISTERS) {
        gridQuality[rgn][reg] = {};
        for (const lang of SUPPORTED_LANGS) {
          gridQuality[rgn][reg][lang] = resolveQual(rgn, reg, lang);
        }
      }
    }

    return res.json({
      ok: true,
      en_total: enTotal,
      en_by_register: enByRegister,
      en_by_region_register: enByRegionRegister,
      region_register_grid: grid,
      grid_quality: gridQuality,
      langs: SUPPORTED_LANGS.map((lang) => {
        const run = lastRunByLang[lang];
        const prevRun = prevRunByLang[lang];
        const extractLtqQuality = (r: QualRunRow | undefined) => {
          const m = (r?.metadata ?? {}) as Record<string, unknown>;
          return typeof m.avg_score === "number"
            ? {
                avg_score: m.avg_score,
                pct_passed: typeof m.pct_passed_first_try === "number" ? m.pct_passed_first_try : null,
                pct_rewritten: typeof m.pct_rewritten === "number" ? m.pct_rewritten : null,
              }
            : null;
        };
        return {
          lang,
          ...(perLang[lang] ?? { count: 0, pct: 0 }),
          by_register: perLangReg[lang] ?? {},
          last_run: run ?? null,
          quality_metrics: extractLtqQuality(run),
          previous_quality_metrics: extractLtqQuality(prevRun),
        };
      }),
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: ltq/translation-status failed");
    return res.status(500).json({ error: "Failed to compute LTQ translation status." });
  }
});

/** POST /admin/ltq/translate — spawn LTQ translation worker in background */
router.post("/admin/ltq/translate", requireAdmin, async (req, res) => {
  const parsed = LtqTranslateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }

  const { lang, region_code, register, limit, no_quality, parallel, target } = parsed.data;

  const activeRunRows = lang
    ? await db
        .select({ id: workerRunsTable.id, started_at: workerRunsTable.started_at })
        .from(workerRunsTable)
        .where(sql`sweeper = ${"ltq-translation-" + lang} AND finished_at IS NULL AND status = 'running' AND started_at >= NOW() - INTERVAL '2 hours'`)
        .limit(1)
    : await db
        .select({ id: workerRunsTable.id, started_at: workerRunsTable.started_at })
        .from(workerRunsTable)
        .where(sql`sweeper LIKE 'ltq-translation%' AND finished_at IS NULL AND status = 'running' AND started_at >= NOW() - INTERVAL '2 hours'`)
        .limit(1);
  if (activeRunRows.length > 0) {
    return res.status(409).json({
      ok: false,
      error: lang
        ? `Een vertaalworker voor [${lang.toUpperCase()}] is momenteel actief. Wacht tot die klaar is.`
        : "Er zijn actieve LTQ-vertaalworkers. Wacht tot alle klaar zijn.",
      active_since: activeRunRows[0].started_at,
    });
  }

  const remainingRows = await db.execute(
    lang
      ? sql`SELECT COUNT(*) AS n FROM learning_track_questions WHERE lang = 'en'
            AND id NOT IN (SELECT source_id FROM learning_track_questions WHERE lang = ${lang})
            ${region_code ? sql`AND region_code = ${region_code}` : sql``}
            ${register ? sql`AND register = ${register}` : sql``}`
      : sql`SELECT COALESCE(SUM(missing), 0) AS n FROM (
              SELECT l.lang, COUNT(*) AS missing
              FROM (SELECT unnest(ARRAY['nl','fr','de','es','pt','it','ar','ja','zh']) AS lang) l
              CROSS JOIN learning_track_questions en
              WHERE en.lang = 'en'
                ${region_code ? sql`AND en.region_code = ${region_code}` : sql``}
                ${register   ? sql`AND en.register = ${register}`       : sql``}
                AND NOT EXISTS (SELECT 1 FROM learning_track_questions t WHERE t.lang = l.lang AND t.source_id = en.id)
              GROUP BY l.lang
            ) sub`
  );
  const estimatedQuestions = Number((remainingRows.rows[0] as { n: string }).n ?? 0);
  const LTQ_RATE_PER_MIN = 20;
  const LTQ_COST_PER_ITEM = 0.006;

  const script = lang
    ? "scripts/translate-learning-track-questions.mjs"
    : "scripts/translate-learning-track-all-langs.mjs";

  const childArgs: string[] = [script];
  if (lang)        { childArgs.push("--lang",     lang); }
  if (region_code) { childArgs.push("--region",   region_code); }
  if (register)    { childArgs.push("--register", register); }
  if (limit)       { childArgs.push("--limit",    String(limit)); }
  if (no_quality)  { childArgs.push("--no-quality"); }
  if (!lang && parallel) { childArgs.push("--parallel", String(parallel)); }
  if (target === "prod")  { childArgs.push("--target", "prod"); }

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ script, lang, region_code, register, estimatedQuestions, target }, "Admin: LTQ translate worker spawned");

  return res.json({
    ok: true,
    queued: true,
    message: lang
      ? `LTQ translation worker for [${lang.toUpperCase()}] spawned in background.`
      : `LTQ all-languages orchestrator spawned (parallel=${parallel ?? 1}).`,
    pid: child.pid,
    estimated_questions: estimatedQuestions,
    estimated_usd: Math.round(estimatedQuestions * LTQ_COST_PER_ITEM * 100) / 100,
    estimated_minutes: estimatedQuestions > 0 ? Math.ceil(estimatedQuestions / LTQ_RATE_PER_MIN) : 0,
  });
});

// ── Scenario Translation Status / Trigger ─────────────────────────────────────

const ScenarioTranslateSchema = z.object({
  lang: z.enum(SUPPORTED_LANGS).optional(),
  id: z.number().int().positive().optional(),
  force: z.boolean().optional(),
  target: z.enum(["dev", "prod"]).optional(),
});

/** GET /admin/scenarios/translation-status — per-lang coverage of scenario i18n + quality metrics */
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

    type ScenRunRow = { sweeper: string; started_at: string; metadata?: Record<string, unknown> | null; [k: string]: unknown };
    const allRunRows = await db.execute(
      sql`SELECT sweeper, started_at, finished_at, items_processed, estimated_usd, status, metadata
          FROM worker_runs
          WHERE sweeper = 'scenario-translation'
             OR sweeper LIKE 'scenario-translation-%'
          ORDER BY started_at DESC
          LIMIT 100`
    );
    const runByLang: Record<string, ScenRunRow> = {};
    const prevRunByLang: Record<string, ScenRunRow> = {};
    let orchestratorRun: ScenRunRow | null = null;
    let prevOrchestratorRun: ScenRunRow | null = null;
    for (const r of allRunRows.rows as ScenRunRow[]) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const metaLang = typeof meta.lang === "string" ? meta.lang : null;
      if (metaLang) {
        if (!runByLang[metaLang]) runByLang[metaLang] = r;
        else if (!prevRunByLang[metaLang]) prevRunByLang[metaLang] = r;
      } else if (!orchestratorRun) {
        orchestratorRun = r;
      } else if (!prevOrchestratorRun) {
        prevOrchestratorRun = r;
      }
    }
    const lastRun = orchestratorRun ?? (Object.values(runByLang)[0] ?? null);

    const extractQuality = (row: ScenRunRow | null) => {
      const meta = (row?.metadata ?? {}) as Record<string, unknown>;
      const score = typeof meta.avg_quality_score === "number" ? meta.avg_quality_score
        : typeof meta.avg_score === "number" ? meta.avg_score : null;
      if (score === null) return null;
      return {
        avg_score: score,
        pct_passed: typeof meta.pct_passed_first_try === "number" ? meta.pct_passed_first_try : null,
        pct_rewritten: typeof meta.pct_rewritten === "number" ? meta.pct_rewritten : null,
      };
    };
    const globalQuality = extractQuality(orchestratorRun);
    const prevGlobalQuality = extractQuality(prevOrchestratorRun);

    return res.json({
      ok: true,
      total,
      langs: SUPPORTED_LANGS.map((lang) => {
        const n = perLang[lang] ?? 0;
        const langRun = runByLang[lang] ?? null;
        const prevLangRun = prevRunByLang[lang] ?? null;
        const quality_metrics = langRun ? extractQuality(langRun) : globalQuality;
        const previous_quality_metrics = langRun
          ? (prevLangRun ? extractQuality(prevLangRun) : globalQuality)
          : prevGlobalQuality;
        return {
          lang,
          count: n,
          pct: total > 0 ? Math.round((n / total) * 100) : 0,
          quality_metrics,
          previous_quality_metrics,
          last_run: langRun ?? orchestratorRun ?? null,
        };
      }),
      last_run: lastRun,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: scenarios/translation-status failed");
    return res.status(500).json({ error: "Failed to compute scenario translation status." });
  }
});

/** POST /admin/scenarios/translate — spawn scenario translate worker */
router.post("/admin/scenarios/translate", requireAdmin, async (req, res) => {
  const parsed = ScenarioTranslateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }
  const { lang, id, force, target } = parsed.data;

  const scenActiveRows = await db
    .select({ id: workerRunsTable.id, started_at: workerRunsTable.started_at })
    .from(workerRunsTable)
    .where(sql`sweeper = 'scenario-translation' AND finished_at IS NULL AND status = 'running' AND started_at >= NOW() - INTERVAL '2 hours'`)
    .limit(1);
  if (scenActiveRows.length > 0) {
    return res.status(409).json({
      ok: false,
      error: "Een scenario-vertaalworker voor deze taal is momenteel actief. Wacht tot die klaar is.",
      active_since: scenActiveRows[0].started_at,
    });
  }

  const scenTotalRow = await db.execute(sql`SELECT COUNT(*) AS n FROM scenarios`);
  const scenTotal = Number((scenTotalRow.rows[0] as { n: string }).n ?? 0);
  const scenDoneRow = lang
    ? await db.execute(sql`SELECT COUNT(DISTINCT id) AS n FROM scenarios, LATERAL jsonb_object_keys(COALESCE(title_i18n::jsonb,'{}')) AS k WHERE k = ${lang}`)
    : { rows: [{ n: "0" }] };
  const scenDone = Number((scenDoneRow.rows[0] as { n: string }).n ?? 0);
  const scenRemaining = lang ? Math.max(0, scenTotal - scenDone) : scenTotal * 9;
  const SCEN_RATE_PER_MIN = 15;
  const SCEN_COST_PER_ITEM = 0.005;

  const childArgs = ["scripts/scenario-translate.mjs"];
  if (lang)              { childArgs.push("--lang",   lang); }
  if (id)                { childArgs.push("--id",     String(id)); }
  if (force)             { childArgs.push("--force"); }
  if (target === "prod") { childArgs.push("--target", "prod"); }

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ lang, id, force, scenRemaining, target }, "Admin: scenario translate worker spawned");

  return res.json({
    ok: true,
    queued: true,
    message: lang
      ? `Scenario translation worker for [${lang.toUpperCase()}] spawned in background.`
      : "Scenario translation worker (all languages) spawned in background.",
    pid: child.pid,
    estimated_questions: scenRemaining,
    estimated_usd: Math.round(scenRemaining * SCEN_COST_PER_ITEM * 100) / 100,
    estimated_minutes: scenRemaining > 0 ? Math.ceil(scenRemaining / SCEN_RATE_PER_MIN) : 0,
  });
});

// ── Compass Translation Status / Trigger ──────────────────────────────────────

const CompassTranslateSchema = z.object({
  lang: z.enum(SUPPORTED_LANGS).optional(),
  region: z.string().optional(),
  force: z.boolean().optional(),
  target: z.enum(["dev", "prod"]).optional(),
});

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

    const compassRuns = await db
      .select()
      .from(workerRunsTable)
      .where(sql`sweeper = 'compass-content-translation' OR sweeper LIKE 'compass-content-translation-%'`)
      .orderBy(desc(workerRunsTable.started_at))
      .limit(20);

    type CompassRunRow = { sweeper: string; started_at: string; metadata?: Record<string, unknown> | null; [k: string]: unknown };
    const compassRunByLang: Record<string, CompassRunRow> = {};
    const compassPrevRunByLang: Record<string, CompassRunRow> = {};
    let compassLastRun: CompassRunRow | null = null;
    let compassPrevLastRun: CompassRunRow | null = null;

    for (const r of compassRuns as unknown as CompassRunRow[]) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const metaLang = typeof meta.lang === "string" ? meta.lang : null;
      if (metaLang) {
        if (!compassRunByLang[metaLang]) compassRunByLang[metaLang] = r;
        else if (!compassPrevRunByLang[metaLang]) compassPrevRunByLang[metaLang] = r;
      } else if (!compassLastRun) {
        compassLastRun = r;
      } else if (!compassPrevLastRun) {
        compassPrevLastRun = r;
      }
    }

    const extractCompassQuality = (row: CompassRunRow | null) => {
      const meta = (row?.metadata ?? {}) as Record<string, unknown>;
      const score = typeof meta.avg_quality_score === "number" ? meta.avg_quality_score
        : typeof meta.avg_score === "number" ? meta.avg_score : null;
      if (score === null) return null;
      return {
        avg_score: score,
        pct_passed: typeof meta.pct_passed_first_try === "number" ? meta.pct_passed_first_try : null,
        pct_rewritten: typeof meta.pct_rewritten === "number" ? meta.pct_rewritten : null,
      };
    };

    return res.json({
      ok: true,
      total,
      langs: SUPPORTED_LANGS.map((lang) => {
        const n = perLang[lang] ?? 0;
        const langRun = compassRunByLang[lang] ?? null;
        const prevLangRun = compassPrevRunByLang[lang] ?? null;
        const quality_metrics = langRun ? extractCompassQuality(langRun) : extractCompassQuality(compassLastRun);
        const previous_quality_metrics = langRun
          ? (prevLangRun ? extractCompassQuality(prevLangRun) : extractCompassQuality(compassLastRun))
          : extractCompassQuality(compassPrevLastRun);
        return {
          lang, count: n, pct: total > 0 ? Math.round((n / total) * 100) : 0,
          quality_metrics,
          previous_quality_metrics,
        };
      }),
      last_run: compassLastRun ?? null,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: compass/translation-status failed");
    return res.status(500).json({ error: "Failed to compute compass translation status." });
  }
});

/** POST /admin/compass/translate — spawn compass translate worker */
router.post("/admin/compass/translate", requireAdmin, async (req, res) => {
  const parsed = CompassTranslateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.flatten() });
  }
  const { lang, region, force, target } = parsed.data;

  const compassActiveRows = await db
    .select({ id: workerRunsTable.id, started_at: workerRunsTable.started_at })
    .from(workerRunsTable)
    .where(sql`sweeper = 'compass-content-translation' AND finished_at IS NULL AND status = 'running' AND started_at >= NOW() - INTERVAL '2 hours'`)
    .limit(1);
  if (compassActiveRows.length > 0) {
    return res.status(409).json({
      ok: false,
      error: "Een compass-vertaalworker voor deze taal is momenteel actief. Wacht tot die klaar is.",
      active_since: compassActiveRows[0].started_at,
    });
  }

  const compassTotalRow = await db.execute(sql`SELECT COUNT(*) AS n FROM compass_regions WHERE is_published = true`);
  const compassTotal = Number((compassTotalRow.rows[0] as { n: string }).n ?? 0);
  const compassDoneRow = lang
    ? await db.execute(sql`SELECT COUNT(DISTINCT region_code) AS n FROM compass_regions, LATERAL jsonb_object_keys(COALESCE(content,'{}')) AS k WHERE k = ${lang} AND is_published = true`)
    : { rows: [{ n: "0" }] };
  const compassDone = Number((compassDoneRow.rows[0] as { n: string }).n ?? 0);
  const compassRemaining = lang ? Math.max(0, compassTotal - compassDone) : compassTotal * 9;
  const COMPASS_RATE_PER_MIN = 3;
  const COMPASS_COST_PER_ITEM = 0.011;

  const childArgs = ["scripts/translate-compass-content.mjs"];
  if (lang)              { childArgs.push("--lang",   lang); }
  if (region)            { childArgs.push("--region", region); }
  if (force)             { childArgs.push("--force"); }
  if (target === "prod") { childArgs.push("--target", "prod"); }

  const child = spawn("node", childArgs, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: "ignore",
  });

  req.log?.info({ lang, region, force, compassRemaining, target }, "Admin: compass translate worker spawned");

  return res.json({
    ok: true,
    queued: true,
    message: lang
      ? `Compass translation worker for [${lang.toUpperCase()}] spawned in background.`
      : "Compass translation worker (all languages) spawned in background.",
    pid: child.pid,
    estimated_questions: compassRemaining,
    estimated_usd: Math.round(compassRemaining * COMPASS_COST_PER_ITEM * 100) / 100,
    estimated_minutes: compassRemaining > 0 ? Math.ceil(compassRemaining / COMPASS_RATE_PER_MIN) : 0,
  });
});

export default router;
