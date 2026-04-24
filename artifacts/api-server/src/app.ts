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
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";

const app: Express = express();

// ── CORS origin allowlist ──────────────────────────────────────────────────────
// Allow requests from the Replit dev proxy and the deployed *.replit.app domain.
// Also allow the configured APP_URL and localhost for local development.
const REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN ?? "";
const APP_URL = process.env.APP_URL ?? "";

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  // Always allow during local development (no origin or localhost)
  if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) return true;
  // Allow the deployed app URL
  if (APP_URL && origin === APP_URL.replace(/\/$/, "")) return true;
  // Allow any *.replit.app origin
  if (origin.endsWith(".replit.app")) return true;
  // Allow the Replit dev-domain proxy (e.g. https://abc123.replit.dev/...)
  if (REPLIT_DEV_DOMAIN && origin.includes(REPLIT_DEV_DOMAIN)) return true;
  return false;
}

const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
};

// ── Rate limiters ──────────────────────────────────────────────────────────────
// Strict limiter for authentication endpoints — protects against brute force
// and mail-server abuse on /auth/register, /auth/signin, /auth/resend etc.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests from this address. Please wait a moment and try again." },
  skipSuccessfulRequests: false,
});

// General limiter for all other API routes — prevents runaway scraping / DoS.
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skipSuccessfulRequests: true,
});

// ── Logging ────────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ── Stripe webhook — must be before express.json() ────────────────────────────
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
            if (tier) {
              await db.update(usersTable)
                .set({ subscription_tier: tier })
                .where(eq(usersTable.id, userId));
            }
          }
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await db.update(usersTable)
            .set({ subscription_tier: "guest" })
            .where(eq(usersTable.id, userId));
        }
      }

      return res.status(200).json({ received: true });
    } catch (error: unknown) {
      logger.error({ err: error }, "Webhook error");
      return res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

// ── Security headers (Helmet) ──────────────────────────────────────────────────
// Applied globally before CORS and routing.
// CSP is set to allow same-origin and the Replit domains for scripts/styles/connect.
const replitSrc = REPLIT_DEV_DOMAIN ? `https://${REPLIT_DEV_DOMAIN} https://*.replit.app` : "https://*.replit.app";
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", replitSrc],
        styleSrc: ["'self'", "'unsafe-inline'", replitSrc],
        imgSrc: ["'self'", "data:", "blob:", replitSrc],
        connectSrc: ["'self'", replitSrc, "https://*.anthropic.com"],
        fontSrc: ["'self'", "data:", replitSrc],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting — auth routes get the strict limiter ─────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
