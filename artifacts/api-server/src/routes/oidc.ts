import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";
const OIDC_COOKIE_TTL = 10 * 60 * 1000; // 10 minutes
const REDEEM_CODE_TTL = 60 * 1000; // 60 seconds

const router: IRouter = Router();

let oidcConfigCache: oidc.Configuration | null = null;

/**
 * Short-lived one-time redemption codes issued after a successful OIDC callback.
 * The session token is NEVER placed in a URL query parameter. Instead the
 * frontend exchanges this opaque code for the token via POST /api/auth/redeem,
 * which deletes the code immediately after use.
 */
interface RedeemEntry {
  token: string;
  userId: string;
  fullName: string | null;
  isAdmin: boolean;
  expiresAt: number;
}
const redeemCodes = new Map<string, RedeemEntry>();

// Prune expired codes lazily to avoid memory leaks
function pruneExpiredCodes() {
  const now = Date.now();
  for (const [code, entry] of redeemCodes) {
    if (entry.expiresAt <= now) redeemCodes.delete(code);
  }
}

async function getOidcConfig(): Promise<oidc.Configuration> {
  if (!oidcConfigCache) {
    oidcConfigCache = await oidc.discovery(
      new URL(ISSUER_URL),
      process.env.REPL_ID!,
    );
  }
  return oidcConfigCache;
}

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
  return `${proto}://${host}`;
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
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

async function upsertSowisoUser(claims: Record<string, unknown>) {
  const sub = claims.sub as string;
  const email = (claims.email as string | undefined)?.toLowerCase().trim() ?? null;
  const firstName = (claims.first_name as string | undefined) ?? "";
  const lastName = (claims.last_name as string | undefined) ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

  // 1. Look up by oauth provider + id
  const byOAuth = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.oauth_provider, "replit"), eq(usersTable.oauth_provider_id, sub)))
    .limit(1);

  if (byOAuth.length > 0) {
    const sessionToken = generateToken();
    await db.update(usersTable)
      .set({ session_token: sessionToken, full_name: fullName ?? byOAuth[0].full_name })
      .where(eq(usersTable.id, byOAuth[0].id));
    return { ...byOAuth[0], session_token: sessionToken };
  }

  // 2. Look up by email (link existing magic-link account)
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
          oauth_provider: "replit",
          oauth_provider_id: sub,
          email_verified: true,
          full_name: byEmail[0].full_name ?? fullName,
        })
        .where(eq(usersTable.id, byEmail[0].id));
      return { ...byEmail[0], session_token: sessionToken };
    }
  }

  // 3. Create new user
  const userId = `replit_${randomBytes(8).toString("hex")}`;
  const sessionToken = generateToken();
  const [newUser] = await db.insert(usersTable).values({
    id: userId,
    email,
    full_name: fullName,
    email_verified: true,
    oauth_provider: "replit",
    oauth_provider_id: sub,
    session_token: sessionToken,
    noble_score: 0,
    subscription_tier: "guest",
    language_code: "en",
    active_region: "GB",
    region_history: [],
    objectives: [],
    interests_sports: [],
    interests_cuisine: [],
    interests_dress_code: [],
    ambition_level: "casual",
    subscription_status: "active",
    onboarding_completed: false,
    is_admin: false,
  }).returning();

  return newUser;
}

/** GET /api/login — starts the OIDC flow with PKCE */
router.get("/login", async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;
    const returnTo = getSafePath(req.query.returnTo);

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "login consent",
      state,
      nonce,
    });

    setOidcCookie(res, "oidc_code_verifier", codeVerifier);
    setOidcCookie(res, "oidc_nonce", nonce);
    setOidcCookie(res, "oidc_state", state);
    setOidcCookie(res, "oidc_return_to", returnTo);

    res.redirect(redirectTo.href);
  } catch (err) {
    req.log.error({ err }, "OIDC login init failed");
    res.redirect("/?error=auth_failed");
  }
});

/** GET /api/callback — receives the OIDC code and completes auth */
router.get("/callback", async (req: Request, res: Response) => {
  const returnTo = getSafePath(req.cookies?.oidc_return_to);

  // Clear OIDC temp cookies
  for (const name of ["oidc_code_verifier", "oidc_nonce", "oidc_state", "oidc_return_to"]) {
    res.clearCookie(name, { path: "/" });
  }

  const codeVerifier = req.cookies?.oidc_code_verifier as string | undefined;
  const nonce = req.cookies?.oidc_nonce as string | undefined;
  const expectedState = req.cookies?.oidc_state as string | undefined;

  if (!codeVerifier || !expectedState) {
    res.redirect("/?error=auth_failed");
    return;
  }

  const origin = getOrigin(req);
  const callbackUrl = `${origin}/api/callback`;

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    const config = await getOidcConfig();
    const currentUrl = new URL(`${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`);
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch (err) {
    req.log.error({ err }, "OIDC token exchange failed");
    res.redirect("/?error=auth_failed");
    return;
  }

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/?error=auth_failed");
    return;
  }

  try {
    const user = await upsertSowisoUser(claims as unknown as Record<string, unknown>);

    // Issue a short-lived one-time redemption code — session token stays server-side.
    pruneExpiredCodes();
    const redeemCode = randomBytes(16).toString("hex");
    redeemCodes.set(redeemCode, {
      token: user.session_token!,
      userId: user.id,
      fullName: user.full_name ?? null,
      isAdmin: user.is_admin ?? false,
      expiresAt: Date.now() + REDEEM_CODE_TTL,
    });

    res.redirect(`${origin}${returnTo}?code=${redeemCode}`);
  } catch (err) {
    req.log.error({ err }, "OIDC user upsert failed");
    res.redirect("/?error=auth_failed");
  }
});

/**
 * GET /api/auth/redeem?code=<code>
 * Single-use endpoint: exchanges a one-time redemption code for the session token.
 * The code is deleted immediately after use (or on expiry).
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

  res.json({
    token: entry.token,
    userId: entry.userId,
    fullName: entry.fullName,
    isAdmin: entry.isAdmin,
  });
});

export default router;
