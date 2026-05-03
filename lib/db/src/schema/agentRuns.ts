import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { usersTable } from "./users";

export const agentRunsTable = pgTable("agent_runs", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .references(() => businessesTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  agentSlug: text("agent_slug").notNull(),
  status: text("status").notNull().default("pending"),
  input: jsonb("input").$type<Record<string, unknown>>().default({}),
  output: jsonb("output").$type<Record<string, unknown>>().default({}),
  errorMessage: text("error_message"),
  tokensUsed: integer("tokens_used").default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertAgentRunSchema = createInsertSchema(agentRunsTable).omit({
  startedAt: true,
  completedAt: true,
});
export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;
export type AgentRun = typeof agentRunsTable.$inferSelect;
