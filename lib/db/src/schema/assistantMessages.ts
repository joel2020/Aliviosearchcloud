import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { assistantConversationsTable } from "./assistantConversations";

export const assistantMessagesTable = pgTable("assistant_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => assistantConversationsTable.id, {
      onDelete: "cascade",
    }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssistantMessageSchema = createInsertSchema(
  assistantMessagesTable,
).omit({ createdAt: true });
export type InsertAssistantMessage = z.infer<
  typeof insertAssistantMessageSchema
>;
export type AssistantMessage = typeof assistantMessagesTable.$inferSelect;
