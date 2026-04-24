import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

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
 */
export function setSessionCookie(res: Response, token: string): void {
  res.cookie("cortea_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
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
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token provided is not recognised." });
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
