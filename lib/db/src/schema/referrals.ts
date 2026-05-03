import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const referralsTable = pgTable(
  "referrals",
  {
    id: text("id").primaryKey(),
    referrer_user_id: text("referrer_user_id").notNull(),
    referred_user_id: text("referred_user_id").notNull().unique(),
    referral_code: text("referral_code").notNull(),
    status: text("status").notNull().default("pending"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    converted_at: timestamp("converted_at"),
    rewarded_at: timestamp("rewarded_at"),
  },
  (t) => [
    index("referrals_referrer_idx").on(t.referrer_user_id),
    index("referrals_status_idx").on(t.status),
  ]
);

export type Referral = typeof referralsTable.$inferSelect;
