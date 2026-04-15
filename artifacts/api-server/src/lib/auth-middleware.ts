import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  resolvedUserId: string;
}

/**
 * Resolves the caller from `Authorization: Bearer <session_token>`.
 * No fallback identity — always requires a valid token.
 */
export async function requireAuthUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const token = authHeader.slice(7).trim();
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
