import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import type { SubscriptionTier } from "./tier-features";

export interface AuthenticatedRequest extends Request {
  resolvedUserId: string;
}

/**
 * Extracts the session token from the request.
 * Reads the HttpOnly cookie first (cortea_session), then falls back to
 * the Authorization: Bearer header for backwards compatibility.
 */
export function extractToken(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string | undefined>)?.cortea_session;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  return null;
}

/**
 * Sets the session cookie on the response.
 * HttpOnly prevents JavaScript access; Secure ensures HTTPS-only in production.
 * SameSite=None is required because the app is embedded as an iframe in the
 * Replit workspace canvas (replit.com), which is a different eTLD+1 from the
 * app host (worf.replit.dev). SameSite=Strict or Lax would block cookies in
 * that cross-site iframe context.
 *
 * CSRF is mitigated by the origin-check middleware in app.ts (double-submit
 * origin guard): every state-changing request (POST/PUT/PATCH/DELETE) that
 * carries an Origin header must match the CORS allowlist. Unauthenticated
 * server-to-server calls without an Origin header bypass the guard safely.
 */
export function setSessionCookie(res: Response, token: string): void {
  res.cookie("cortea_session", token, {
    httpOnly: true,
    secure: true,      // Always true — Replit always serves over HTTPS
    sameSite: "none",  // Required for cross-site iframe (Replit canvas)
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie("cortea_session", { path: "/" });
}

/**
 * Resolves the caller from either:
 *   1. HttpOnly cookie cortea_session (preferred, XSS-safe)
 *   2. Authorization: Bearer <session_token> header (fallback)
 * No fallback identity — always requires a valid token.
 */
export async function requireAuthUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const [user] = await db
      .select({ id: usersTable.id, suspended_at: usersTable.suspended_at })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token provided is not recognised." });
      return;
    }
    if (user.suspended_at !== null) {
      res.status(403).json({ error: "Your account has been suspended. Please contact support." });
      return;
    }
    (req as AuthenticatedRequest).resolvedUserId = user.id;
    next();
  } catch {
    res.status(500).json({ error: "A difficulty arose validating your session." });
  }
}

export function getResolvedUserId(req: Request): string {
  return (req as AuthenticatedRequest).resolvedUserId;
}

/**
 * Resolves the authenticated user's subscription tier and active region from the
 * session token, if present. Returns null when the request is unauthenticated.
 * Used by routes that need optional-auth tier enforcement.
 */
export async function resolveUserTier(req: Request): Promise<{
  id: string;
  subscription_tier: SubscriptionTier;
  active_region: string | null;
} | null> {
  const token = extractToken(req);
  if (!token) return null;
  const [user] = await db
    .select({
      id: usersTable.id,
      subscription_tier: usersTable.subscription_tier,
      active_region: usersTable.active_region,
      suspended_at: usersTable.suspended_at,
    })
    .from(usersTable)
    .where(eq(usersTable.session_token, token))
    .limit(1);
  if (!user || user.suspended_at !== null) return null;
  return {
    id: user.id,
    subscription_tier: (user.subscription_tier ?? "guest") as SubscriptionTier,
    active_region: user.active_region ?? null,
  };
}
