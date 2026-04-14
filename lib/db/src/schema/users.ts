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
  language_code: text("language_code").notNull().default("en"),
  active_region: text("active_region").notNull().default("GB"),
  region_history: json("region_history").$type<string[]>().notNull().default([]),
  created_at: timestamp("created_at").notNull().defaultNow(),
  is_admin: boolean("is_admin").notNull().default(false),
  suspended_at: timestamp("suspended_at"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
