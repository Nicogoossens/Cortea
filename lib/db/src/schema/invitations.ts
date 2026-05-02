import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  inviter_id: text("inviter_id").notNull(),
  invitee_id: text("invitee_id"),
  status: text("status").notNull().default("pending"),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvitationSchema = createInsertSchema(invitationsTable).omit({ id: true, created_at: true });
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitationsTable.$inferSelect;
