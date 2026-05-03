/**
 * Admin-side Stripe configuration & seeding.
 *
 * Routes:
 *   GET  /admin/stripe/status         — { configured, products: [{tier, productId, monthly, yearly, ...}] }
 *   POST /admin/stripe/seed/student   — creates (or returns existing) "The Student" product + monthly/yearly prices.
 *
 * The Student tier definition lives in src/lib/tier-features.ts. Pricing:
 *   • Monthly: €4.99  (499 cents EUR)
 *   • Yearly:  €39.00 (3900 cents EUR)
 *
 * Idempotent: the seed endpoint searches Stripe for an active product with
 * metadata.tier="student" before creating, and reuses any existing monthly /
 * yearly recurring price on that product.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractToken } from "../lib/auth-middleware";
import { getUncachableStripeClient } from "../stripeClient";
import { TIER_FEATURES, type SubscriptionTier } from "../lib/tier-features";

const router = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    const [user] = await db
      .select({ id: usersTable.id, is_admin: usersTable.is_admin })
      .from(usersTable)
      .where(eq(usersTable.session_token, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "The authorisation token is not recognised." });
      return;
    }
    if (!user.is_admin) {
      res.status(403).json({ error: "This section is restricted to administrators." });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "A difficulty arose validating your session." });
  }
}

function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY || !!process.env.REPLIT_CONNECTORS_HOSTNAME;
}

interface TierProductSummary {
  tier: SubscriptionTier;
  productId: string;
  displayName: string;
  monthlyPriceId: string | null;
  monthlyAmount: number | null;
  yearlyPriceId: string | null;
  yearlyAmount: number | null;
  currency: string;
}

async function listTierProducts(): Promise<TierProductSummary[]> {
  const stripe = await getUncachableStripeClient();
  const products = await stripe.products.list({ active: true, limit: 100 });
  const out: TierProductSummary[] = [];
  for (const product of products.data) {
    const tier = product.metadata?.tier as SubscriptionTier | undefined;
    if (!tier || !TIER_FEATURES[tier]) continue;
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
    const monthly = prices.data.find((p) => p.recurring?.interval === "month");
    const yearly = prices.data.find((p) => p.recurring?.interval === "year");
    out.push({
      tier,
      productId: product.id,
      displayName: product.name,
      monthlyPriceId: monthly?.id ?? null,
      monthlyAmount: monthly?.unit_amount ?? null,
      yearlyPriceId: yearly?.id ?? null,
      yearlyAmount: yearly?.unit_amount ?? null,
      currency: monthly?.currency ?? yearly?.currency ?? "eur",
    });
  }
  return out;
}

router.get("/admin/stripe/status", requireAdmin, async (_req, res) => {
  if (!isStripeConfigured()) {
    return res.json({ configured: false, reachable: false, products: [] });
  }
  try {
    const products = await listTierProducts();
    return res.json({ configured: true, reachable: true, products });
  } catch (err) {
    return res.json({
      configured: true,
      reachable: false,
      products: [],
      error: err instanceof Error ? err.message : "Stripe is unreachable.",
    });
  }
});

const STUDENT_MONTHLY_AMOUNT = 499; // €4.99
const STUDENT_YEARLY_AMOUNT = 3900; // €39.00
const STUDENT_CURRENCY = "eur";

export async function ensureStudentProduct(): Promise<TierProductSummary> {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.list({ active: true, limit: 100 });
  let product = existing.data.find((p) => p.metadata?.tier === "student");

  if (!product) {
    product = await stripe.products.create({
      name: "The Student",
      description:
        "Verdiep je in één regio met de volledige Cultural Compass, een pillar voor studenten en alle scenario's tot moeilijkheidsgraad 3.",
      metadata: { tier: "student" },
    });
  } else if (product.metadata?.tier !== "student") {
    product = await stripe.products.update(product.id, {
      metadata: { ...product.metadata, tier: "student" },
    });
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });

  // Match by interval + currency + exact amount. If an existing recurring price
  // for the right interval has a wrong amount, deactivate it and create the
  // canonical one — Stripe doesn't let amounts on existing prices be updated.
  async function ensurePrice(
    interval: "month" | "year",
    expectedAmount: number,
    nickname: string,
  ) {
    const candidates = prices.data.filter(
      (p) => p.recurring?.interval === interval && p.currency === STUDENT_CURRENCY,
    );
    const correct = candidates.find((p) => p.unit_amount === expectedAmount);
    if (correct) return correct;
    for (const wrong of candidates) {
      await stripe.prices.update(wrong.id, { active: false });
    }
    return stripe.prices.create({
      product: product!.id,
      unit_amount: expectedAmount,
      currency: STUDENT_CURRENCY,
      recurring: { interval },
      nickname,
    });
  }

  const monthly = await ensurePrice("month", STUDENT_MONTHLY_AMOUNT, "Student – monthly");
  const yearly = await ensurePrice("year", STUDENT_YEARLY_AMOUNT, "Student – yearly");

  if (!product.default_price) {
    await stripe.products.update(product.id, { default_price: monthly.id });
  }

  return {
    tier: "student",
    productId: product.id,
    displayName: product.name,
    monthlyPriceId: monthly.id,
    monthlyAmount: monthly.unit_amount ?? null,
    yearlyPriceId: yearly.id,
    yearlyAmount: yearly.unit_amount ?? null,
    currency: STUDENT_CURRENCY,
  };
}

router.post("/admin/stripe/seed/student", requireAdmin, async (_req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY first.",
    });
  }
  try {
    const summary = await ensureStudentProduct();
    return res.json({ ok: true, product: summary });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unable to seed the Student product.",
    });
  }
});

export default router;
