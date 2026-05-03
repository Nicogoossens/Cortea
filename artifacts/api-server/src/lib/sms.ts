/**
 * SMS notification helper — uses Twilio.
 *
 * Required environment variables when SMS delivery is desired:
 *   TWILIO_ACCOUNT_SID  — Twilio account SID (starts with "AC...")
 *   TWILIO_AUTH_TOKEN   — Twilio auth token
 *   TWILIO_FROM_NUMBER  — E.164 sender number, e.g. "+12025551234"
 *
 * If any of these are missing, sendSms() logs the message and returns
 * { sent: false } instead of throwing — the calling flow (trial reminder,
 * cancel confirmation) continues to work; only the SMS leg is skipped.
 */
import { logger } from "./logger";

export interface SendSmsOptions {
  to: string; // E.164
  body: string;
}

export interface SendSmsResult {
  sent: boolean;
  reason?: string;
}

export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendSms({ to, body }: SendSmsOptions): Promise<SendSmsResult> {
  if (!to) return { sent: false, reason: "no recipient phone number" };

  if (!isSmsConfigured()) {
    logger.warn(
      { to, body: body.slice(0, 80) },
      "SMS not configured (TWILIO_* vars missing) — message logged, not delivered"
    );
    console.log("\n" + "=".repeat(70));
    console.log("  CORTÉA SMS (Twilio not configured)");
    console.log("=".repeat(70));
    console.log(`  To:   ${to}`);
    console.log(`  Body: ${body}`);
    console.log("=".repeat(70) + "\n");
    return { sent: false, reason: "twilio not configured" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams({ To: to, From: from, Body: body });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error({ to, status: res.status, body: text.slice(0, 300) }, "Twilio SMS send failed");
      return { sent: false, reason: `twilio ${res.status}` };
    }
    logger.info({ to }, "SMS sent via Twilio");
    return { sent: true };
  } catch (err) {
    logger.error({ err, to }, "SMS send exception");
    return { sent: false, reason: "exception" };
  }
}
