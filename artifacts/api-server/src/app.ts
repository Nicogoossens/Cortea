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
// Allows only the Replit dev proxy, deployed *.replit.app origins, and localhost.
// Uses exact hostname matching — never substring includes — to prevent spoofing.
const REPLIT_DEV_DOMAIN = (process.env.REPLIT_DEV_DOMAIN ?? "").toLowerCase().trim();
const APP_URL = (process.env.APP_URL ?? "").replace(/\/$/, "");

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  let hostname: string;
  try {
    hostname = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  // Allow localhost and 127.0.0.1 for local development
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  // Allow exact APP_URL match
  if (APP_URL && origin === APP_URL) return true;
  // Allow any subdomain of replit.app (e.g. sowiso-01.replit.app)
  if (hostname === "replit.app" || hostname.endsWith(".replit.app")) return true;
  // Allow the Replit dev domain (exact hostname match, not substring)
  if (REPLIT_DEV_DOMAIN && hostname === REPLIT_DEV_DOMAIN) return true;
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
// Strict limiter for authentication endpoints only — prevents brute force and
// mail-server abuse on /api/auth/* (register, signin, resend, verify).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests from this address. Please wait a moment and try again." },
});

// General limiter for all non-auth API routes — prevents runaway scraping / DoS.
// Applied only to routes outside /api/auth to avoid double-counting.
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path.startsWith("/auth"),
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

// ── Security headers (Helmet) — global, before all routes ─────────────────────
// Applied first so every response (including the Stripe webhook) carries these headers.
// CSP sources are passed as individual array entries (not space-joined strings).
const cspSources: string[] = ["'self'"];
if (REPLIT_DEV_DOMAIN) cspSources.push(`https://${REPLIT_DEV_DOMAIN}`);
cspSources.push("https://*.replit.app");

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

// ── Stripe webhook — raw body required; registered after Helmet ────────────────
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

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──────────────────────────────────────────────────────────────
// Auth routes: strict limiter only.
// All other /api routes: general limiter (skip function excludes /auth paths).
app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
