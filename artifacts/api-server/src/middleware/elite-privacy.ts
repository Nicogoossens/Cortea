/**
 * Elite-privacy enforcement — Master Framework v1.1 §12.
 *
 * When a user has `elite_privacy_mode = true`, the following fields must
 * NEVER appear in public API responses or be written to by public routes:
 *   - noble_score
 *   - wardrobe_unlocks
 *   - Compass scores (attentiveness, composure, discernment, diplomacy, presence)
 *   - compass_history rows
 *   - badges earned
 *
 * Usage:
 *   import { enforceElitePrivacy, stripPrivateFields } from "...";
 *
 *   // In a route handler, after loading the user row:
 *   const privacyErr = enforceElitePrivacy(user, "write");
 *   if (privacyErr) return res.status(403).json(privacyErr);
 *
 *   // When serialising a public profile response:
 *   const safeProfile = stripPrivateFields(profileRow, user.elite_privacy_mode);
 */

export interface ElitePrivacyUser {
  elite_privacy_mode: boolean;
}

export interface ElitePrivacyError {
  error: string;
  code: "ELITE_PRIVACY_BLOCKED";
}

/**
 * Returns an error object if the operation is blocked by elite privacy mode,
 * or `null` if the operation is permitted.
 *
 * @param user   - The user row (must have `elite_privacy_mode`).
 * @param intent - "read" (block exposing data) | "write" (block writing data).
 */
export function enforceElitePrivacy(
  user: ElitePrivacyUser,
  intent: "read" | "write" = "read",
): ElitePrivacyError | null {
  if (!user.elite_privacy_mode) return null;
  return {
    error: intent === "write"
      ? "This field cannot be written while elite privacy mode is active."
      : "This data is private and not accessible while elite privacy mode is active.",
    code: "ELITE_PRIVACY_BLOCKED",
  };
}

/** Fields that are suppressed on public views when elite_privacy_mode=true. */
const PRIVATE_FIELDS = new Set([
  "noble_score",
  "wardrobe_unlocks",
  "attentiveness",
  "composure",
  "discernment",
  "diplomacy",
  "presence",
  "compass_scores",
  "compass_history",
  "badges",
  "new_badges",
]);

/**
 * Strip private fields from a profile/response object when the user has
 * elite_privacy_mode enabled. Safe to call even when the mode is off
 * (returns the original object untouched in that case).
 *
 * Performs a shallow strip — nested objects are not traversed.
 * Callers that embed Compass scores in nested structures must strip them
 * manually using `enforceElitePrivacy` on the nested path.
 */
export function stripPrivateFields<T extends Record<string, unknown>>(
  obj: T,
  elitePrivacyMode: boolean,
): Partial<T> {
  if (!elitePrivacyMode) return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (PRIVATE_FIELDS.has(key)) {
      delete result[key];
    }
  }
  return result;
}

/**
 * Express middleware factory. Loads the user's `elite_privacy_mode` from
 * the request context (populated by requireAuthUser) and attaches a helper
 * to `res.locals` so downstream handlers can call
 * `res.locals.stripPrivate(obj)`.
 *
 * Intended for routes that serialise user profile data publicly.
 */
export function elitePrivacyMiddleware(
  getUserPrivacy: (userId: string) => Promise<boolean>,
) {
  return async (
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction,
  ) => {
    try {
      const userId: string | undefined = (req as { resolvedUserId?: string }).resolvedUserId;
      const privacyMode = userId ? await getUserPrivacy(userId) : false;
      res.locals["elitePrivacyMode"] = privacyMode;
      res.locals["stripPrivate"] = <T extends Record<string, unknown>>(obj: T) =>
        stripPrivateFields(obj, privacyMode);
      next();
    } catch {
      next();
    }
  };
}
