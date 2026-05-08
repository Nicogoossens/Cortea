import { pgTable, serial, text, doublePrecision, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Per-region multipliers for the 5 Refinement Compass dimensions.
 * Applied after `projectBehaviorToCompass` to produce culturally-weighted scores.
 * Default 1.0 = no adjustment. Values typically range 0.8–1.3.
 *
 * Example: JP attentiveness = 1.3 → the same behavior profile produces a
 * higher attentiveness score for a Japan-active user than for a BE-active user.
 */
export const regionDimensionWeightsTable = pgTable(
  "region_dimension_weights",
  {
    id:            serial("id").primaryKey(),
    region_code:   text("region_code").notNull(),
    attentiveness: doublePrecision("attentiveness").notNull().default(1.0),
    composure:     doublePrecision("composure").notNull().default(1.0),
    discernment:   doublePrecision("discernment").notNull().default(1.0),
    diplomacy:     doublePrecision("diplomacy").notNull().default(1.0),
    presence:      doublePrecision("presence").notNull().default(1.0),
    created_at:    timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("rdw_region_code_idx").on(table.region_code),
  ],
);

export const insertRegionDimensionWeightSchema = createInsertSchema(regionDimensionWeightsTable);
export type InsertRegionDimensionWeight = z.infer<typeof insertRegionDimensionWeightSchema>;
export type RegionDimensionWeight = typeof regionDimensionWeightsTable.$inferSelect;
