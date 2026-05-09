import { Router } from "express";
import { spawn } from "child_process";
import { db } from "@workspace/db";
import { workerRunsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin, WORKSPACE_ROOT } from "./require-admin.js";

const router = Router();

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
    const totalRows = await db.execute(
      sql`SELECT COUNT(*)::int AS total FROM counsel_region_seeds WHERE status = 'active'`
    );
    const total = Number((totalRows.rows[0] as { total: number })?.total ?? 0);

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

    type CounselTransRunRow = { sweeper: string; started_at: string; finished_at: string | null; items_processed: number; estimated_usd: number; status: string; metadata?: Record<string, unknown> | null };
    const allRunRows = await db.execute(
      sql`SELECT sweeper, started_at, finished_at, items_processed, estimated_usd, status, metadata
          FROM worker_runs
          WHERE sweeper = 'counsel-seed-translation'
             OR sweeper LIKE 'counsel-seed-translation-%'
          ORDER BY started_at DESC
          LIMIT 100`
    );
    const runByLang: Record<string, CounselTransRunRow> = {};
    const prevRunByLang: Record<string, CounselTransRunRow> = {};
    let globalRun: CounselTransRunRow | null = null;
    let prevGlobalRun: CounselTransRunRow | null = null;
    for (const r of allRunRows.rows as CounselTransRunRow[]) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const metaLang = typeof meta.lang === "string" ? meta.lang : null;
      if (metaLang) {
        if (!runByLang[metaLang]) runByLang[metaLang] = r;
        else if (!prevRunByLang[metaLang]) prevRunByLang[metaLang] = r;
      } else if (!globalRun) {
        globalRun = r;
      } else if (!prevGlobalRun) {
        prevGlobalRun = r;
      }
    }

    const extractCounselTransQuality = (row: CounselTransRunRow | null) => {
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

    const globalQuality = extractCounselTransQuality(globalRun);
    const prevGlobalQuality = extractCounselTransQuality(prevGlobalRun);
    const lastRun = globalRun ?? (Object.values(runByLang)[0] ?? null);

    return res.json({
      ok: true,
      total,
      langs: COUNSEL_TRANS_LANGS.map((lang) => {
        const langRun = runByLang[lang] ?? null;
        const prevLangRun = prevRunByLang[lang] ?? null;
        const quality_metrics = langRun ? extractCounselTransQuality(langRun) : globalQuality;
        const previous_quality_metrics = langRun
          ? (prevLangRun ? extractCounselTransQuality(prevLangRun) : globalQuality)
          : prevGlobalQuality;
        return {
          lang,
          count: langCounts[lang] ?? 0,
          pct:   total > 0 ? Math.round(((langCounts[lang] ?? 0) / total) * 100) : 0,
          quality_metrics,
          previous_quality_metrics,
          last_run: langRun ?? globalRun ?? null,
        };
      }),
      last_run: lastRun ?? null,
    });
  } catch (err) {
    req.log?.error({ err }, "Admin: counsel-seeds/translation-status failed");
    return res.status(500).json({ error: "Failed to compute counsel seeds translation status." });
  }
});

/**
 * POST /admin/counsel-seeds/translate
 * Spawns scripts/translate-counsel-seeds.mjs for ONE language.
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
