import { Router, type IRouter, type Request, type Response } from "express";
import { redeemCodes, pruneExpiredCodes } from "../lib/redeem-codes";
import { setSessionCookie } from "../lib/auth-middleware";

const router: IRouter = Router();

/**
 * GET /api/auth/redeem?code=<code>
 * Single-use endpoint: exchanges a one-time redemption code for the session token.
 * The code is deleted immediately after use (or on expiry).
 * Used by both the Google OAuth callback flow and any future SSO flows.
 */
router.get("/auth/redeem", (req: Request, res: Response) => {
  pruneExpiredCodes();
  const code = typeof req.query.code === "string" ? req.query.code : null;

  if (!code) {
    res.status(400).json({ error: "Missing redemption code." });
    return;
  }

  const entry = redeemCodes.get(code);
  if (!entry || entry.expiresAt <= Date.now()) {
    redeemCodes.delete(code as string);
    res.status(401).json({ error: "The redemption code is invalid or has expired." });
    return;
  }

  redeemCodes.delete(code);

  setSessionCookie(res, entry.token);

  res.json({
    userId: entry.userId,
    fullName: entry.fullName,
    isAdmin: entry.isAdmin,
    isNewUser: entry.isNewUser,
  });
});

export default router;
