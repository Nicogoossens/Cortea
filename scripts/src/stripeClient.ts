import { StripeSync } from "stripe-replit-sync";
import Stripe from "stripe";

let stripeSyncInstance: StripeSync | null = null;

export async function getUncachableStripeClient(): Promise<Stripe> {
  const res = await fetch(
    `https://${process.env.REPLIT_CONNECTORS_HOSTNAME}/connectors/ccfg_stripe_default_org_ernmlb/connection`,
    {
      headers: {
        "X-Replit-Identity": process.env.REPL_IDENTITY ?? "",
        Authorization: `Bearer ${process.env.WEB_REPL_RENEWAL}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch Stripe credentials: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { settings: { secret_key: string } };
  return new Stripe(data.settings.secret_key, { apiVersion: "2025-04-30.basil" });
}

export async function getStripeSync(): Promise<StripeSync> {
  if (stripeSyncInstance) return stripeSyncInstance;

  const stripe = await getUncachableStripeClient();
  stripeSyncInstance = new StripeSync(stripe, process.env.DATABASE_URL!);
  return stripeSyncInstance;
}
