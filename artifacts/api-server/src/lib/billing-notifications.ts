/**
 * Trial-end and cancellation notifications — email + SMS (best effort).
 *
 * Wired from:
 *  - the trial-reminder sweeper (3 days before trial_ends_at)
 *  - the subscription-cancel route and the customer.subscription.deleted webhook
 */
import nodemailer from "nodemailer";
import { logger } from "./logger";
import { sendSms } from "./sms";

const FROM_NAME = "Cortéa";
const FROM_ADDRESS = process.env.SMTP_FROM ?? "noreply@sowiso.app";
const BASE_PATH = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
const APP_URL = process.env.APP_URL ?? `https://sowiso-01.replit.app${BASE_PATH}`;

function smtpTransport() {
  if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transport = smtpTransport();
  if (!transport) {
    logger.warn({ to, subject }, "SMTP not configured — billing notification email logged only");
    return false;
  }
  try {
    await transport.sendMail({ from: `"${FROM_NAME}" <${FROM_ADDRESS}>`, to, subject, html });
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Failed to send billing notification email");
    return false;
  }
}

export interface TrialReminderInput {
  email: string | null;
  phone: string | null;
  fullName: string | null;
  tierDisplayName: string;
  daysRemaining: number;
  endsAt: Date;
}

export async function sendTrialEndReminder(input: TrialReminderInput): Promise<void> {
  const cancelUrl = `${APP_URL}/membership`;
  const greeting = input.fullName ? `Dear ${input.fullName.split(" ")[0]},` : "Dear distinguished guest,";
  const subject = `Your Cortéa ${input.tierDisplayName} trial ends in ${input.daysRemaining} days`;
  const html = `<!DOCTYPE html><html><body style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2a2a2a;">
    <h1 style="font-size: 22px; font-weight: 400;">A gentle reminder</h1>
    <p>${greeting}</p>
    <p>Your complimentary 60-day trial of <strong>${input.tierDisplayName}</strong> concludes on
    <strong>${input.endsAt.toUTCString().replace(" GMT", "")}</strong>.
    Should you wish to continue, no action is required &mdash; the agreed amount will be charged to the card on file.</p>
    <p>Should you prefer to part ways, you may cancel in a single click from your account:</p>
    <p style="margin: 20px 0;"><a href="${cancelUrl}" style="background:#1a1a1a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:2px;font-family:Georgia,serif;">Manage your membership</a></p>
    <p style="color:#777;font-size:13px;">With our compliments,<br/>The Cortéa team</p>
  </body></html>`;

  if (input.email) {
    await sendEmail(input.email, subject, html);
  }
  if (input.phone) {
    await sendSms({
      to: input.phone,
      body: `Cortéa: your ${input.tierDisplayName} trial ends in ${input.daysRemaining} days. Cancel anytime: ${cancelUrl}`,
    });
  }
}

export interface CancellationInput {
  email: string | null;
  phone: string | null;
  fullName: string | null;
  duringTrial: boolean;
}

export async function sendCancellationConfirmation(input: CancellationInput): Promise<void> {
  const greeting = input.fullName ? `Dear ${input.fullName.split(" ")[0]},` : "Dear distinguished guest,";
  const subject = input.duringTrial
    ? "Your Cortéa trial has been ended — no charge"
    : "Your Cortéa membership has been cancelled";
  const body = input.duringTrial
    ? "Your trial has been ended at your request. No payment will be taken."
    : "Your membership will remain active until the end of your current billing period; thereafter no further charges will be made.";
  const html = `<!DOCTYPE html><html><body style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2a2a2a;">
    <h1 style="font-size: 22px; font-weight: 400;">Confirmed</h1>
    <p>${greeting}</p>
    <p>${body}</p>
    <p>Should you wish to return, your account remains here for you.</p>
    <p style="color:#777;font-size:13px;">With our compliments,<br/>The Cortéa team</p>
  </body></html>`;

  if (input.email) {
    await sendEmail(input.email, subject, html);
  }
  if (input.phone) {
    await sendSms({
      to: input.phone,
      body: input.duringTrial
        ? "Cortéa: your trial has been ended. No payment was taken."
        : "Cortéa: your membership has been cancelled. Access continues until the end of your current period.",
    });
  }
}
