import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import seoRouter from "./routes/seo";
import { logger } from "./lib/logger";
import { globalErrorHandler } from "./lib/error-handler";
import { WebhookHandlers } from "./webhookHandlers";
import { db } from "@workspace/db";
import { usersTable, purchasedGuidesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getUncachableStripeClient } from "./stripeClient";
import { grantReferralRewardOnFirstPaid } from "./lib/referral";
import { maxTier, type SubscriptionTier as SubTier } from "./lib/tier-features";
import { sendCancellationConfirmation } from "./lib/billing-notifications";

const app: Express = express();

// Replit's preview proxy adds X-Forwarded-For; trust the immediate hop so
// express-rate-limit can reliably key on the real client IP and stop
// emitting ERR_ERL_UNEXPECTED_X_FORWARDED_FOR validation errors.
app.set("trust proxy", 1);

const REPLIT_DEV_DOMAIN = (process.env.REPLIT_DEV_DOMAIN ?? "").toLowerCase().trim();

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  if (REPLIT_DEV_DOMAIN) {
    origins.add(`https://${REPLIT_DEV_DOMAIN}`);
  }
  const extra = (process.env.CORS_ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const o of extra) origins.add(o);
  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin.toLowerCase());
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests from this address. Please wait a moment and try again." },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path.startsWith("/auth"),
});

const cspSources: string[] = ["'self'", "https://*.replit.app"];
if (REPLIT_DEV_DOMAIN) cspSources.push(`https://${REPLIT_DEV_DOMAIN}`);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", ...cspSources],
        styleSrc: ["'self'", "'unsafe-inline'", ...cspSources],
        imgSrc: ["'self'", "data:", "blob:", ...cspSources],
        connectSrc: ["'self'", ...cspSources, "https://*.anthropic.com"],
        fontSrc: ["'self'", "data:", ...cspSources],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    const sig = Array.isArray(signature) ? signature[0] : signature;

    try {
      const event = await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      if (
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.created"
      ) {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const subStatus: string = subscription.status ?? "";
        if (userId) {
          const isPaidActive = subStatus === "active" || subStatus === "trialing";
          if (isPaidActive) {
            const stripe = await getUncachableStripeClient();
            const priceId = subscription.items?.data?.[0]?.price?.id;
            if (priceId) {
              const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
              const product = price.product as import("stripe").Stripe.Product;
              const tier = product.metadata?.tier as "student" | "traveller" | "ambassador" | undefined;
              const rawSub = subscription as unknown as Record<string, unknown>;
              const rawPeriodEnd = typeof rawSub["current_period_end"] === "number" ? rawSub["current_period_end"] : null;
              const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null;
              const rawTrialEnd = typeof rawSub["trial_end"] === "number" ? rawSub["trial_end"] : null;
              const trialEnd = rawTrialEnd ? new Date(rawTrialEnd * 1000) : null;
              if (tier) {
                // Read current state to decide whether an active referral
                // reward should "shield" the effective subscription_tier
                // from being overwritten back down to the Stripe billing
                // tier mid-reward.
                const [current] = await db
                  .select({
                    effective: usersTable.subscription_tier,
                    rewardEnds: usersTable.referral_reward_ends_at,
                  })
                  .from(usersTable)
                  .where(eq(usersTable.id, userId))
                  .limit(1);
                const rewardActive =
                  !!current?.rewardEnds && current.rewardEnds.getTime() > Date.now();
                // Effective access tier:
                //   - if no reward is active: track Stripe truth exactly
                //   - if reward is active: keep the higher of (Stripe tier,
                //     current effective tier) so the reward overlay is not
                //     silently revoked, but a genuine paid upgrade still wins
                const effectiveTier = rewardActive && current
                  ? maxTier(tier as SubTier, current.effective as SubTier)
                  : (tier as SubTier);

                await db.update(usersTable)
                  .set({
                    subscription_tier: effectiveTier,
                    billing_tier: tier,
                    subscription_status: subStatus,
                    subscription_current_period_end: periodEnd,
                    trial_ends_at: trialEnd,
                    // Reset reminder idempotency whenever a NEW trial begins
                    // (i.e. a trial_end is now present). When the trial is
                    // cleared we leave the timestamp alone — the value only
                    // matters for the next trial cycle.
                    ...(trialEnd ? { trial_reminder_sent_at: null } : {}),
                    payment_failed_at: null,
                  })
                  .where(eq(usersTable.id, userId));

                // Referral reward fires at most once per user, on first true
                // paid conversion. The helper atomically claims `first_paid_at`
                // so duplicate webhook deliveries (and trial→active vs
                // active→active updates) are safely no-ops.
                if (subStatus === "active") {
                  void grantReferralRewardOnFirstPaid(userId).catch((err) =>
                    logger.error({ err, userId }, "Failed to grant referral reward")
                  );
                }
              }
            }
          } else {
            await db.update(usersTable)
              .set({
                subscription_tier: "guest",
                subscription_status: subStatus || "unknown",
                subscription_current_period_end: null,
                payment_failed_at: new Date(),
              })
              .where(eq(usersTable.id, userId));
          }
        }
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (session.mode === "payment" && session.metadata?.type === "guide_purchase") {
          const userId = session.metadata?.userId;
          const guideId = session.metadata?.guideId;
          const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
          if (userId && guideId) {
            await db.insert(purchasedGuidesTable).values({
              id: randomUUID(),
              user_id: userId,
              guide_id: guideId,
              purchased_at: new Date(),
              stripe_payment_intent_id: paymentIntentId,
            }).onConflictDoNothing();
          }
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          const [u] = await db
            .select({
              email: usersTable.email,
              phone: usersTable.phone_number,
              fullName: usersTable.full_name,
              status: usersTable.subscription_status,
            })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);
          await db.update(usersTable)
            .set({
              subscription_tier: "guest",
              subscription_status: "canceled",
              subscription_current_period_end: null,
              trial_ends_at: null,
            })
            .where(eq(usersTable.id, userId));
          // Best-effort confirmation. Skip if our own cancel route already
          // sent one (status === "canceled" already set).
          if (u && u.status !== "canceled") {
            void sendCancellationConfirmation({
              email: u.email,
              phone: u.phone,
              fullName: u.fullName,
              duringTrial: subscription.status === "trialing",
            });
          }
        }
      }

      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object;
        const customerId = invoice.customer as string | undefined;
        if (customerId) {
          const [user] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.stripe_customer_id, customerId))
            .limit(1);
          if (user) {
            await db.update(usersTable)
              .set({
                subscription_status: "past_due",
                payment_failed_at: new Date(),
              })
              .where(eq(usersTable.id, user.id));
          }
        }
      }

      return res.status(200).json({ received: true });
    } catch (error: unknown) {
      logger.error({ err: error }, "Webhook error");
      return res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

app.use(cors({ credentials: true, origin: (origin, callback) => callback(null, isAllowedOrigin(origin)) }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

app.use("/api", router);
// SEO discovery files served at both root (for search engines) and /api (for API clients)
app.use("/", seoRouter);
app.use("/api", seoRouter);

// Global error handler — MUST come after all routes so Express dispatches
// thrown / rejected errors to it. Returns JSON 500 (no stack in production).
app.use(globalErrorHandler);

export default app;
