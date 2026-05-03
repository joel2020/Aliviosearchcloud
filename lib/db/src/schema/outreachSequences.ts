import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { leadsTable } from "./leads";

/**
 * One row per (lead × outreach sequence) — i.e. an active enrollment.
 * The cron-driven outbound runner walks every row whose `nextStepAt` has
 * passed and emits the next message via the cold-email agent.
 *
 * `template` carries the configurable cadence (steps, day offsets, prompts)
 * so a single sequence row owns its full plan without joining a separate
 * "sequence definitions" table — keeps Week 2 ship-able in one pass.
 */
export const outreachSequencesTable = pgTable(
  "outreach_sequences",
  {
    id: text("id").primaryKey(),
    ownerBusinessId: text("owner_business_id").references(
      () => businessesTable.id,
      { onDelete: "cascade" },
    ),
    leadId: text("lead_id")
      .notNull()
      .references(() => leadsTable.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    valueProp: text("value_prop").notNull(),
    painPoint: text("pain_point").notNull(),
    cta: text("cta").notNull().default("15-minute call this week"),

    template: jsonb("template")
      .$type<{
        steps: { dayOffset: number; tone: "intro" | "value" | "social-proof" | "breakup" }[];
      }>()
      .notNull(),

    status: text("status").notNull().default("active"), // active | paused | completed | replied | bounced
    currentStep: integer("current_step").notNull().default(0),
    nextStepAt: timestamp("next_step_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("outreach_sequences_lead_idx").on(t.leadId),
    index("outreach_sequences_next_step_idx").on(t.nextStepAt),
    index("outreach_sequences_status_idx").on(t.status),
  ],
);

export const insertOutreachSequenceSchema = createInsertSchema(
  outreachSequencesTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertOutreachSequence = z.infer<
  typeof insertOutreachSequenceSchema
>;
export type OutreachSequence = typeof outreachSequencesTable.$inferSelect;
