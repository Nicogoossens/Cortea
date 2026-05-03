import { Router } from "express";
import { db } from "@workspace/db";
import { guidesTable, purchasedGuidesTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

router.get("/guides", async (req, res) => {
  try {
    const guides = await db.select().from(guidesTable).orderBy(guidesTable.created_at);
    return res.json(guides);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch guides");
    return res.status(500).json({ error: "Unable to retrieve guides at this time." });
  }
});

router.get("/guides/purchased", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const purchased = await db
      .select({
        id: guidesTable.id,
        title: guidesTable.title,
        description: guidesTable.description,
        pillar: guidesTable.pillar,
        region_code: guidesTable.region_code,
        price_cents: guidesTable.price_cents,
        tier_required: guidesTable.tier_required,
        purchased_at: purchasedGuidesTable.purchased_at,
      })
      .from(purchasedGuidesTable)
      .innerJoin(guidesTable, eq(purchasedGuidesTable.guide_id, guidesTable.id))
      .where(eq(purchasedGuidesTable.user_id, userId));

    return res.json(purchased);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch purchased guides");
    return res.status(500).json({ error: "Unable to retrieve your purchased guides." });
  }
});

router.post("/guides/:id/checkout", requireAuthUser, async (req, res) => {
  try {
    const userId = getResolvedUserId(req);
    const guideId = req.params.id;

    const [guide] = await db.select().from(guidesTable).where(eq(guidesTable.id, guideId)).limit(1);
    if (!guide) {
      return res.status(404).json({ error: "The requested guide could not be found." });
    }

    const [alreadyOwned] = await db
      .select({ id: purchasedGuidesTable.id })
      .from(purchasedGuidesTable)
      .where(and(
        eq(purchasedGuidesTable.user_id, userId),
        eq(purchasedGuidesTable.guide_id, guideId),
      ))
      .limit(1);

    if (alreadyOwned) {
      return res.status(409).json({ error: "You already have access to this guide." });
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

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:3000";

    const lineItem: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem = guide.stripe_price_id
      ? { price: guide.stripe_price_id, quantity: 1 }
      : {
          price_data: {
            currency: "eur",
            product_data: { name: guide.title, description: guide.description ?? undefined },
            unit_amount: guide.price_cents,
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [lineItem],
      mode: "payment",
      success_url: `${baseUrl}/guides?purchase=success`,
      cancel_url: `${baseUrl}/guides`,
      metadata: { userId, guideId, type: "guide_purchase" },
    });

    return res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Guide checkout error");
    return res.status(500).json({ error: "Unable to initiate the purchase at this time." });
  }
});

export default router;
