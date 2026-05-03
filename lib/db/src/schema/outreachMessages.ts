import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { leadsTable } from "./leads";
import { outreachSequencesTable } from "./outreachSequences";

/**
 * Audit log of every outbound message we send (and every reply we ingest).
 * Powers the lead activity timeline shown in the CRM and client portal,
 * and lets the AM agent reason about what's been said before checking in.
 */
export const outreachMessagesTable = pgTable(
  "outreach_messages",
  {
    id: text("id").primaryKey(),
    sequenceId: text("sequence_id").references(
      () => outreachSequencesTable.id,
      { onDelete: "set null" },
    ),
    leadId: text("lead_id")
      .notNull()
      .references(() => leadsTable.id, { onDelete: "cascade" }),

    direction: text("direction").notNull(), // outbound | inbound
    channel: text("channel").notNull().default("email"), // email | sms | whatsapp
    stepIndex: integer("step_index"),

    subject: text("subject"),
    body: text("body").notNull(),
    fromAddress: text("from_address"),
    toAddress: text("to_address").notNull(),

    providerMessageId: text("provider_message_id"),
    providerStatus: text("provider_status"), // queued | sent | delivered | bounced | failed
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),

    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("outreach_messages_lead_idx").on(t.leadId),
    index("outreach_messages_sequence_idx").on(t.sequenceId),
    index("outreach_messages_sent_at_idx").on(t.sentAt),
  ],
);

export const insertOutreachMessageSchema = createInsertSchema(
  outreachMessagesTable,
).omit({ sentAt: true });
export type InsertOutreachMessage = z.infer<
  typeof insertOutreachMessageSchema
>;
export type OutreachMessage = typeof outreachMessagesTable.$inferSelect;
