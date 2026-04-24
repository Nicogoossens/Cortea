import { pgTable, text, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface CompassLocaleContent {
  region_name: string;
  core_value: string;
  biggest_taboo: string;
  dining_etiquette: string;
  language_notes: string;
  gift_protocol: string;
  dress_code: string;
  dos: string[];
  donts: string[];
}

export type CompassLocaleMap = Partial<Record<string, CompassLocaleContent>>;

export const compassRegionsTable = pgTable("compass_regions", {
  region_code: text("region_code").primaryKey(),
  flag_emoji: text("flag_emoji").notNull(),
  content: jsonb("content").$type<CompassLocaleMap>().notNull().default({}),
  is_published: boolean("is_published").notNull().default(false),
});

export const insertCompassRegionSchema = createInsertSchema(compassRegionsTable);
export type InsertCompassRegion = z.infer<typeof insertCompassRegionSchema>;
export type CompassRegion = typeof compassRegionsTable.$inferSelect;
