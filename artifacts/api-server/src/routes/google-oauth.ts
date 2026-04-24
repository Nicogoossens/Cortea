/**
 * Google OAuth 2.0 via OpenID Connect (PKCE)
 *
 * Required environment variables:
 *   GOOGLE_CLIENT_ID     — OAuth 2.0 Client ID from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET — OAuth 2.0 Client Secret from Google Cloud Console
 *
 * Redirect URI to register in Google Cloud Console:
 *   https://sowiso-01.replit.app/api/auth/google/callback
 *   (and the Replit dev domain during development)
 */
import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

const GOOGLE_ISSUER = "https://accounts.google.com";
const COOKIE_TTL = 10 * 60 * 1000; // 10 minutes
const REDEEM_CODE_TTL = 60 * 1000; // 60 seconds

const router: IRouter = Router();

let googleConfigCache: oidc.Configuration | null = null;

interface RedeemEntry {
  token: string;
  userId: string;
  fullName: string | null;
  isAdmin: boolean;
  expiresAt: number;
}

const redeemCodes = new Map<string, RedeemEntry>();

function pruneExpiredCodes() {
  const now = Date.now();
  for (const [code, entry] of redeemCodes) {
    if (entry.expiresAt <= now) redeemCodes.delete(code);
  }
}

function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function getGoogleConfig(): Promise<oidc.Configuration> {
  if (!googleConfigCache) {
    googleConfigCache = await oidc.discovery(
      new URL(GOOGLE_ISSUER),
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
    );
  }
  return googleConfigCache;
}

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
  return `${proto}://${host}`;
}

function setSecureCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_TTL,
  });
}

function getSafePath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/replit-callback";
  }
  return value;
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function upsertGoogleUser(claims: Record<string, unknown>) {
  const sub = claims.sub as string;
  const email = (claims.email as string | undefined)?.toLowerCase().trim() ?? null;
  const name = (claims.name as string | undefined) ?? null;
  const givenName = (claims.given_name as string | undefined) ?? "";
  const familyName = (claims.family_name as string | undefined) ?? "";
  const fullName = name ?? ([givenName, familyName].filter(Boolean).join(" ") || null);
  const avatarUrl = (claims.picture as string | undefined) ?? null;

  // 1. Look up by Google OAuth provider + id
  const byOAuth = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.oauth_provider, "google"), eq(usersTable.oauth_provider_id, sub)))
    .limit(1);

  if (byOAuth.length > 0) {
    const sessionToken = generateToken();
    await db.update(usersTable)
      .set({
        session_token: sessionToken,
        full_name: fullName ?? byOAuth[0].full_name,
        avatar_url: avatarUrl ?? byOAuth[0].avatar_url,
      })
      .where(eq(usersTable.id, byOAuth[0].id));
    return { ...byOAuth[0], session_token: sessionToken };
  }

  // 2. Look up by email — link to existing account
  if (email) {
    const byEmail = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (byEmail.length > 0) {
      const sessionToken = generateToken();
      await db.update(usersTable)
        .set({
          session_token: sessionToken,
          email_verified: true,
          oauth_provider: "google",
          oauth_provider_id: sub,
          full_name: fullName ?? byEmail[0].full_name,
          avatar_url: avatarUrl ?? byEmail[0].avatar_url,
        })
        .where(eq(usersTable.id, byEmail[0].id));
      return { ...byEmail[0], session_token: sessionToken };
    }
  }

  // 3. Create new user
  const userId = `user_${randomBytes(8).toString("hex")}`;
  const sessionToken = generateToken();
  const [newUser] = await db
    .insert(usersTable)
    .values({
      id: userId,
      full_name: fullName,
      email,
      avatar_url: avatarUrl,
      email_verified: true,
      oauth_provider: "google",
      oauth_provider_id: sub,
      session_token: sessionToken,
      noble_score: 0,
      subscription_tier: "guest",
      region_history: [],
    })
    .returning();

  return { ...newUser, session_token: sessionToken };
}

/** GET /api/auth/google — starts the Google OAuth flow */
router.get("/auth/google", async (req: Request, res: Response) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  }

  try {
    const origin = getOrigin(req);
    const callbackUrl = `${origin}/api/auth/google/callback`;
    const returnTo = getSafePath(req.query.returnTo);

    const config = await getGoogleConfig();

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });

    setSecureCookie(res, "g_code_verifier", codeVerifier);
    setSecureCookie(res, "g_nonce", nonce);
    setSecureCookie(res, "g_state", state);
    setSecureCookie(res, "g_return_to", returnTo);

    return res.redirect(redirectTo.href);
  } catch (err) {
    req.log.error({ err }, "Google OAuth init failed");
    return res.redirect("/?error=auth_failed");
  }
});

/** GET /api/auth/google/callback — receives the Google code */
router.get("/auth/google/callback", async (req: Request, res: Response) => {
  const returnTo = getSafePath(req.cookies?.g_return_to);

  for (const name of ["g_code_verifier", "g_nonce", "g_state", "g_return_to"]) {
    res.clearCookie(name, { path: "/" });
  }

  const codeVerifier = req.cookies?.g_code_verifier as string | undefined;
  const nonce = req.cookies?.g_nonce as string | undefined;
  const expectedState = req.cookies?.g_state as string | undefined;

  if (!codeVerifier || !expectedState) {
    return res.redirect("/?error=auth_failed");
  }

  const origin = getOrigin(req);
  const callbackUrl = `${origin}/api/auth/google/callback`;

  try {
    const config = await getGoogleConfig();
    const currentUrl = new URL(`${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`);
    const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });

    const claims = tokens.claims();
    if (!claims) {
      return res.redirect("/?error=auth_failed");
    }

    const user = await upsertGoogleUser(claims as unknown as Record<string, unknown>);

    pruneExpiredCodes();
    const redeemCode = randomBytes(16).toString("hex");
    redeemCodes.set(redeemCode, {
      token: user.session_token!,
      userId: user.id,
      fullName: user.full_name ?? null,
      isAdmin: user.is_admin ?? false,
      expiresAt: Date.now() + REDEEM_CODE_TTL,
    });

    return res.redirect(`${origin}${returnTo}?code=${redeemCode}`);
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback failed");
    return res.redirect("/?error=auth_failed");
  }
});

/** GET /api/auth/google/status — returns whether Google OAuth is configured */
router.get("/auth/google/status", (_req: Request, res: Response) => {
  return res.json({ configured: isGoogleConfigured() });
});

export { isGoogleConfigured };
export default router;
