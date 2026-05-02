import Stripe from "stripe";

/**
 * Creates a fresh Stripe client.
 *
 * Resolution order:
 *  1. Direct STRIPE_SECRET_KEY environment variable (user-provided secret).
 *  2. Replit Stripe connector (OAuth-managed, used if the connector is configured).
 *
 * Throws if neither source yields a valid key.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const directKey = process.env.STRIPE_SECRET_KEY;
  if (directKey) {
    return new Stripe(directKey, { apiVersion: "2026-03-25.dahlia" });
  }

  const connectorHostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (connectorHostname) {
    const res = await fetch(
      `https://${connectorHostname}/connectors/ccfg_stripe_default_org_ernmlb/connection`,
      {
        headers: {
          "X-Replit-Identity": process.env.REPL_IDENTITY ?? "",
          Authorization: `Bearer ${process.env.WEB_REPL_RENEWAL}`,
        },
      }
    );

    if (res.ok) {
      const data = (await res.json()) as { settings: { secret_key: string } };
      return new Stripe(data.settings.secret_key, { apiVersion: "2026-03-25.dahlia" });
    }
  }

  throw new Error(
    "Stripe is not configured. Please add your STRIPE_SECRET_KEY to the environment secrets."
  );
}
