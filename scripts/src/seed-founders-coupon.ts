import { getUncachableStripeClient } from "./stripeClient.js";

const COUPON_ID = "FOUNDERS100";

async function main() {
  const stripe = await getUncachableStripeClient();
  console.log(`Seeding Stripe coupon ${COUPON_ID} (1 month free Traveller, max 100 redemptions)...`);

  try {
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    console.log(`Coupon already exists: ${existing.id} (${existing.percent_off}% off, ${existing.times_redeemed}/${existing.max_redemptions ?? "∞"} used)`);
    return;
  } catch {
    // Not found — create it.
  }

  const coupon = await stripe.coupons.create({
    id: COUPON_ID,
    percent_off: 100,
    duration: "once",
    max_redemptions: 100,
    name: "Founding 100 — first month free",
  });
  console.log(`Created coupon ${coupon.id} (${coupon.percent_off}% off, max ${coupon.max_redemptions} redemptions).`);
}

main().catch((err) => {
  console.error("Failed to seed founders coupon:", err.message ?? err);
  process.exit(1);
});
