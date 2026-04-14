import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cultureProtocolsTable = pgTable("culture_protocols", {
  id: serial("id").primaryKey(),
  region_code: text("region_code").notNull(),
  pillar: integer("pillar").notNull(),
  rule_type: text("rule_type").notNull(),
  rule_description: text("rule_description").notNull(),
  gender_applicability: text("gender_applicability").notNull().default("all"),
  context: text("context").notNull().default("general"),
  source_reference: text("source_reference"),
  valid_from: timestamp("valid_from"),
  valid_until: timestamp("valid_until"),
});

export const insertCultureProtocolSchema = createInsertSchema(cultureProtocolsTable).omit({ id: true });
export type InsertCultureProtocol = z.infer<typeof insertCultureProtocolSchema>;
export type CultureProtocol = typeof cultureProtocolsTable.$inferSelect;
