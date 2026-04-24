import { pgTable, text, check, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentCoverageTable = pgTable("content_coverage", {
  region_code: text("region_code").notNull(),
  social_class: text("social_class").notNull(),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
}, (t) => [
  primaryKey({ columns: [t.region_code, t.social_class], name: "content_coverage_pkey" }),
  check("content_coverage_social_class_check", sql`${t.social_class} IN ('universal','elite','middle_class')`),
  check("content_coverage_status_check", sql`${t.status} IN ('draft','active','complete')`),
]);

export const insertContentCoverageSchema = createInsertSchema(contentCoverageTable);
export type InsertContentCoverage = z.infer<typeof insertContentCoverageSchema>;
export type ContentCoverage = typeof contentCoverageTable.$inferSelect;
