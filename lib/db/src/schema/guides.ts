import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const guidesTable = pgTable("guides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  pillar: text("pillar").notNull(),
  region_code: text("region_code"),
  price_cents: integer("price_cents").notNull(),
  stripe_price_id: text("stripe_price_id"),
  tier_required: text("tier_required"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const purchasedGuidesTable = pgTable("purchased_guides", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  guide_id: text("guide_id").notNull().references(() => guidesTable.id),
  purchased_at: timestamp("purchased_at").notNull().defaultNow(),
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
});

export type Guide = typeof guidesTable.$inferSelect;
export type PurchasedGuide = typeof purchasedGuidesTable.$inferSelect;
