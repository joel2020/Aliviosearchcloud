import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { assistantConversationsTable } from "./assistantConversations";
import { businessesTable } from "./businesses";
import { usersTable } from "./users";

export const assistantMessagesTable = pgTable(
  "assistant_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => assistantConversationsTable.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("web"),
    role: text("role").notNull(),
    content: text("content").notNull(),
    agentMode: text("agent_mode"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("assistant_messages_conversation_idx").on(t.conversationId, t.createdAt),
    index("assistant_messages_business_idx").on(t.businessId, t.createdAt),
  ],
);

export const insertAssistantMessageSchema = createInsertSchema(
  assistantMessagesTable,
).omit({ createdAt: true });
export type InsertAssistantMessage = z.infer<
  typeof insertAssistantMessageSchema
>;
export type AssistantMessage = typeof assistantMessagesTable.$inferSelect;
