-- Migration 0019: Referral system, trial reminders, and Concierge tier
-- Adds per-user referral codes, referral tracking, and a flag to prevent
-- duplicate trial-end reminders.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by_user_id text,
  ADD COLUMN IF NOT EXISTS pending_referral_code text,
  ADD COLUMN IF NOT EXISTS referral_count_successful integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_rewards_active integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS trial_reminder_sent_at timestamp,
  -- First moment the user transitioned into a paid subscription. Used to
  -- gate the referral reward to that one event so a returning paying user
  -- cannot grant themselves further referral rewards.
  ADD COLUMN IF NOT EXISTS first_paid_at timestamp,
  -- Free 1-month tier bump granted by a referral. When set, a sweeper
  -- reverts subscription_tier to pre_referral_tier at expiry. This is
  -- entirely separate from Stripe's billing period.
  ADD COLUMN IF NOT EXISTS pre_referral_tier text,
  ADD COLUMN IF NOT EXISTS referral_reward_ends_at timestamp,
  -- True billing tier as reported by Stripe. `subscription_tier` is the
  -- *effective* access tier, which may be temporarily elevated above
  -- `billing_tier` while a referral reward is active. Webhooks always write
  -- billing_tier; subscription_tier is only overwritten when no reward
  -- overlay is active (or when Stripe tier already exceeds the reward).
  ADD COLUMN IF NOT EXISTS billing_tier text;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_uniq ON users(referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id text PRIMARY KEY,
  referrer_user_id text NOT NULL,
  referred_user_id text NOT NULL UNIQUE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT now(),
  converted_at timestamp,
  rewarded_at timestamp
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals(status);

COMMENT ON COLUMN users.referral_code IS 'Unique short code shared by this user to refer others (e.g. CRT-7H3K)';
COMMENT ON COLUMN users.pending_referral_code IS 'Referral code captured at signup, consumed on first paid conversion';
COMMENT ON COLUMN users.referral_rewards_active IS 'Number of currently active 1-month upgrade rewards earned via referrals';
COMMENT ON COLUMN users.phone_number IS 'E.164 phone number for SMS notifications (trial reminders, cancellations)';
