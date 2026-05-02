import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companionLinksTable = pgTable("companion_links", {
  id: serial("id").primaryKey(),
  user_a_id: text("user_a_id").notNull(),
  user_b_id: text("user_b_id").notNull(),
  share_progress_a: boolean("share_progress_a").notNull().default(true),
  share_progress_b: boolean("share_progress_b").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanionLinkSchema = createInsertSchema(companionLinksTable).omit({ id: true, created_at: true });
export type InsertCompanionLink = z.infer<typeof insertCompanionLinkSchema>;
export type CompanionLink = typeof companionLinksTable.$inferSelect;
