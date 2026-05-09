import { pgTable, text, integer, timestamp, json, jsonb, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface CompassScores {
  attentiveness: number;
  composure:     number;
  discernment:   number;
  diplomacy:     number;
  presence:      number;
}

export const DEFAULT_COMPASS_SCORES: CompassScores = {
  attentiveness: 50,
  composure:     50,
  discernment:   50,
  diplomacy:     50,
  presence:      50,
};

export interface RegisterBiasSignal {
  signal:      string;  // e.g. "onboarding_world_choice", "social_circle_elite"
  weight:      number;  // contribution to bias score (positive = elite, negative = middle_class)
  recorded_at: string;  // ISO timestamp
}

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
  session_token_created_at: timestamp("session_token_created_at"),
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
  // Language preference: true when the user deliberately chose a language via
  // the switcher (as opposed to the registration default). When true, the app
  // applies this language on every new device sign-in, overriding the browser
  // locale. When false/null the browser locale takes precedence on new devices.
  explicit_language_choice: boolean("explicit_language_choice").notNull().default(false),
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

  // ─── Master Framework v1.1 §11.5 ────────────────────────────────────────────
  // Archetype system
  archetype:           text("archetype"),
  secondary_archetype: text("secondary_archetype"),

  // Interest selections written during onboarding §5
  social_circles:      jsonb("social_circles").$type<string[]>().notNull().default([]),
  cultural_interests:  jsonb("cultural_interests").$type<string[]>().notNull().default([]),
  selected_interests:  jsonb("selected_interests").$type<string[]>().notNull().default([]),

  // Register bias (§4.2)
  // "middle_class" | "elite" | "balanced"
  register_bias:        text("register_bias"),
  secondary_register:   text("secondary_register"),
  register_bias_signals: jsonb("register_bias_signals").$type<RegisterBiasSignal[]>().notNull().default([]),
  register_bias_locked:  boolean("register_bias_locked").notNull().default(false),

  // Elite privacy mode: when true, noble_score / Compass / badges are never
  // exposed on public views.
  elite_privacy_mode:   boolean("elite_privacy_mode").notNull().default(false),

  // Soft-recalibration flag: set when user scores < 50% in first 3 sessions.
  needs_recalibration:  boolean("needs_recalibration").notNull().default(false),
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
