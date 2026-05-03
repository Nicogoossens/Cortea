import { pgTable, serial, text, integer, timestamp, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waitlistSignupsTable = pgTable("waitlist_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  segment: text("segment").notNull(),
  locale: text("locale").notNull().default("en"),
  founder_code: text("founder_code"),
  founder_position: integer("founder_position"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  invited_at: timestamp("invited_at"),
  claimed_user_id: text("claimed_user_id"),
  claimed_at: timestamp("claimed_at"),
}, (t) => [
  uniqueIndex("waitlist_signups_email_unique").on(sql`lower(${t.email})`),
  uniqueIndex("waitlist_signups_founder_code_unique").on(t.founder_code),
  uniqueIndex("waitlist_signups_founder_position_unique").on(t.founder_position),
  check(
    "waitlist_signups_segment_check",
    sql`${t.segment} IN ('business', 'expat', 'student', 'elite', 'other')`,
  ),
  check(
    "waitlist_signups_founder_position_range",
    sql`${t.founder_position} IS NULL OR (${t.founder_position} >= 1 AND ${t.founder_position} <= 100)`,
  ),
]);

export const insertWaitlistSignupSchema = createInsertSchema(waitlistSignupsTable).omit({
  id: true,
  created_at: true,
  founder_code: true,
  founder_position: true,
  invited_at: true,
  claimed_user_id: true,
  claimed_at: true,
});
export type InsertWaitlistSignup = z.infer<typeof insertWaitlistSignupSchema>;
export type WaitlistSignup = typeof waitlistSignupsTable.$inferSelect;

export const FOUNDER_SPOTS_TOTAL = 100;
export const WAITLIST_SEGMENTS = ["business", "expat", "student", "elite", "other"] as const;
export type WaitlistSegment = (typeof WAITLIST_SEGMENTS)[number];
