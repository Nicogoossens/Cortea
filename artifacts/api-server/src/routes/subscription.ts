import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { TIER_FEATURES, getTierFeatures, type SubscriptionTier } from "../lib/tier-features";
import { getUncachableStripeClient, getStripeSync } from "../stripeClient";

const router = Router();

const DEFAULT_USER_ID = "default-user";

router.get("/subscription/tiers", async (_req, res) => {
  const tiers = Object.values(TIER_FEATURES).map((tf) => ({
    tier: tf.tier,
    displayName: tf.displayName,
    features: {
      allRegionsUnlocked: tf.allRegionsUnlocked,
      fullCulturalCompass: tf.fullCulturalCompass,
      aiCounselUnlimited: tf.aiCounselUnlimited,
      mirrorAccess: tf.mirrorAccess,
      innerCircleAccess: tf.innerCircleAccess,
      sensoryAwarenessAccess: tf.sensoryAwarenessAccess,
    },
  }));
  return res.json(tiers);
});

router.get("/subscription/plans", async (_req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const products = await stripe.products.list({ active: true, expand: ["data.default_price"] });

    const plans = [];
    for (const product of products.data) {
      const tierMeta = product.metadata?.tier as SubscriptionTier | undefined;
      if (!tierMeta || !TIER_FEATURES[tierMeta]) continue;

      const prices = await stripe.prices.list({ product: product.id, active: true });
      const monthlyPrice = prices.data.find((p) => p.recurring?.interval === "month");
      const yearlyPrice = prices.data.find((p) => p.recurring?.interval === "year");

      plans.push({
        productId: product.id,
        tier: tierMeta,
        displayName: product.name,
        description: product.description,
        monthlyPriceId: monthlyPrice?.id ?? null,
        monthlyAmount: monthlyPrice?.unit_amount ?? null,
        yearlyPriceId: yearlyPrice?.id ?? null,
        yearlyAmount: yearlyPrice?.unit_amount ?? null,
        currency: monthlyPrice?.currency ?? yearlyPrice?.currency ?? "eur",
      });
    }

    return res.json(plans);
  } catch (err) {
    console.error("Failed to fetch plans:", err);
    return res.status(500).json({ message: "Plans are momentarily unavailable." });
  }
});

router.post("/subscription/checkout", async (req, res) => {
  try {
    const userId = (req.query.user_id as string) || DEFAULT_USER_ID;
    const { priceId } = req.body as { priceId?: string };

    if (!priceId) {
      return res.status(400).json({ message: "A price selection is required." });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ message: "Your profile has not yet been established." });
    }

    const stripe = await getUncachableStripeClient();

    let customerId: string | undefined = (user as any).stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
      await db.execute(
        sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${userId}`
      );
    }

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/?upgrade=success`,
      cancel_url: `${baseUrl}/membership`,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ message: "Unable to initiate the subscription flow at this time." });
  }
});

router.post("/subscription/portal", async (req, res) => {
  try {
    const userId = (req.query.user_id as string) || DEFAULT_USER_ID;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const customerId = (user as any)?.stripe_customer_id;

    if (!customerId) {
      return res.status(404).json({ message: "No billing record found for this account." });
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/membership`,
    });

    return res.json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal error:", err);
    return res.status(500).json({ message: "The billing portal is momentarily unavailable." });
  }
});

router.get("/subscription/features", async (req, res) => {
  try {
    const userId = (req.query.user_id as string) || DEFAULT_USER_ID;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      return res.json(getTierFeatures("guest"));
    }

    return res.json(getTierFeatures(user.subscription_tier as SubscriptionTier));
  } catch (err) {
    return res.status(500).json({ message: "Unable to retrieve subscription features." });
  }
});

export default router;
