import { pgTable, serial, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companionMessagesTable = pgTable(
  "companion_messages",
  {
    id: serial("id").primaryKey(),
    link_id: integer("link_id").notNull(),
    sender_id: text("sender_id").notNull(),
    recipient_id: text("recipient_id").notNull(),
    body: text("body").notNull(),
    read_at: timestamp("read_at"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    recipientIdx: index("companion_messages_recipient_idx").on(table.recipient_id),
    linkIdx: index("companion_messages_link_idx").on(table.link_id),
  }),
);

export const insertCompanionMessageSchema = createInsertSchema(companionMessagesTable).omit({
  id: true,
  read_at: true,
  created_at: true,
});
export type InsertCompanionMessage = z.infer<typeof insertCompanionMessageSchema>;
export type CompanionMessage = typeof companionMessagesTable.$inferSelect;
