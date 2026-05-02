import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";
import { db } from "@workspace/db";
import { usersTable, purchasedGuidesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getUncachableStripeClient } from "./stripeClient";

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
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      const event = JSON.parse(req.body.toString());
      if (
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.created"
      ) {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          const stripe = await getUncachableStripeClient();
          const priceId = subscription.items?.data?.[0]?.price?.id;
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
            const product = price.product as import("stripe").Stripe.Product;
            const tier = product.metadata?.tier as "traveller" | "ambassador" | undefined;
            const periodEnd = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null;
            const subStatus = subscription.status ?? "active";
            if (tier) {
              await db.update(usersTable)
                .set({
                  subscription_tier: tier,
                  subscription_status: subStatus,
                  subscription_current_period_end: periodEnd,
                  payment_failed_at: subStatus === "active" ? null : undefined,
                })
                .where(eq(usersTable.id, userId));
            }
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
          await db.update(usersTable)
            .set({
              subscription_tier: "guest",
              subscription_status: "canceled",
              subscription_current_period_end: null,
            })
            .where(eq(usersTable.id, userId));
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

export default app;
