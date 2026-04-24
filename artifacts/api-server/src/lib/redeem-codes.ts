/**
 * Shared short-lived one-time redemption code store.
 *
 * After a successful OAuth callback (Replit OIDC or Google), a random opaque code
 * is placed here. The frontend exchanges it once via GET /api/auth/redeem?code=<code>
 * (defined in oidc.ts) to receive the session token.
 *
 * Session tokens are NEVER placed in URL query parameters.
 */
import { randomBytes } from "crypto";

const REDEEM_CODE_TTL = 60 * 1000; // 60 seconds

export interface RedeemEntry {
  token: string;
  userId: string;
  fullName: string | null;
  isAdmin: boolean;
  expiresAt: number;
}

export const redeemCodes = new Map<string, RedeemEntry>();

export function pruneExpiredCodes() {
  const now = Date.now();
  for (const [code, entry] of redeemCodes) {
    if (entry.expiresAt <= now) redeemCodes.delete(code);
  }
}

export function issueRedeemCode(entry: Omit<RedeemEntry, "expiresAt">): string {
  pruneExpiredCodes();
  const code = randomBytes(16).toString("hex");
  redeemCodes.set(code, { ...entry, expiresAt: Date.now() + REDEEM_CODE_TTL });
  return code;
}
