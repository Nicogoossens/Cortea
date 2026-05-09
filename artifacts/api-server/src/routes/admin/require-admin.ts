import { type Request, type Response, type NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractToken } from "../../lib/auth-middleware.js";

const __currentDir = path.dirname(fileURLToPath(import.meta.url));
// In the compiled bundle (dist/index.mjs) __currentDir ends with /dist — 3 levels to workspace root.
// In development (src/routes/admin/*.ts via tsx) it ends with /routes/admin — 5 levels to workspace root.
export const WORKSPACE_ROOT = __currentDir.endsWith("/dist")
  ? path.resolve(__currentDir, "../../../")
  : path.resolve(__currentDir, "../../../../../");

export const SUPPORTED_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    if (!user) {
      res.status(401).json({ error: "The authorisation token is not recognised." });
      return;
    }
    if (user.suspended_at) {
      res.status(403).json({ error: "This account has been suspended. Please contact support." });
      return;
    }
    if (!user.is_admin) {
      res.status(403).json({ error: "This section is restricted to administrators." });
      return;
    }
    (req as Request & { resolvedUserId: string }).resolvedUserId = user.id;
    next();
  } catch {
    res.status(500).json({ error: "A difficulty arose validating your session." });
  }
}
