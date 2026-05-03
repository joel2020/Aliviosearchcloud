import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

export const assistantChannelConnectionsTable = pgTable(
  "assistant_channel_connections",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    label: text("label"),
    isActive: boolean("is_active").notNull().default(true),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const insertAssistantChannelConnectionSchema = createInsertSchema(
  assistantChannelConnectionsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertAssistantChannelConnection = z.infer<
  typeof insertAssistantChannelConnectionSchema
>;
export type AssistantChannelConnection =
  typeof assistantChannelConnectionsTable.$inferSelect;
