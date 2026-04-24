import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendActivationEmail } from "../lib/email";

const router = Router();

const BASE_PATH = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
const APP_URL = process.env.APP_URL ?? `https://sowiso-01.replit.app${BASE_PATH}`;

const BCRYPT_ROUNDS = 12;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function tokenExpiresAt(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d;
}

const RegisterBodySchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(120),
  birth_year: z.number().int().min(1900).max(new Date().getFullYear() - 13),
  gender_identity: z.string().max(50).optional(),
  locale: z.string().optional().default("en"),
  ambition_level: z.enum(["casual", "professional", "diplomatic"]).optional().default("casual"),
  language_code: z.string().optional().default("en"),
  active_region: z.string().optional().default("GB"),
  password: z.string().min(8).max(128).optional(),
});

router.post("/auth/register", async (req, res) => {
  try {
    const parsed = RegisterBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "The information provided is incomplete. Please review your submission.",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, full_name, birth_year, gender_identity, locale, ambition_level, language_code, active_region, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0 && existing[0].email_verified) {
      return res.status(409).json({
        error: "An account with this address already exists. Please sign in.",
      });
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const sessionToken = generateToken();

      if (existing.length > 0) {
        await db
          .update(usersTable)
          .set({
            full_name,
            birth_year,
            gender_identity: gender_identity ?? null,
            password_hash: passwordHash,
            email_verified: true,
            session_token: sessionToken,
            verification_token: null,
            token_expires_at: null,
          })
          .where(eq(usersTable.id, existing[0].id));

        return res.json({
          message: "Your account has been activated.",
          user_id: existing[0].id,
          full_name,
          session_token: sessionToken,
          is_admin: existing[0].is_admin,
          language_code: existing[0].language_code,
          active_region: existing[0].active_region,
        });
      }

      const userId = `user_${randomBytes(8).toString("hex")}`;
      const [newUser] = await db
        .insert(usersTable)
        .values({
          id: userId,
          full_name,
          email: normalizedEmail,
          email_verified: true,
          password_hash: passwordHash,
          session_token: sessionToken,
          verification_token: null,
          token_expires_at: null,
          birth_year,
          gender_identity: gender_identity ?? null,
          ambition_level,
          language_code,
          active_region,
          noble_score: 0,
          subscription_tier: "guest",
          region_history: [],
        })
        .returning();

      return res.status(201).json({
        message: "Your account has been established. Welcome to Cortéa.",
        user_id: newUser.id,
        full_name: newUser.full_name,
        session_token: sessionToken,
        is_admin: newUser.is_admin,
        language_code: newUser.language_code,
        active_region: newUser.active_region,
      });
    }

    // No password supplied → magic-link flow
    const token = generateToken();
    const expiresAt = tokenExpiresAt();

    if (existing.length > 0) {
      await db
        .update(usersTable)
        .set({
          full_name,
          birth_year,
          gender_identity: gender_identity ?? null,
          verification_token: token,
          token_expires_at: expiresAt,
        })
        .where(eq(usersTable.id, existing[0].id));

      const { sent, url } = await sendActivationEmail({ to: normalizedEmail, token, locale });
      return res.json({
        message: "A new verification link has been dispatched to your address.",
        ...(!sent ? { dev_verification_url: url } : {}),
      });
    }

    const userId = `user_${randomBytes(8).toString("hex")}`;
    const [newUser] = await db
      .insert(usersTable)
      .values({
        id: userId,
        full_name,
        email: normalizedEmail,
        email_verified: false,
        verification_token: token,
        token_expires_at: expiresAt,
        birth_year,
        gender_identity: gender_identity ?? null,
        ambition_level,
        language_code,
        active_region,
        noble_score: 0,
        subscription_tier: "guest",
        region_history: [],
      })
      .returning();

    const { sent, url } = await sendActivationEmail({ to: normalizedEmail, token, locale });

    return res.status(201).json({
      message: "Your account has been established. A verification link has been dispatched to your address.",
      user_id: newUser.id,
      ...(!sent ? { dev_verification_url: url } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Registration failed");
    return res.status(500).json({ error: "A difficulty arose during registration. Please try again." });
  }
});

const VerifyQuerySchema = z.object({
  token: z.string().min(1),
});

router.get("/auth/verify", async (req, res) => {
  try {
    const parsed = VerifyQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "No verification token was provided." });
    }

    const { token } = parsed.data;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.verification_token, token))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "This verification link is not recognised." });
    }

    if (user.suspended_at) {
      return res.status(403).json({ error: "This account has been suspended. Please contact support." });
    }

    if (user.email_verified) {
      const refreshedToken = randomBytes(32).toString("hex");
      await db.update(usersTable).set({ session_token: refreshedToken }).where(eq(usersTable.id, user.id));
      return res.json({
        message: "Your address has already been verified.",
        already_verified: true,
        user_id: user.id,
        full_name: user.full_name,
        session_token: refreshedToken,
        is_admin: user.is_admin,
        language_code: user.language_code,
        active_region: user.active_region,
      });
    }

    if (user.token_expires_at && new Date() > new Date(user.token_expires_at)) {
      return res.status(410).json({ error: "This verification link has expired. Please request a new one." });
    }

    const sessionToken = randomBytes(32).toString("hex");

    await db
      .update(usersTable)
      .set({
        email_verified: true,
        verification_token: null,
        token_expires_at: null,
        session_token: sessionToken,
      })
      .where(eq(usersTable.id, user.id));

    return res.json({
      message: "Your address has been verified. Welcome to Cortéa.",
      user_id: user.id,
      full_name: user.full_name,
      session_token: sessionToken,
      is_admin: user.is_admin,
      language_code: user.language_code,
      active_region: user.active_region,
    });
  } catch (err) {
    req.log.error({ err }, "Verification failed");
    return res.status(500).json({ error: "A difficulty arose during verification. Please try again." });
  }
});

const ResendBodySchema = z.object({
  email: z.string().email(),
  locale: z.string().optional().default("en"),
});

router.post("/auth/resend", async (req, res) => {
  try {
    const parsed = ResendBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const { email, locale } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return res.json({ message: "If this address is registered, a verification link will be dispatched." });
    }

    if (user.email_verified) {
      return res.json({ message: "This address has already been verified." });
    }

    const token = generateToken();
    const expiresAt = tokenExpiresAt();

    await db
      .update(usersTable)
      .set({ verification_token: token, token_expires_at: expiresAt })
      .where(eq(usersTable.id, user.id));

    const { sent, url } = await sendActivationEmail({ to: normalizedEmail, token, locale });

    return res.json({
      message: "A new verification link has been dispatched to your address.",
      ...(!sent ? { dev_verification_url: url } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Resend verification failed");
    return res.status(500).json({ error: "A difficulty arose. Please try again." });
  }
});

// ── Magic-link sign-in (fallback when no password is set) ──────────────────────
const SignInBodySchema = z.object({
  email: z.string().email(),
});

router.post("/auth/signin", async (req, res) => {
  try {
    const parsed = SignInBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return res.json({ message: "If this address is registered, a sign-in link will be dispatched." });
    }

    if (!user.email_verified) {
      return res.status(400).json({
        error: "This address has not yet been verified. Please check your inbox for the verification link.",
      });
    }

    if (user.suspended_at) {
      return res.status(403).json({ error: "This account has been suspended. Please contact support." });
    }

    const token = generateToken();
    const expiresAt = tokenExpiresAt();

    await db
      .update(usersTable)
      .set({ verification_token: token, token_expires_at: expiresAt })
      .where(eq(usersTable.id, user.id));

    const { sent, url } = await sendActivationEmail({ to: normalizedEmail, token, locale: user.language_code });

    return res.json({
      message: "A sign-in link has been dispatched to your address.",
      ...(!sent ? { dev_verification_url: url } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Sign-in failed");
    return res.status(500).json({ error: "A difficulty arose. Please try again." });
  }
});

// ── Password-based sign-in ─────────────────────────────────────────────────────
const SignInPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/signin-password", async (req, res) => {
  try {
    const parsed = SignInPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Email address and password are required." });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    // Use a timing-safe response for both "not found" and "wrong password"
    if (!user) {
      // Still run bcrypt to prevent timing attacks
      await bcrypt.compare(password, "$2a$12$notarealhashjustpaddingtopreventimagetimingattack000000");
      return res.status(401).json({ error: "The email address or password is incorrect." });
    }

    if (user.suspended_at) {
      return res.status(403).json({ error: "This account has been suspended. Please contact support." });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        error: "No password is set for this account. Please use the sign-in link option below.",
        no_password: true,
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "The email address or password is incorrect." });
    }

    const sessionToken = generateToken();
    await db
      .update(usersTable)
      .set({
        session_token: sessionToken,
        email_verified: true,
      })
      .where(eq(usersTable.id, user.id));

    return res.json({
      message: "Welcome back.",
      user_id: user.id,
      full_name: user.full_name,
      session_token: sessionToken,
      is_admin: user.is_admin,
      language_code: user.language_code,
      active_region: user.active_region,
    });
  } catch (err) {
    req.log.error({ err }, "Password sign-in failed");
    return res.status(500).json({ error: "A difficulty arose. Please try again." });
  }
});

// ── Set / change password (requires active session) ────────────────────────────
const SetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
  current_password: z.string().optional(),
});

router.post("/auth/set-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const token = authHeader.slice(7);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);

    if (!user) return res.status(401).json({ error: "Invalid or expired session." });

    const parsed = SetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { password, current_password } = parsed.data;

    // If account already has a password, require the current one
    if (user.password_hash) {
      if (!current_password) {
        return res.status(400).json({ error: "Current password is required to set a new one." });
      }
      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "The current password is incorrect." });
      }
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await db
      .update(usersTable)
      .set({ password_hash: passwordHash })
      .where(eq(usersTable.id, user.id));

    return res.json({ message: "Your password has been updated successfully." });
  } catch (err) {
    req.log.error({ err }, "Set password failed");
    return res.status(500).json({ error: "A difficulty arose. Please try again." });
  }
});

// ── First-admin bootstrap ──────────────────────────────────────────────────────
router.post("/auth/claim-first-admin", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const token = authHeader.slice(7);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) return res.status(401).json({ error: "Invalid session." });
    if (user.is_admin) return res.json({ message: "You are already an administrator." });

    const [{ total }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.is_admin, true));
    if (total > 0) return res.status(403).json({ error: "An administrator already exists. This endpoint is disabled." });

    await db.update(usersTable).set({ is_admin: true }).where(eq(usersTable.id, user.id));
    return res.json({ message: "You have been granted administrator access.", is_admin: true });
  } catch (err) {
    req.log.error({ err }, "claim-first-admin failed");
    return res.status(500).json({ error: "A difficulty arose. Please try again." });
  }
});

export default router;
