import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import {
  waitlistSignupsTable,
  usersTable,
  FOUNDER_SPOTS_TOTAL,
  WAITLIST_SEGMENTS,
} from "@workspace/db";
import { and, eq, isNotNull, sql, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { sendWaitlistConfirmationEmail, sendWaitlistInvitationEmail } from "../lib/email";
import { extractToken } from "../lib/auth-middleware";
import { logger } from "../lib/logger";

const router = Router();

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
    if (!user || user.suspended_at !== null) {
      res.status(401).json({ error: "Invalid session." });
      return;
    }
    if (!user.is_admin) {
      res.status(403).json({ error: "Administrator access is required." });
      return;
    }
    next();
  } catch (err) {
    logger.error({ err }, "Admin check failed in waitlist route");
    res.status(500).json({ error: "Authentication check failed." });
  }
}

function generateFounderCode(): string {
  // 8-char base32-ish unique code, e.g. FNDR-A3F9K2L8
  const raw = crypto.randomBytes(6).toString("base64").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8);
  return `FNDR-${raw.padEnd(8, "X")}`;
}

const signupSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(120),
  segment: z.enum(WAITLIST_SEGMENTS),
  locale: z.string().max(10).optional(),
});

/**
 * GET /api/waitlist/stats — public counter for the live "X of 100" display.
 */
router.get("/waitlist/stats", async (_req, res) => {
  try {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlistSignupsTable)
      .where(isNotNull(waitlistSignupsTable.founder_code));
    const claimed = Number(rows[0]?.count ?? 0);
    return res.json({
      claimed,
      total: FOUNDER_SPOTS_TOTAL,
      remaining: Math.max(0, FOUNDER_SPOTS_TOTAL - claimed),
    });
  } catch (err) {
    logger.error({ err }, "Failed to load waitlist stats");
    return res.status(500).json({ error: "Unable to load waitlist stats." });
  }
});

/**
 * POST /api/waitlist — public signup. Idempotent on email: if the same email
 * signs up twice we return the existing record (and existing founder code).
 *
 * The first FOUNDER_SPOTS_TOTAL signups receive a unique founder_code. Once
 * the cap is reached subsequent signups are saved without a code (regular
 * waitlist) — they still receive a confirmation email.
 */
router.post("/waitlist", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please provide a valid name, email, and segment." });
  }
  const { email, name, segment, locale } = parsed.data;
  const normalisedEmail = email.trim().toLowerCase();

  try {
    let signup;
    let isNew = false;
    await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(waitlistSignupsTable)
        .where(sql`lower(${waitlistSignupsTable.email}) = ${normalisedEmail}`)
        .limit(1);

      if (existing.length > 0) {
        signup = existing[0];
        return;
      }

      // Lock the table for the count + insert sequence to avoid >100 codes.
      await tx.execute(sql`LOCK TABLE ${waitlistSignupsTable} IN SHARE ROW EXCLUSIVE MODE`);

      const countRows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(waitlistSignupsTable)
        .where(isNotNull(waitlistSignupsTable.founder_code));
      const claimed = Number(countRows[0]?.count ?? 0);

      let founderCode: string | null = null;
      let founderPosition: number | null = null;
      if (claimed < FOUNDER_SPOTS_TOTAL) {
        founderCode = generateFounderCode();
        founderPosition = claimed + 1;
      }

      const [inserted] = await tx
        .insert(waitlistSignupsTable)
        .values({
          email: normalisedEmail,
          name: name.trim(),
          segment,
          locale: locale ?? "en",
          founder_code: founderCode,
          founder_position: founderPosition,
        })
        .returning();
      signup = inserted;
      isNew = true;
    });

    if (!signup) {
      return res.status(500).json({ error: "Unable to record your signup at this time." });
    }

    if (isNew) {
      try {
        await sendWaitlistConfirmationEmail({
          to: signup.email,
          name: signup.name,
          founderCode: signup.founder_code,
          founderPosition: signup.founder_position,
          locale: signup.locale,
        });
      } catch (err) {
        logger.error({ err, email: signup.email }, "Failed to send waitlist confirmation email");
      }
    }

    return res.json({
      email: signup.email,
      name: signup.name,
      segment: signup.segment,
      founderCode: signup.founder_code,
      founderPosition: signup.founder_position,
      hasFounderCode: !!signup.founder_code,
    });
  } catch (err) {
    logger.error({ err, email: normalisedEmail }, "Waitlist signup failed");
    return res.status(500).json({ error: "Unable to record your signup at this time." });
  }
});

/**
 * GET /api/admin/waitlist — paginated list with optional segment filter.
 */
router.get("/admin/waitlist", requireAdmin, async (req, res) => {
  try {
    const segment = typeof req.query.segment === "string" ? req.query.segment : null;
    const conditions = segment && (WAITLIST_SEGMENTS as readonly string[]).includes(segment)
      ? [eq(waitlistSignupsTable.segment, segment)]
      : [];
    const rows = await db
      .select()
      .from(waitlistSignupsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(waitlistSignupsTable.created_at))
      .limit(1000);

    const totals = await db
      .select({
        segment: waitlistSignupsTable.segment,
        count: sql<number>`count(*)::int`,
      })
      .from(waitlistSignupsTable)
      .groupBy(waitlistSignupsTable.segment);

    const founderRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlistSignupsTable)
      .where(isNotNull(waitlistSignupsTable.founder_code));

    return res.json({
      signups: rows,
      totalsBySegment: totals,
      founderClaimed: Number(founderRows[0]?.count ?? 0),
      founderTotal: FOUNDER_SPOTS_TOTAL,
    });
  } catch (err) {
    logger.error({ err }, "Failed to load admin waitlist");
    return res.status(500).json({ error: "Unable to load the waitlist." });
  }
});

/**
 * GET /api/admin/waitlist/export.csv — full export.
 */
router.get("/admin/waitlist/export.csv", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(waitlistSignupsTable).orderBy(desc(waitlistSignupsTable.created_at));
    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = ["id", "email", "name", "segment", "locale", "founder_code", "founder_position", "created_at", "invited_at", "claimed_at"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        r.id, r.email, r.name, r.segment, r.locale, r.founder_code ?? "",
        r.founder_position ?? "", r.created_at?.toISOString() ?? "",
        r.invited_at?.toISOString() ?? "", r.claimed_at?.toISOString() ?? "",
      ].map(escape).join(","));
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="cortea-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(lines.join("\n"));
  } catch (err) {
    logger.error({ err }, "Failed to export waitlist CSV");
    return res.status(500).json({ error: "Unable to export the waitlist." });
  }
});

/**
 * POST /api/admin/waitlist/:id/invite — send (or resend) an invitation email.
 */
router.post("/admin/waitlist/:id/invite", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
    const [signup] = await db.select().from(waitlistSignupsTable).where(eq(waitlistSignupsTable.id, id)).limit(1);
    if (!signup) return res.status(404).json({ error: "Signup not found." });

    try {
      await sendWaitlistInvitationEmail({
        to: signup.email,
        name: signup.name,
        founderCode: signup.founder_code,
        locale: signup.locale,
      });
    } catch (err) {
      logger.error({ err, email: signup.email }, "Failed to send waitlist invitation");
      return res.status(500).json({ error: "Unable to send the invitation email." });
    }

    await db
      .update(waitlistSignupsTable)
      .set({ invited_at: new Date() })
      .where(eq(waitlistSignupsTable.id, id));

    return res.json({ message: "Invitation sent." });
  } catch (err) {
    logger.error({ err }, "Failed to send waitlist invitation");
    return res.status(500).json({ error: "Unable to send the invitation." });
  }
});

/**
 * Internal helper used by the subscription/checkout flow to look up an
 * unredeemed founder code for the given email. Returns the code or null.
 */
export async function getFounderCodeForEmail(email: string | null | undefined): Promise<string | null> {
  if (!email) return null;
  const normalised = email.trim().toLowerCase();
  const [row] = await db
    .select({ code: waitlistSignupsTable.founder_code })
    .from(waitlistSignupsTable)
    .where(
      and(
        sql`lower(${waitlistSignupsTable.email}) = ${normalised}`,
        isNotNull(waitlistSignupsTable.founder_code),
        isNull(waitlistSignupsTable.claimed_at),
      ),
    )
    .limit(1);
  return row?.code ?? null;
}

/**
 * Mark a founder code as redeemed and link to a user. Called from the
 * Stripe webhook once the Traveller subscription is active. If a specific
 * founderCode is supplied (from subscription metadata) it is matched
 * exactly to harden the redemption linkage; otherwise we fall back to
 * email + unclaimed lookup for legacy/missing-metadata paths.
 */
export async function markFounderCodeRedeemed(
  email: string,
  userId: string,
  founderCode?: string | null,
): Promise<void> {
  const normalised = email.trim().toLowerCase();
  const conditions = [
    sql`lower(${waitlistSignupsTable.email}) = ${normalised}`,
    isNotNull(waitlistSignupsTable.founder_code),
    isNull(waitlistSignupsTable.claimed_at),
  ];
  if (founderCode) conditions.push(eq(waitlistSignupsTable.founder_code, founderCode));
  await db
    .update(waitlistSignupsTable)
    .set({ claimed_at: new Date(), claimed_user_id: userId })
    .where(and(...conditions));
}

export default router;
