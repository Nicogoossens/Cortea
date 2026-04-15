import { pgTable, serial, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const translationsTable = pgTable(
  "translations",
  {
    id: serial("id").primaryKey(),
    language_code: text("language_code").notNull(),
    formality_register: text("formality_register").notNull().default("high"),
    rtl_flag: boolean("rtl_flag").notNull().default(false),
    region_link: text("region_link"),
    key: text("key").notNull(),
    value: text("value").notNull(),
    quality_reviewed_at: timestamp("quality_reviewed_at"),
  },
  (t) => [uniqueIndex("translations_lang_key_idx").on(t.language_code, t.key)]
);

export const insertTranslationSchema = createInsertSchema(translationsTable).omit({ id: true });
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translationsTable.$inferSelect;
