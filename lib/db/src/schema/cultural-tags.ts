import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Canonical tag registry — 1.415 tags (14 global / 297 regional / 1.104 national).
 * Populated by seed-cultural-tags.ts from cortea-tags-master-world-v2.csv (Drive).
 * tag_scope values: "global" | "regional" | "national"
 */
export const culturalTagsTable = pgTable(
  "cultural_tags",
  {
    tag_id:     text("tag_id").primaryKey(),
    tag_scope:  text("tag_scope").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("ct_scope_idx").on(table.tag_scope),
  ],
);

export const insertCulturalTagSchema = createInsertSchema(culturalTagsTable);
export type InsertCulturalTag = z.infer<typeof insertCulturalTagSchema>;
export type CulturalTag = typeof culturalTagsTable.$inferSelect;
