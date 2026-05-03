import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { usersTable } from "./users";

export const assistantConversationsTable = pgTable("assistant_conversations", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .references(() => businessesTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title"),
  channel: text("channel").notNull().default("web"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssistantConversationSchema = createInsertSchema(
  assistantConversationsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertAssistantConversation = z.infer<
  typeof insertAssistantConversationSchema
>;
export type AssistantConversation =
  typeof assistantConversationsTable.$inferSelect;
