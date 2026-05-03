import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, referralsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  TIER_FEATURES,
  TRIAL_ELIGIBLE_TIERS,
  TRIAL_DAYS,
  getTierFeatures,
  type SubscriptionTier,
} from "../lib/tier-features";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import { getUncachableStripeClient } from "../stripeClient";
import { ensureReferralCode, attachPendingReferral, REFERRAL_REWARD_CAP } from "../lib/referral";
import { sendCancellationConfirmation } from "../lib/billing-notifications";

const router = Router();

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
      conciergeAccess: tf.conciergeAccess,
    },
  }));
  return res.json(tiers);
});

/**
 * Returns available paid plans from Stripe.
 * Returns an empty array (not an error) when Stripe is not yet configured —
 * the Membership page gracefully renders static tier cards with no live prices.
 */
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
        trialDays: TRIAL_ELIGIBLE_TIERS.includes(tierMeta) ? TRIAL_DAYS : 0,
      });
    }

    return res.json(plans);
  } catch {
    return res.json([]);
  }
});

router.post("/subscription/checkout", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const { priceId } = req.body as { priceId?: string };

    if (!priceId) {
      return res.status(400).json({ error: "A price selection is required." });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "Your profile has not yet been established." });
    }

    const stripe = await getUncachableStripeClient();

    let customerId: string | undefined = user.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
      await db.execute(
        sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${userId}`
      );
    }

    // Look up the tier behind this price so we can decide whether to grant
    // the 14-day trial. Trial only on Traveller / Ambassador, only the first
    // time the user converts (i.e. they have no prior paid period_end).
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as import("stripe").Stripe.Product;
    const tier = product.metadata?.tier as SubscriptionTier | undefined;

    const eligibleForTrial =
      !!tier &&
      TRIAL_ELIGIBLE_TIERS.includes(tier) &&
      !user.subscription_current_period_end &&
      user.subscription_status !== "trialing";

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      // For trial subscriptions we still require a card up-front so the
      // first charge after day 14 succeeds without a re-confirmation step.
      payment_method_collection: "always",
      success_url: `${baseUrl}/?upgrade=success`,
      cancel_url: `${baseUrl}/membership`,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
        ...(eligibleForTrial ? { trial_period_days: TRIAL_DAYS } : {}),
      },
    });

    return res.json({ url: session.url, trialDays: eligibleForTrial ? TRIAL_DAYS : 0 });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Unable to initiate the subscription flow at this time." });
  }
});

router.post("/subscription/portal", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const customerId = user?.stripe_customer_id;

    if (!customerId) {
      return res.status(404).json({ error: "No billing record found for this account." });
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
    return res.status(500).json({ error: "The billing portal is momentarily unavailable." });
  }
});

/**
 * POST /subscription/cancel — one-click cancellation from the dashboard.
 *
 * If the user is in their trial → cancel immediately, no charge.
 * Otherwise → cancel_at_period_end so access is preserved through the end
 * of the paid period the user has already covered.
 *
 * In both cases the user receives an immediate confirmation by email + SMS.
 */
router.post("/subscription/cancel", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ error: "No active membership found on this account." });
    }

    const stripe = await getUncachableStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "all",
      limit: 5,
    });
    const active = subscriptions.data.find(
      (s) => s.status === "active" || s.status === "trialing" || s.status === "past_due"
    );
    if (!active) {
      return res.status(404).json({ error: "No active subscription found to cancel." });
    }

    const duringTrial = active.status === "trialing";
    if (duringTrial) {
      await stripe.subscriptions.cancel(active.id);
      await db
        .update(usersTable)
        .set({
          subscription_tier: "guest",
          subscription_status: "canceled",
          subscription_current_period_end: null,
          trial_ends_at: null,
        })
        .where(eq(usersTable.id, userId));
    } else {
      await stripe.subscriptions.update(active.id, { cancel_at_period_end: true });
      await db
        .update(usersTable)
        .set({ subscription_status: "cancel_at_period_end" })
        .where(eq(usersTable.id, userId));
    }

    // Best-effort notifications — email + SMS. Failure is logged but does
    // not roll back the cancellation.
    void sendCancellationConfirmation({
      email: user.email,
      phone: user.phone_number,
      fullName: user.full_name,
      duringTrial,
    });

    return res.json({ ok: true, duringTrial });
  } catch (err) {
    console.error("Cancel error:", err);
    return res.status(500).json({ error: "Unable to cancel the subscription at this time." });
  }
});

router.get("/subscription/features", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      return res.json(getTierFeatures("guest"));
    }

    return res.json(getTierFeatures(user.subscription_tier as SubscriptionTier));
  } catch {
    return res.status(500).json({ error: "Unable to retrieve subscription features." });
  }
});

/**
 * GET /subscription/status — returns the current subscription state for the authenticated user.
 * Includes tier, billing status, renewal date, trial state, and whether a payment has recently failed.
 */
router.get("/subscription/status", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const [user] = await db
      .select({
        subscription_tier: usersTable.subscription_tier,
        subscription_status: usersTable.subscription_status,
        subscription_current_period_end: usersTable.subscription_current_period_end,
        payment_failed_at: usersTable.payment_failed_at,
        stripe_customer_id: usersTable.stripe_customer_id,
        trial_ends_at: usersTable.trial_ends_at,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      return res.json({
        tier: "guest",
        status: "active",
        renewalDate: null,
        trialEndsAt: null,
        inTrial: false,
        paymentFailed: false,
        hasStripeCustomer: false,
      });
    }

    const inTrial =
      user.subscription_status === "trialing" &&
      !!user.trial_ends_at &&
      user.trial_ends_at.getTime() > Date.now();

    return res.json({
      tier: user.subscription_tier,
      status: user.subscription_status,
      renewalDate: user.subscription_current_period_end?.toISOString() ?? null,
      trialEndsAt: user.trial_ends_at?.toISOString() ?? null,
      inTrial,
      paymentFailed: user.subscription_status === "past_due" || user.payment_failed_at !== null,
      hasStripeCustomer: !!user.stripe_customer_id,
    });
  } catch {
    return res.status(500).json({ error: "Unable to retrieve subscription status." });
  }
});

/**
 * GET /referrals/me — returns the user's referral code, share link, and a
 * compact summary of their referral activity for the dashboard.
 */
router.get("/referrals/me", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const code = await ensureReferralCode(userId);

    const [user] = await db
      .select({
        successful: usersTable.referral_count_successful,
        active: usersTable.referral_rewards_active,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const recent = await db
      .select({
        id: referralsTable.id,
        status: referralsTable.status,
        createdAt: referralsTable.created_at,
        rewardedAt: referralsTable.rewarded_at,
      })
      .from(referralsTable)
      .where(eq(referralsTable.referrer_user_id, userId))
      .orderBy(desc(referralsTable.created_at))
      .limit(10);

    const baseUrl = process.env.APP_URL ?? "https://sowiso-01.replit.app";
    const link = `${baseUrl.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;

    return res.json({
      code,
      link,
      successfulCount: user?.successful ?? 0,
      activeRewards: user?.active ?? 0,
      cap: REFERRAL_REWARD_CAP,
      recent,
    });
  } catch (err) {
    console.error("Referral fetch error:", err);
    return res.status(500).json({ error: "Unable to retrieve referral details." });
  }
});

/**
 * POST /referrals/attach — attach a referral code to the current user
 * before they convert to paid. Idempotent; ignores invalid / self codes.
 */
router.post("/referrals/attach", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const { code } = req.body as { code?: string };
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "A referral code is required." });
    }
    // Delegated to the helper so the eligibility rules (no already-paid users,
    // no self-referral, no double-attach) are enforced in one place.
    const result = await attachPendingReferral(userId, code);
    return res.json({ ok: true, ...result });
  } catch {
    return res.status(500).json({ error: "Unable to attach the referral code." });
  }
});

export default router;
