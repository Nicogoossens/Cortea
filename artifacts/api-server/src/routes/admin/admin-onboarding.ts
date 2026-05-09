import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingEventsTable } from "@workspace/db";
import { eq, sql, count, and } from "drizzle-orm";
import { requireAdmin } from "./require-admin.js";

const router = Router();

/**
 * GET /admin/onboarding-funnel — conversion stats for onboarding step 5 (plan choice).
 *
 * Query params:
 *   bucket: "day" | "week"  (default "day")
 *   days:   integer 1-365   (default 30)
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

export default router;
