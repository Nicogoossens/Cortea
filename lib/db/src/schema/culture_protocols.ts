import { pgTable, serial, text, integer, timestamp, unique, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cultureProtocolsTable = pgTable("culture_protocols", {
  id: serial("id").primaryKey(),
  region_code: text("region_code").notNull(),
  pillar: integer("pillar").notNull().default(0),
  rule_type: text("rule_type").notNull().default(""),
  rule_description: text("rule_description").notNull().default(""),
  gender_applicability: text("gender_applicability").notNull().default("all"),
  context: text("context").notNull().default("general"),
  source_reference: text("source_reference"),
  valid_from: timestamp("valid_from"),
  valid_until: timestamp("valid_until"),
  // CC Screening Worker fields
  source_book: text("source_book"),
  source_page: text("source_page"),
  pillar_code: text("pillar_code"),
  subcategory: text("subcategory"),
  rule_raw: text("rule_raw"),
  rule_cc: text("rule_cc"),
  personas: jsonb("personas").$type<string[]>(),
  modules: jsonb("modules").$type<string[]>(),
  urgency: integer("urgency").default(2),
  verified: boolean("verified").default(false),
}, (t) => [
  unique("culture_protocols_region_pillar_rule_key").on(t.region_code, t.pillar, t.rule_type),
]);

export const insertCultureProtocolSchema = createInsertSchema(cultureProtocolsTable).omit({ id: true });
export type InsertCultureProtocol = z.infer<typeof insertCultureProtocolSchema>;
export type CultureProtocol = typeof cultureProtocolsTable.$inferSelect;

export const CC_SOURCE_BOOKS = ["DH", "AV", "ME", "MG", "DN", "CB", "CA", "CM"] as const;
export type CCSourceBook = typeof CC_SOURCE_BOOKS[number];

export const CC_PILLARS = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
export type CCPillar = typeof CC_PILLARS[number];

export const CC_SUBCATEGORIES: Record<CCPillar, string[]> = {
  Z1: ["religious_impact", "holidays", "gift_giving", "taboos", "color_symbolism", "alternative_behavior"],
  Z2: ["forms_of_address", "greeting_ritual", "communication_context", "safe_smalltalk", "topics_to_avoid", "nonverbal_style"],
  Z3: ["cutlery_use", "seating_order", "payment_ritual", "consumption_sounds", "table_posture", "wine_and_drinks"],
  Z4: ["gender_nuances", "seniority_business", "hierarchy_social", "networking", "relationship_gifts", "conflict_face_saving"],
  Z5: ["dress_code_business", "dress_code_social", "modest_dress", "eye_contact_personal_space", "touch_etiquette", "accessories_symbols"],
};
