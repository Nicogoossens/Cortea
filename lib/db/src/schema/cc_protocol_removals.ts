import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const ccProtocolRemovalsTable = pgTable("cc_protocol_removals", {
  id: serial("id").primaryKey(),
  protocol_id: integer("protocol_id").notNull(),
  removed_by: text("removed_by").notNull(),
  removed_at: timestamp("removed_at", { withTimezone: true }).notNull().defaultNow(),
  region_code: text("region_code"),
  pillar_code: text("pillar_code"),
  subcategory: text("subcategory"),
  rule_cc: text("rule_cc"),
  rule_raw: text("rule_raw"),
  urgency: integer("urgency"),
  source_book: text("source_book"),
  source_page: text("source_page"),
});

export type CCProtocolRemoval = typeof ccProtocolRemovalsTable.$inferSelect;
