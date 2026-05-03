import { Router } from "express";
import { db } from "@workspace/db";
import { invitationsTable, companionLinksTable, usersTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import crypto from "crypto";

const router = Router();

router.get("/invitations/sent", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const rows = await db
      .select({
        id: invitationsTable.id,
        token: invitationsTable.token,
        status: invitationsTable.status,
        expires_at: invitationsTable.expires_at,
        created_at: invitationsTable.created_at,
        invitee_id: invitationsTable.invitee_id,
        invitee_name: usersTable.full_name,
        invitee_username: usersTable.username,
      })
      .from(invitationsTable)
      .leftJoin(usersTable, eq(usersTable.id, invitationsTable.invitee_id))
      .where(eq(invitationsTable.inviter_id, userId))
      .orderBy(desc(invitationsTable.created_at));

    const now = new Date();
    const invitations = rows.map((r) => {
      let status = r.status;
      if (status === "pending" && r.expires_at && now > r.expires_at) status = "expired";
      return {
        id: r.id,
        token: r.token,
        status,
        expires_at: r.expires_at,
        created_at: r.created_at,
        invitee_name: r.invitee_name ?? r.invitee_username ?? null,
      };
    });

    return res.json({ invitations });
  } catch (err) {
    req.log.error({ err }, "Failed to list sent invitations");
    return res.status(500).json({ error: "Unable to load invitations." });
  }
});

router.delete("/invitations/:token", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const { token } = req.params;

    const [invitation] = await db.select().from(invitationsTable).where(eq(invitationsTable.token, token)).limit(1);
    if (!invitation) return res.status(404).json({ error: "Invitation not found." });
    if (invitation.inviter_id !== userId) return res.status(403).json({ error: "You may only revoke your own invitations." });
    if (invitation.status !== "pending") return res.status(400).json({ error: "Only pending invitations can be revoked." });

    await db.update(invitationsTable)
      .set({ status: "revoked" })
      .where(eq(invitationsTable.token, token));

    return res.json({ message: "Invitation revoked." });
  } catch (err) {
    req.log.error({ err }, "Failed to revoke invitation");
    return res.status(500).json({ error: "Unable to revoke invitation." });
  }
});

router.post("/invitations/generate", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "Profile not found." });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invitation] = await db.insert(invitationsTable).values({
      token,
      inviter_id: userId,
      status: "pending",
      expires_at: expiresAt,
    }).returning();

    return res.json({ token: invitation.token, expires_at: invitation.expires_at });
  } catch (err) {
    req.log.error({ err }, "Failed to generate invitation");
    return res.status(500).json({ error: "Unable to generate invitation at this time." });
  }
});

router.get("/invitations/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [invitation] = await db.select().from(invitationsTable).where(eq(invitationsTable.token, token)).limit(1);
    if (!invitation) return res.status(404).json({ error: "This invitation link is not recognised." });

    if (invitation.status !== "pending") {
      return res.status(410).json({ error: "This invitation has already been used.", status: invitation.status });
    }

    if (new Date() > invitation.expires_at) {
      return res.status(410).json({ error: "This invitation has expired.", status: "expired" });
    }

    const [inviter] = await db
      .select({ full_name: usersTable.full_name, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, invitation.inviter_id))
      .limit(1);

    return res.json({
      token: invitation.token,
      status: invitation.status,
      expires_at: invitation.expires_at,
      inviter_name: inviter?.full_name ?? inviter?.username ?? "A member",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch invitation");
    return res.status(500).json({ error: "Unable to retrieve invitation details." });
  }
});

const RedeemSchema = z.object({ token: z.string().min(1) });

router.post("/invitations/redeem", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const parsed = RedeemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Token is required." });

    const { token } = parsed.data;

    const [invitation] = await db.select().from(invitationsTable).where(eq(invitationsTable.token, token)).limit(1);
    if (!invitation) return res.status(404).json({ error: "Invitation not found." });
    if (invitation.status !== "pending") return res.status(410).json({ error: "This invitation has already been used." });
    if (new Date() > invitation.expires_at) return res.status(410).json({ error: "This invitation has expired." });
    if (invitation.inviter_id === userId) return res.status(400).json({ error: "You cannot accept your own invitation." });

    await db.update(invitationsTable)
      .set({ status: "accepted", invitee_id: userId })
      .where(eq(invitationsTable.token, token));

    const existing = await db.select().from(companionLinksTable)
      .where(
        or(
          and(eq(companionLinksTable.user_a_id, invitation.inviter_id), eq(companionLinksTable.user_b_id, userId)),
          and(eq(companionLinksTable.user_a_id, userId), eq(companionLinksTable.user_b_id, invitation.inviter_id)),
        )
      ).limit(1);

    if (existing.length === 0) {
      await db.insert(companionLinksTable).values({
        user_a_id: invitation.inviter_id,
        user_b_id: userId,
        share_progress_a: true,
        share_progress_b: true,
      });
    }

    return res.json({ message: "Invitation accepted. You are now connected as companions." });
  } catch (err) {
    req.log.error({ err }, "Failed to redeem invitation");
    return res.status(500).json({ error: "Unable to redeem invitation at this time." });
  }
});

export default router;
