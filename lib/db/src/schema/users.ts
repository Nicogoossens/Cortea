import { pgTable, text, integer, timestamp, json, jsonb, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface EQDimensions {
  self_awareness: number;
  self_regulation: number;
  empathy: number;
  social_skill: number;
}

export interface BehaviorProfile {
  listening_score: number;
  assertiveness_style: "assertive" | "passive" | "aggressive" | "passive_aggressive";
  conflict_mode: "avoid" | "compete" | "collaborate" | "accommodate";
  eq_dimensions: EQDimensions;
  nonverbal_awareness: number;
}

export interface WardrobeItem {
  id: string;
  name: string;
  region: string;
  pillar: number;
  unlocked_at: string;
}

export interface AvatarState {
  rank_badge: string;
  style_tier: number;
}

export const DEFAULT_BEHAVIOR_PROFILE: BehaviorProfile = {
  listening_score: 50,
  assertiveness_style: "assertive",
  conflict_mode: "collaborate",
  eq_dimensions: {
    self_awareness: 50,
    self_regulation: 50,
    empathy: 50,
    social_skill: 50,
  },
  nonverbal_awareness: 50,
};

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),

  full_name: text("full_name"),
  username: text("username"),
  avatar_url: text("avatar_url"),
  email: text("email"),
  email_verified: boolean("email_verified").notNull().default(false),
  verification_token: text("verification_token"),
  token_expires_at: timestamp("token_expires_at"),
  birth_year: integer("birth_year"),
  gender_identity: text("gender_identity"),
  gender_expression: text("gender_expression"),
  noble_score: integer("noble_score").notNull().default(0),
  ambition_level: text("ambition_level").notNull().default("casual"),
  subscription_tier: text("subscription_tier").notNull().default("guest"),
  stripe_customer_id: text("stripe_customer_id"),
  language_code: text("language_code").notNull().default("en"),
  active_region: text("active_region").notNull().default("GB"),
  region_history: json("region_history").$type<string[]>().notNull().default([]),
  created_at: timestamp("created_at").notNull().defaultNow(),
  is_admin: boolean("is_admin").notNull().default(false),
  suspended_at: timestamp("suspended_at"),
  session_token: text("session_token"),
  // Onboarding & profile enrichment
  country_of_origin: text("country_of_origin"),
  // Once set the first time, country_of_origin becomes server-side immutable
  // (only support can override). The client surfaces it as read-only when this
  // timestamp is non-null.
  country_of_origin_locked_at: timestamp("country_of_origin_locked_at"),
  objectives: json("objectives").$type<string[]>().notNull().default([]),
  interests_sports: json("interests_sports").$type<string[]>().notNull().default([]),
  interests_cuisine: json("interests_cuisine").$type<string[]>().notNull().default([]),
  interests_dress_code: json("interests_dress_code").$type<string[]>().notNull().default([]),
  onboarding_completed: boolean("onboarding_completed").notNull().default(false),
  // OAuth / social login
  oauth_provider: text("oauth_provider"),
  oauth_provider_id: text("oauth_provider_id"),
  // Stripe-ready payment fields
  payment_customer_id: text("payment_customer_id"),
  subscription_status: text("subscription_status").notNull().default("active"),
  subscription_current_period_end: timestamp("subscription_current_period_end"),
  payment_failed_at: timestamp("payment_failed_at"),
  trial_ends_at: timestamp("trial_ends_at"),
  // Behavioral psychology layer (Bolton + Goleman + Mehrabian)
  behavior_profile: jsonb("behavior_profile").$type<BehaviorProfile>(),
  // Discrete situational context layer — private, per-account, never shared
  situational_interests: json("situational_interests").$type<string[]>().notNull().default([]),
  // Privacy & device permissions — synced across devices
  privacy_settings: jsonb("privacy_settings").$type<PrivacySettings>(),
  // GDPR Art. 21 — right to object to behavioural profiling.
  // When false, Bolton/EQ/Mehrabian writes are suppressed for this user.
  profiling_consent: boolean("profiling_consent").notNull().default(true),
  // Password-based authentication
  password_hash: text("password_hash"),
  // Gamification layer — streak, avatar, wardrobe
  daily_streak: integer("daily_streak").notNull().default(0),
  last_activity_date: text("last_activity_date"),
  avatar_state: json("avatar_state").$type<AvatarState>(),
  wardrobe_unlocks: json("wardrobe_unlocks").$type<WardrobeItem[]>().notNull().default([]),
  // Digital Calling Card personalisation
  calling_card_tagline: text("calling_card_tagline"),
  // Campaign attribution (UTM parameters captured on first visit)
  utm_source: text("utm_source"),
  utm_medium: text("utm_medium"),
  utm_campaign: text("utm_campaign"),
  utm_content: text("utm_content"),
  utm_term: text("utm_term"),
  // Referral system — every user has a unique code; new signups may carry one
  referral_code: text("referral_code"),
  referred_by_user_id: text("referred_by_user_id"),
  pending_referral_code: text("pending_referral_code"),
  referral_count_successful: integer("referral_count_successful").notNull().default(0),
  referral_rewards_active: integer("referral_rewards_active").notNull().default(0),
  // SMS contact for trial / billing notifications (E.164)
  phone_number: text("phone_number"),
  // Idempotency for the 3-day-before-trial-end reminder
  trial_reminder_sent_at: timestamp("trial_reminder_sent_at"),
  // First moment the user converted from free/guest to a paid subscription.
  // Gates the referral reward so it can only fire once per user, even if
  // Stripe sends repeated subscription.updated events.
  first_paid_at: timestamp("first_paid_at"),
  // Snapshot of the user's tier prior to a referral reward. The reward
  // sweeper reverts subscription_tier back to this value at expiry.
  pre_referral_tier: text("pre_referral_tier"),
  referral_reward_ends_at: timestamp("referral_reward_ends_at"),
  // True billing tier from Stripe, kept separate from the effective
  // (possibly reward-elevated) subscription_tier so webhook syncs cannot
  // silently revoke an active referral reward.
  billing_tier: text("billing_tier"),
}, (t) => [
  check("users_ambition_level_check", sql`${t.ambition_level} IN ('casual', 'professional', 'diplomatic')`),
]);

export interface PrivacySettings {
  incognito: boolean;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  locationEnabled: boolean;
  autoCleanup: boolean;
  rememberPreferences: boolean;
}

export const insertUserSchema = createInsertSchema(usersTable).omit({ created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
