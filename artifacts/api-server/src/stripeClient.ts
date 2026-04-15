import Stripe from "stripe";

/**
 * Creates a fresh Stripe client using credentials from the Replit Stripe connector.
 * Throws if the connector is not configured (no Stripe credentials in environment).
 */
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
  return new Stripe(data.settings.secret_key, { apiVersion: "2026-03-25.dahlia" });
}
