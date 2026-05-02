import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleplayReflectionsTable = pgTable("roleplay_reflections", {
  id: serial("id").primaryKey(),
  scenario_id: integer("scenario_id").notNull(),
  author_id: text("author_id").notNull(),
  target_user_id: text("target_user_id").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleplayReflectionSchema = createInsertSchema(roleplayReflectionsTable).omit({ id: true, created_at: true });
export type InsertRoleplayReflection = z.infer<typeof insertRoleplayReflectionSchema>;
export type RoleplayReflection = typeof roleplayReflectionsTable.$inferSelect;
