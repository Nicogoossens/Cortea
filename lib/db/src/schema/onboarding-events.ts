import { pgTable, serial, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Lightweight conversion-funnel telemetry for the onboarding flow.
 *
 * Currently captures one row per "plan choice" event (step 5 of onboarding):
 * either the user selected a tier (which then routes into Stripe checkout) or
 * skipped with "decide later". Designed to be a single append-only ledger so
 * additional onboarding steps can reuse the same table by varying `event_type`.
 *
 * `user_id` may be null when the request is unauthenticated (rare, but
 * possible for the "skipped_unauth" flow), so the admin funnel view can still
 * count the event without attributing it to an account.
 */
export const onboardingEventsTable = pgTable(
  "onboarding_events",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id"),
    event_type: text("event_type").notNull(),
    action: text("action").notNull(),
    tier: text("tier"),
    recommended_tier: text("recommended_tier"),
    objectives: jsonb("objectives"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("onboarding_events_event_type_idx").on(t.event_type),
    index("onboarding_events_created_at_idx").on(t.created_at),
  ],
);

export type OnboardingEvent = typeof onboardingEventsTable.$inferSelect;
export type InsertOnboardingEvent = typeof onboardingEventsTable.$inferInsert;
