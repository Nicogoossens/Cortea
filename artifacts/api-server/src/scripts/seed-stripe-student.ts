/**
 * Seed (or re-verify) the "Student" Stripe product + monthly/yearly prices.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... pnpm --filter @workspace/api-server tsx src/scripts/seed-stripe-student.ts
 *
 * Idempotent — safe to run repeatedly. Prints the resulting product / price IDs.
 *
 * After running, capture the printed IDs in your records:
 *   • product:  prod_...
 *   • monthly:  price_... (€4.99 / month, EUR)
 *   • yearly:   price_... (€39.00 / year, EUR)
 */
import { ensureStudentProduct } from "../routes/stripe-admin";

async function main() {
  const summary = await ensureStudentProduct();
  console.log("✓ Student tier seeded in Stripe");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
