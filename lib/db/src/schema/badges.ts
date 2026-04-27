import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const badgesTable = pgTable("badges", {
  id:              serial("id").primaryKey(),
  slug:            text("slug").notNull().unique(),
  title:           text("title").notNull(),
  description:     text("description").notNull(),
  badge_type:      text("badge_type").notNull(),
  register:        text("register").notNull(),
  research_pillar: text("research_pillar"),
  phase:           integer("phase"),
  region_code:     text("region_code"),
  icon_url:        text("icon_url"),
  created_at:      timestamp("created_at").defaultNow(),
});

export type Badge = typeof badgesTable.$inferSelect;
export type InsertBadge = typeof badgesTable.$inferInsert;
