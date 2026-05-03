/**
 * Scheduled job: 3 days before a trial ends, dispatch an email + SMS reminder.
 *
 * Idempotent — uses `users.trial_reminder_sent_at` to ensure at most one
 * reminder per trial cycle. Cleared automatically when a new trial begins
 * (handled by the Stripe webhook that resets `trial_ends_at`).
 *
 * Sweep interval: every 6 hours. The window queried is
 *   trial_ends_at BETWEEN now() AND now() + 4 days
 * so a single missed run still catches the user before their trial ends.
 */
import { db, usersTable } from "@workspace/db";
import { and, eq, isNull, gte, lte, isNotNull } from "drizzle-orm";
import { logger } from "./logger";
import { getTierFeatures, type SubscriptionTier } from "./tier-features";
import { sendTrialEndReminder } from "./billing-notifications";
import { revertExpiredReferralRewards } from "./referral";

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
// Requirement: notify ~3 days before trial end. We pick a tight window
// (between ~2.5 and ~3.5 days remaining) so a sweep that runs every 6h
// will reliably catch every user exactly once per trial cycle without
// firing too early or too late.
const WINDOW_LOWER_HOURS = 60; // 2.5 days from now
const WINDOW_UPPER_HOURS = 84; // 3.5 days from now
let timer: NodeJS.Timeout | null = null;
let busy = false;

async function tick(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    const now = new Date();
    const lower = new Date(now.getTime() + WINDOW_LOWER_HOURS * 60 * 60 * 1000);
    const upper = new Date(now.getTime() + WINDOW_UPPER_HOURS * 60 * 60 * 1000);

    const candidates = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        phone: usersTable.phone_number,
        fullName: usersTable.full_name,
        tier: usersTable.subscription_tier,
        trialEndsAt: usersTable.trial_ends_at,
      })
      .from(usersTable)
      .where(
        and(
          isNull(usersTable.trial_reminder_sent_at),
          isNotNull(usersTable.trial_ends_at),
          gte(usersTable.trial_ends_at, lower),
          lte(usersTable.trial_ends_at, upper),
          eq(usersTable.subscription_status, "trialing")
        )
      )
      .limit(200);

    for (const c of candidates) {
      if (!c.trialEndsAt) continue;
      const daysRemaining = Math.max(
        1,
        Math.ceil((c.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      );
      try {
        await sendTrialEndReminder({
          email: c.email,
          phone: c.phone,
          fullName: c.fullName,
          tierDisplayName: getTierFeatures(c.tier as SubscriptionTier).displayName,
          daysRemaining,
          endsAt: c.trialEndsAt,
        });
        await db
          .update(usersTable)
          .set({ trial_reminder_sent_at: new Date() })
          .where(eq(usersTable.id, c.id));
        logger.info({ userId: c.id, daysRemaining }, "Trial-end reminder dispatched");
      } catch (err) {
        logger.error({ err, userId: c.id }, "Failed to dispatch trial-end reminder");
      }
    }
  } catch (err) {
    logger.error({ err }, "Trial reminder sweeper tick failed");
  } finally {
    busy = false;
  }

  // Piggy-back the referral-reward expiry sweep on the same cadence —
  // it's tiny and runs at most twice a day.
  try {
    const reverted = await revertExpiredReferralRewards();
    if (reverted > 0) logger.info({ reverted }, "Reverted expired referral rewards");
  } catch (err) {
    logger.error({ err }, "Referral reward expiry sweep failed");
  }
}

export function startTrialReminderSweeper(intervalMs: number = SWEEP_INTERVAL_MS): void {
  if (timer) return;
  // First run after 60s so boot is not blocked.
  setTimeout(() => void tick(), 60 * 1000).unref();
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  logger.info({ intervalMs }, "Trial reminder sweeper started");
}
