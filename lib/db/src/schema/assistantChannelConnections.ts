import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { usersTable } from "./users";

export const assistantChannelConnectionsTable = pgTable(
  "assistant_channel_connections",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    phoneNumber: text("phone_number").notNull(),
    label: text("label"),
    isActive: boolean("is_active").notNull().default(true),
    verified: boolean("verified").notNull().default(false),
    verificationCodeHash: text("verification_code_hash"),
    verificationExpiresAt: timestamp("verification_expires_at", {
      withTimezone: true,
    }),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("assistant_channel_phone_unique_idx").on(
      t.channel,
      t.phoneNumber,
    ),
    index("assistant_channel_business_idx").on(t.businessId),
  ],
);

export const insertAssistantChannelConnectionSchema = createInsertSchema(
  assistantChannelConnectionsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertAssistantChannelConnection = z.infer<
  typeof insertAssistantChannelConnectionSchema
>;
export type AssistantChannelConnection =
  typeof assistantChannelConnectionsTable.$inferSelect;
