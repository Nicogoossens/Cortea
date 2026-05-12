import { pgTable, text, boolean, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Cultural tag matrix — 199 landen × 1.415 tags ≈ 293.000 rijen.
 * Bron: cortea-tags-master-world-v2.csv (Drive file ID 1gkUC_xHyBTkNp74gEdaBPSiX8RneyY4F).
 *
 * status:
 *   excluded         — hard filter; vraag NIET getoond in dit land
 *   free             — geen constraint; geen re-ranking effect
 *   recommended      — cultureel passend; score +6 in engine
 *   not_recommended  — cultureel ongepast (niet illegaal); score −5 in engine
 *
 * volatility:
 *   stable   — status verandert zelden; geen periodieke review nodig
 *   volatile — status kan veranderen (wetgeving, politiek, sociale norm);
 *              sweeper flaggt als needs_review na VOLATILE_REVIEW_MONTHS maanden
 *
 * country_review_status:
 *   explicit   — land expliciet onderzocht en bevestigd
 *   inherited  — afgeleid van clusterbaseline; veilig als vangnet maar niet
 *               land-specifiek geverifieerd (content-team prioriteit)
 *
 * reviewed_at / needs_review — worden NOOIT overschreven bij re-import (seed);
 *   handmatige review-besluiten van het content-team blijven bewaard.
 */
export const culturalTagMatrixTable = pgTable(
  "cultural_tag_matrix",
  {
    tag_id:                text("tag_id").notNull(),
    country_iso:           text("country_iso").notNull(),
    status:                text("status").notNull(),
    volatility:            text("volatility").notNull().default("stable"),
    source:                text("source").notNull().default("baseline"),
    country_review_status: text("country_review_status").notNull().default("inherited"),
    note_short:            text("note_short"),
    reviewed_at:           timestamp("reviewed_at", { withTimezone: true }),
    needs_review:          boolean("needs_review").notNull().default(false),
    updated_at:            timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tag_id, table.country_iso] }),
    index("ctm_country_status_idx").on(table.country_iso, table.status),
    index("ctm_volatility_review_idx").on(table.volatility, table.needs_review),
  ],
);

export const insertCulturalTagMatrixSchema = createInsertSchema(culturalTagMatrixTable);
export type InsertCulturalTagMatrix = z.infer<typeof insertCulturalTagMatrixSchema>;
export type CulturalTagMatrix = typeof culturalTagMatrixTable.$inferSelect;
