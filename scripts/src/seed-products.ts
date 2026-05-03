import { getUncachableStripeClient } from "./stripeClient.js";
import type Stripe from "stripe";

interface TierSeed {
  tier: "student" | "traveller" | "ambassador" | "concierge";
  name: string;
  description: string;
  monthly: number; // cents EUR
  yearly: number; // cents EUR
}

const TIERS: TierSeed[] = [
  {
    tier: "student",
    name: "The Student",
    description: "All Cultural Compass regions, dedicated student pillars, scenarios up to advanced level.",
    monthly: 499, // €4.99
    yearly: 3900, // €39.00 (~35% off)
  },
  {
    tier: "traveller",
    name: "The Traveller",
    description: "All regions unlocked, complete Cultural Compass, AI-Counsel without restraint. 14-day free trial.",
    monthly: 999, // €9.99
    yearly: 7900, // €79.00 (~34% off)
  },
  {
    tier: "ambassador",
    name: "The Ambassador",
    description: "All Traveller privileges plus Mirror, Inner Circle, and Sensory Awareness access. 14-day free trial.",
    monthly: 3900, // €39.00
    yearly: 29900, // €299.00 (~36% off)
  },
  {
    tier: "concierge",
    name: "The Concierge",
    description: "Premium tier with white-glove cultural concierge, priority Counsel responses, dedicated cultural strategist, exclusive Inner Circle access, and bespoke pre-trip briefings.",
    monthly: 14900, // €149.00
    yearly: 149000, // €1,490.00 (~17% off)
  },
];

async function ensurePrice(
  stripe: Stripe,
  productId: string,
  interval: "month" | "year",
  expectedAmount: number,
  nickname: string
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const candidates = prices.data.filter((p) => p.recurring?.interval === interval && p.currency === "eur");
  const match = candidates.find((p) => p.unit_amount === expectedAmount);
  if (match) return match;
  // Deactivate any wrong-amount price for the same interval so we have one canonical price.
  for (const wrong of candidates) {
    await stripe.prices.update(wrong.id, { active: false });
  }
  return stripe.prices.create({
    product: productId,
    unit_amount: expectedAmount,
    currency: "eur",
    recurring: { interval },
    nickname,
  });
}

async function ensureProduct(stripe: Stripe, seed: TierSeed): Promise<void> {
  const search = await stripe.products.search({
    query: `metadata['tier']:'${seed.tier}' AND active:'true'`,
  });

  let product: Stripe.Product;
  if (search.data.length > 0) {
    product = search.data[0];
    // Keep name/description in sync so the UI reflects current marketing copy.
    if (product.name !== seed.name || product.description !== seed.description) {
      product = await stripe.products.update(product.id, {
        name: seed.name,
        description: seed.description,
      });
    }
    console.log(`✓ ${seed.name} (${product.id}) — updating prices if needed`);
  } else {
    product = await stripe.products.create({
      name: seed.name,
      description: seed.description,
      metadata: { tier: seed.tier },
    });
    console.log(`+ Created ${seed.name}: ${product.id}`);
  }

  const monthly = await ensurePrice(stripe, product.id, "month", seed.monthly, `${seed.name} – monthly`);
  const yearly = await ensurePrice(stripe, product.id, "year", seed.yearly, `${seed.name} – yearly`);
  console.log(`  monthly: ${(seed.monthly / 100).toFixed(2)} EUR (${monthly.id})`);
  console.log(`  yearly:  ${(seed.yearly / 100).toFixed(2)} EUR (${yearly.id})`);

  if (!product.default_price) {
    await stripe.products.update(product.id, { default_price: monthly.id });
  }
}

async function createProducts() {
  const stripe = await getUncachableStripeClient();
  console.log("Seeding SOWISO subscription products in Stripe...\n");
  for (const seed of TIERS) {
    await ensureProduct(stripe, seed);
  }
  console.log("\nDone. Webhooks will sync these products to the database automatically.");
}

createProducts().catch((err) => {
  console.error("Error creating products:", err.message);
  process.exit(1);
});
