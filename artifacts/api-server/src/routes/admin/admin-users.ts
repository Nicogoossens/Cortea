import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { usersTable, nobleScoreLogTable, zuil_voortgangTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, count } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "./require-admin.js";

const router = Router();

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

    async function groupBreakdown(colName: string) {
      const result = await db.execute(
        sql.raw(
          `SELECT ${colName} AS value, COUNT(*) AS total FROM users WHERE ${colName} IS NOT NULL GROUP BY ${colName} ORDER BY COUNT(*) DESC LIMIT 50`
        )
      );
      return (result.rows as { value: string | null; total: string }[])
        .map((r) => ({ value: r.value ?? "(none)", count: Number(r.total) }));
    }

    const [bySource, byMedium, byCampaign, byContent, byTerm] = await Promise.all([
      groupBreakdown("utm_source"),
      groupBreakdown("utm_medium"),
      groupBreakdown("utm_campaign"),
      groupBreakdown("utm_content"),
      groupBreakdown("utm_term"),
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

export default router;
