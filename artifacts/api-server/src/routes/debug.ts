/**
 * Dev/test-only debug endpoints for automated testing.
 *
 * GATING — these routes are active ONLY when ALL of the following are true:
 *   1. NODE_ENV !== "production"
 *   2. ENABLE_TEST_DEBUG_ROUTES=true  (must be set explicitly)
 *
 * In production neither condition is met, so the routes respond 404.
 * In non-production environments the second condition still requires
 * an explicit opt-in, preventing accidental exposure.
 *
 * Exposed endpoints:
 *   POST /api/debug/issue-redeem-code  — creates (or reuses) a test user
 *                                        and issues a one-time redeem code,
 *                                        allowing e2e tests to exercise the
 *                                        full /oauth-callback?code=<code>
 *                                        flow without going through OAuth.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { issueRedeemCode } from "../lib/redeem-codes";

const router: IRouter = Router();

function isDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_TEST_DEBUG_ROUTES === "true"
  );
}

router.post("/debug/issue-redeem-code", async (req: Request, res: Response) => {
  if (!isDebugEnabled()) {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const {
      email = `test-${randomBytes(4).toString("hex")}@example.com`,
      fullName = "Test User",
      isNewUser = false,
    } = (req.body ?? {}) as { email?: string; fullName?: string; isNewUser?: boolean };

    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    let user = existingUsers[0];

    if (!user) {
      const userId = `user_test_${randomBytes(6).toString("hex")}`;
      const sessionToken = randomBytes(32).toString("hex");
      const [created] = await db
        .insert(usersTable)
        .values({
          id: userId,
          full_name: fullName,
          email,
          email_verified: true,
          session_token: sessionToken,
          noble_score: 0,
          subscription_tier: "guest",
          region_history: [],
          onboarding_completed: !isNewUser,
        })
        .returning();
      user = created;
    }

    const sessionToken = randomBytes(32).toString("hex");
    await db
      .update(usersTable)
      .set({ session_token: sessionToken })
      .where(eq(usersTable.id, user.id));

    const resolvedIsNewUser = typeof isNewUser === "boolean" ? isNewUser : !user.onboarding_completed;

    const code = issueRedeemCode({
      token: sessionToken,
      userId: user.id,
      fullName: user.full_name ?? null,
      isAdmin: user.is_admin ?? false,
      isNewUser: resolvedIsNewUser,
    });

    return res.json({ code, userId: user.id, email: user.email });
  } catch (err) {
    req.log.error({ err }, "debug/issue-redeem-code failed");
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
