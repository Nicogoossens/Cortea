/**
 * Referral helpers — code generation, lookup, and reward grant.
 *
 * Reward rule: when a referred user converts to a paid plan **for the first
 * time ever** (gated by `users.first_paid_at`), both parties receive a
 * 1-month upgrade to the next tier (Traveller → Ambassador, Ambassador →
 * Concierge). Capped at 3 successful referrals per referrer.
 *
 * The reward is local-DB-only: we snapshot the user's current tier into
 * `pre_referral_tier`, set `subscription_tier` to the next rung, and stamp
 * `referral_reward_ends_at`. We never touch `subscription_current_period_end`
 * — Stripe remains the source of truth for billing dates. A periodic sweep
 * (`revertExpiredReferralRewards`) reverts the tier when the reward expires.
 */
import { db, usersTable, referralsTable } from "@workspace/db";
import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { randomBytes, randomUUID } from "crypto";
import { TIER_UPGRADE_LADDER, TIER_RANK, type SubscriptionTier } from "./tier-features";
import { logger } from "./logger";

export const REFERRAL_REWARD_CAP = 3;
export const REFERRAL_REWARD_DAYS = 30;

/** Tiers that count as "paying" for first-conversion gating. */
const PAID_TIERS: ReadonlySet<SubscriptionTier> = new Set([
  "student",
  "traveller",
  "ambassador",
  "concierge",
]);

export function isPaidTier(tier: string | null | undefined): boolean {
  return !!tier && PAID_TIERS.has(tier as SubscriptionTier);
}

function generateCode(): string {
  // 6-char alnum, easy to read aloud (no 0/O/1/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `CRT-${out}`;
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const [user] = await db
    .select({ code: usersTable.referral_code })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (user?.code) return user.code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = generateCode();
    try {
      await db
        .update(usersTable)
        .set({ referral_code: candidate })
        .where(eq(usersTable.id, userId));
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error("Unable to allocate a referral code after several attempts.");
}

export async function findReferrerByCode(code: string): Promise<{ id: string; tier: SubscriptionTier } | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;
  const [row] = await db
    .select({ id: usersTable.id, tier: usersTable.subscription_tier })
    .from(usersTable)
    .where(eq(usersTable.referral_code, trimmed))
    .limit(1);
  if (!row) return null;
  return { id: row.id, tier: row.tier as SubscriptionTier };
}

/**
 * Stamp a pending referral on the referred user. Refuses if the user has
 * already converted to a paid plan or already has a referrer recorded —
 * preventing existing customers from retroactively granting themselves
 * (or another) a referral reward.
 */
export async function attachPendingReferral(
  referredUserId: string,
  code: string
): Promise<{ applied: boolean; reason?: string }> {
  const [referred] = await db
    .select({
      tier: usersTable.subscription_tier,
      firstPaid: usersTable.first_paid_at,
      already: usersTable.referred_by_user_id,
    })
    .from(usersTable)
    .where(eq(usersTable.id, referredUserId))
    .limit(1);
  if (!referred) return { applied: false, reason: "user_not_found" };
  if (referred.firstPaid || isPaidTier(referred.tier)) {
    return { applied: false, reason: "already_paid" };
  }
  if (referred.already) return { applied: false, reason: "already_referred" };

  const referrer = await findReferrerByCode(code);
  if (!referrer || referrer.id === referredUserId) {
    return { applied: false, reason: "invalid_code" };
  }

  await db
    .update(usersTable)
    .set({
      pending_referral_code: code.trim().toUpperCase(),
      referred_by_user_id: referrer.id,
    })
    .where(eq(usersTable.id, referredUserId));
  return { applied: true };
}

/**
 * Called from the Stripe webhook on a paid-status event. Atomically marks
 * `first_paid_at` and only grants the referral reward when this is in fact
 * the user's first paid conversion. Subsequent calls (renewals, plan
 * upgrades, trial→active transitions for an already-converted user) are
 * no-ops, eliminating the abuse path flagged in review.
 */
export async function grantReferralRewardOnFirstPaid(
  referredUserId: string
): Promise<{ granted: boolean; reason?: string }> {
  // Step 1 — atomic "first paid" claim. Only the row whose first_paid_at is
  // still NULL is updated, and we get exactly one row back the first time.
  const claimed = await db
    .update(usersTable)
    .set({ first_paid_at: new Date() })
    .where(and(eq(usersTable.id, referredUserId), sql`${usersTable.first_paid_at} IS NULL`))
    .returning({ id: usersTable.id, pending: usersTable.pending_referral_code });

  if (claimed.length === 0) {
    return { granted: false, reason: "not_first_paid" };
  }
  const code = claimed[0].pending;
  if (!code) {
    return { granted: false, reason: "no_pending_code" };
  }

  const referrer = await findReferrerByCode(code);
  if (!referrer || referrer.id === referredUserId) {
    await db
      .update(usersTable)
      .set({ pending_referral_code: null })
      .where(eq(usersTable.id, referredUserId));
    return { granted: false, reason: "invalid_code" };
  }

  const [referrerRow] = await db
    .select({ successful: usersTable.referral_count_successful })
    .from(usersTable)
    .where(eq(usersTable.id, referrer.id))
    .limit(1);
  if (!referrerRow) return { granted: false, reason: "referrer_missing" };

  const overCap = (referrerRow.successful ?? 0) >= REFERRAL_REWARD_CAP;

  // Idempotency: UNIQUE(referred_user_id) on referrals prevents doubles.
  try {
    await db.insert(referralsTable).values({
      id: randomUUID(),
      referrer_user_id: referrer.id,
      referred_user_id: referredUserId,
      referral_code: code,
      status: overCap ? "converted_no_reward" : "rewarded",
      converted_at: new Date(),
      rewarded_at: overCap ? null : new Date(),
    });
  } catch {
    await db
      .update(usersTable)
      .set({ pending_referral_code: null })
      .where(eq(usersTable.id, referredUserId));
    return { granted: false, reason: "already_recorded" };
  }

  await db
    .update(usersTable)
    .set({ pending_referral_code: null })
    .where(eq(usersTable.id, referredUserId));

  if (overCap) {
    await db
      .update(usersTable)
      .set({ referral_count_successful: sql`${usersTable.referral_count_successful} + 1` })
      .where(eq(usersTable.id, referrer.id));
    return { granted: true, reason: "cap_reached_no_upgrade" };
  }

  await db
    .update(usersTable)
    .set({
      referral_count_successful: sql`${usersTable.referral_count_successful} + 1`,
      referral_rewards_active: sql`${usersTable.referral_rewards_active} + 1`,
    })
    .where(eq(usersTable.id, referrer.id));

  await applyReferralUpgrade(referrer.id);
  await applyReferralUpgrade(referredUserId);
  return { granted: true };
}

/**
 * Local-only 1-month tier bump. Records the pre-reward tier so the sweeper
 * can revert later. Does NOT touch `subscription_current_period_end` —
 * Stripe is the sole owner of that field.
 *
 * If the user already has an active reward, we extend the expiry by 30 days
 * rather than stacking another bump (keeps tiers monotone & predictable).
 */
export async function applyReferralUpgrade(userId: string): Promise<void> {
  const [user] = await db
    .select({
      tier: usersTable.subscription_tier,
      billingTier: usersTable.billing_tier,
      preTier: usersTable.pre_referral_tier,
      rewardEnds: usersTable.referral_reward_ends_at,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return;

  const now = Date.now();
  const hasActiveReward = !!user.rewardEnds && user.rewardEnds.getTime() > now;

  if (hasActiveReward) {
    // Extend, don't stack.
    const ext = new Date(user.rewardEnds!.getTime() + REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000);
    await db
      .update(usersTable)
      .set({ referral_reward_ends_at: ext })
      .where(eq(usersTable.id, userId));
    return;
  }

  const currentTier = user.tier as SubscriptionTier;
  const next = TIER_UPGRADE_LADDER[currentTier];
  if (!next) return; // Concierge has no further tier

  // Snapshot the *billing* tier (Stripe truth) as the rollback target so
  // that, when the reward expires, we revert to whatever Stripe actually
  // bills the user for — never to a stale pre-reward access tier.
  const rollbackTier =
    (user.billingTier as SubscriptionTier | null) ?? currentTier;

  const ends = new Date(now + REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000);
  await db
    .update(usersTable)
    .set({
      subscription_tier: next,
      pre_referral_tier: rollbackTier,
      referral_reward_ends_at: ends,
      // NB: billing_tier and subscription_current_period_end intentionally untouched.
    })
    .where(eq(usersTable.id, userId));
}

/**
 * Sweep: reverts users whose referral reward window has expired back to
 * their pre-reward tier. Idempotent — clears the reward fields after revert.
 */
export async function revertExpiredReferralRewards(): Promise<number> {
  const now = new Date();
  const expired = await db
    .select({
      id: usersTable.id,
      tier: usersTable.subscription_tier,
      preTier: usersTable.pre_referral_tier,
      billingTier: usersTable.billing_tier,
    })
    .from(usersTable)
    .where(
      and(
        isNotNull(usersTable.referral_reward_ends_at),
        lte(usersTable.referral_reward_ends_at, now)
      )
    )
    .limit(500);

  let reverted = 0;
  for (const u of expired) {
    try {
      // Revert target precedence:
      //   1. The current billing_tier (Stripe truth) — covers the case where
      //      the user has upgraded or downgraded via Stripe during the reward
      //      window. We always honour Stripe at expiry.
      //   2. The pre_referral_tier snapshot taken at grant time.
      //   3. As a last resort the current effective tier (no-op).
      const target = (u.billingTier ?? u.preTier ?? u.tier) as SubscriptionTier;
      const current = u.tier as SubscriptionTier;
      // Only step the tier *down*; if the user has meanwhile upgraded above
      // the rewarded tier we keep their higher access intact.
      const next = TIER_RANK[current] > TIER_RANK[target] ? target : current;
      await db
        .update(usersTable)
        .set({
          subscription_tier: next,
          pre_referral_tier: null,
          referral_reward_ends_at: null,
          referral_rewards_active: sql`GREATEST(${usersTable.referral_rewards_active} - 1, 0)`,
        })
        .where(eq(usersTable.id, u.id));
      reverted++;
    } catch (err) {
      logger.error({ err, userId: u.id }, "Failed to revert expired referral reward");
    }
  }
  return reverted;
}
