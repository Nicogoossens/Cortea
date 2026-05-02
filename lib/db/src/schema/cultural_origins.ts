import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const culturalOriginsTable = pgTable("cultural_origins", {
  id: serial("id").primaryKey(),
  region_code: text("region_code").notNull(),
  domain: text("domain").notNull(),
  tradition: text("tradition").notNull(),
  origin_summary: text("origin_summary").notNull(),
  era: text("era").notNull(),
  influences: text("influences").array().notNull().default([]),
  connected_rule: text("connected_rule").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCulturalOriginSchema = createInsertSchema(culturalOriginsTable).omit({ id: true, created_at: true });
export type InsertCulturalOrigin = z.infer<typeof insertCulturalOriginSchema>;
export type CulturalOrigin = typeof culturalOriginsTable.$inferSelect;
