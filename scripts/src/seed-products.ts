import { getUncachableStripeClient } from "./stripeClient.js";

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log("Creating SOWISO subscription products in Stripe...");

  const travellerSearch = await stripe.products.search({
    query: "metadata['tier']:'traveller' AND active:'true'",
  });

  if (travellerSearch.data.length > 0) {
    console.log("The Traveller product already exists:", travellerSearch.data[0].id);
  } else {
    const traveller = await stripe.products.create({
      name: "The Traveller",
      description: "All regions unlocked, complete Cultural Compass, AI-Counsel without restraint.",
      metadata: { tier: "traveller" },
    });
    console.log("Created The Traveller:", traveller.id);

    const travellerMonthly = await stripe.prices.create({
      product: traveller.id,
      unit_amount: 999,
      currency: "eur",
      recurring: { interval: "month" },
    });
    console.log("Created monthly price €9.99:", travellerMonthly.id);

    const travellerYearly = await stripe.prices.create({
      product: traveller.id,
      unit_amount: 7900,
      currency: "eur",
      recurring: { interval: "year" },
    });
    console.log("Created yearly price €79:", travellerYearly.id);
  }

  const ambassadorSearch = await stripe.products.search({
    query: "metadata['tier']:'ambassador' AND active:'true'",
  });

  if (ambassadorSearch.data.length > 0) {
    console.log("The Ambassador product already exists:", ambassadorSearch.data[0].id);
  } else {
    const ambassador = await stripe.products.create({
      name: "The Ambassador",
      description: "All Traveller privileges plus Mirror, Inner Circle, and Sensory Awareness access.",
      metadata: { tier: "ambassador" },
    });
    console.log("Created The Ambassador:", ambassador.id);

    const ambassadorMonthly = await stripe.prices.create({
      product: ambassador.id,
      unit_amount: 2900,
      currency: "eur",
      recurring: { interval: "month" },
    });
    console.log("Created monthly price €29:", ambassadorMonthly.id);

    const ambassadorYearly = await stripe.prices.create({
      product: ambassador.id,
      unit_amount: 24900,
      currency: "eur",
      recurring: { interval: "year" },
    });
    console.log("Created yearly price €249:", ambassadorYearly.id);
  }

  console.log("\nDone. Webhooks will sync these products to the database automatically.");
}

createProducts().catch((err) => {
  console.error("Error creating products:", err.message);
  process.exit(1);
});
