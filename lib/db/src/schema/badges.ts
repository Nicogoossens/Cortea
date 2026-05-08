import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const badgesTable = pgTable("badges", {
  id:              serial("id").primaryKey(),
  slug:            text("slug").notNull().unique(),
  title:           text("title").notNull(),
  description:     text("description").notNull(),
  badge_type:      text("badge_type").notNull(),
  /**
   * Master Framework v1.1 — §6
   * Functional kind of the badge.
   * "placement" = awarded by the placement-test flow (Acceleration Badge).
   * null        = regular progression badge.
   */
  kind:            text("kind"),
  register:        text("register").notNull(),
  research_pillar: text("research_pillar"),
  phase:           integer("phase"),
  region_code:     text("region_code"),
  icon_url:        text("icon_url"),
  created_at:      timestamp("created_at").defaultNow(),
});

export type Badge = typeof badgesTable.$inferSelect;
export type InsertBadge = typeof badgesTable.$inferInsert;
