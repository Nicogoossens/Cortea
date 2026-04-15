import { pgTable, text, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  full_name: text("full_name"),
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
  trial_ends_at: timestamp("trial_ends_at"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
