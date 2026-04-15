import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendActivationEmail } from "../lib/email";

const router = Router();

const APP_URL = process.env.APP_URL ?? "https://sowiso.replit.app";

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

    const { email, full_name, birth_year, gender_identity, locale, ambition_level, language_code, active_region } = parsed.data;
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
      message: "Your address has been verified. Welcome to SOWISO.",
      user_id: user.id,
      full_name: user.full_name,
      session_token: sessionToken,
      is_admin: user.is_admin,
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

export default router;
