import { pgTable, serial, text, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Country-level overrides for archetype pillar weights.
 * When a user selects an archetype, the selection engine applies
 * these weights on top of the universal archetype defaults.
 */
export const countryArchetypeExtensionsTable = pgTable(
  "country_archetype_extensions",
  {
    id:             serial("id").primaryKey(),
    country_code:   text("country_code").notNull(),
    archetype:      text("archetype").notNull(),
    /**
     * Per-pillar weight overrides. Keys are pillar codes (P1–P5).
     * Values are multipliers (1.0 = no change, 1.2 = 20% boost).
     * Example: { "P1": 1.2, "P3": 0.8 }
     */
    pillar_weights: jsonb("pillar_weights").$type<Record<string, number>>().notNull().default({}),
    created_at:     timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("cae_country_archetype_idx").on(table.country_code, table.archetype),
  ],
);

export const insertCountryArchetypeExtensionSchema = createInsertSchema(countryArchetypeExtensionsTable);
export type InsertCountryArchetypeExtension = z.infer<typeof insertCountryArchetypeExtensionSchema>;
export type CountryArchetypeExtension = typeof countryArchetypeExtensionsTable.$inferSelect;
