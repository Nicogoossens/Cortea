import { pgTable, serial, text, integer, jsonb, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interestCatalogTable = pgTable(
  "interest_catalog",
  {
    id:             serial("id").primaryKey(),
    slug:           text("slug").notNull(),
    taxonomy:       text("taxonomy").notNull(),
    label_i18n_key: text("label_i18n_key").notNull(),
    /**
     * Which registers this interest belongs to.
     * ["middle_class"] | ["elite"] | ["middle_class","elite"]
     */
    registers:      jsonb("registers").$type<string[]>().notNull().default([]),
    /**
     * ISO 3166-1 alpha-2 codes this item is specific to.
     * null = universal (shown for all regions).
     */
    region_codes:   jsonb("region_codes").$type<string[] | null>().default(null),
    display_order:  integer("display_order").notNull().default(0),
    /** universal | cluster_dependent | country_specific */
    relevance_scope: text("relevance_scope"),
    notes:          text("notes"),
    /** Slug of the parent item; null means this is a top-level item. */
    parent_slug:    text("parent_slug"),
    created_at:     timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("ic_slug_idx").on(table.slug),
    index("ic_taxonomy_idx").on(table.taxonomy),
  ],
);

export const insertInterestCatalogSchema = createInsertSchema(interestCatalogTable);
export type InsertInterestCatalog = z.infer<typeof insertInterestCatalogSchema>;
export type InterestCatalog = typeof interestCatalogTable.$inferSelect;
