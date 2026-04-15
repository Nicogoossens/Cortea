import { getUncachableStripeClient } from "./stripeClient";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
        "Received type: " + typeof payload + ". " +
        "This usually means express.json() parsed the body before reaching this handler. " +
        "FIX: Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      return;
    }

    const stripe = await getUncachableStripeClient();
    stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  }
}
