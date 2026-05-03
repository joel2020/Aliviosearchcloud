import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

/**
 * `leads` is the spine of the in-house AI-CRM that replaces the planned
 * HubSpot integration. Every contact we touch — audit requests, outbound
 * cold-email targets, manually added prospects — gets a row here.
 *
 * - `ownerBusinessId` is nullable for "house leads" (people who hit the
 *   public audit form for Alivio itself) and set for customer-owned leads
 *   once we ship the multi-tenant CRM in Week 6.
 * - `stage` follows a simple kanban: new → working → qualified → meeting
 *   → won / lost.
 * - `score` is a 0–100 enrichment-driven priority — higher means hotter.
 */
export const leadsTable = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),

    // Tenancy — null = "house" lead owned by Alivio
    ownerBusinessId: text("owner_business_id").references(
      () => businessesTable.id,
      { onDelete: "cascade" },
    ),

    // Identity
    fullName: text("full_name"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    linkedinUrl: text("linkedin_url"),

    // Company
    companyName: text("company_name"),
    companyDomain: text("company_domain"),
    companyIndustry: text("company_industry"),
    companySizeBucket: text("company_size_bucket"), // "1-10" | "11-50" | etc
    companyLocation: text("company_location"),

    // CRM
    stage: text("stage").notNull().default("new"),
    score: integer("score").notNull().default(0),
    source: text("source").notNull().default("manual"),
    notes: text("notes"),
    enrichment: jsonb("enrichment").$type<Record<string, unknown> | null>(),

    // Linkage to public funnel artifacts
    auditId: text("audit_id"),

    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    lastRepliedAt: timestamp("last_replied_at", { withTimezone: true }),
    nextActionAt: timestamp("next_action_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("leads_owner_business_idx").on(t.ownerBusinessId),
    index("leads_email_idx").on(t.email),
    index("leads_stage_idx").on(t.stage),
    index("leads_next_action_idx").on(t.nextActionAt),
    // Each audit produces at most one CRM lead row. Partial unique index
    // (Postgres only enforces uniqueness for non-null audit_id values) so
    // manual / cold-email leads with no audit_id are unaffected.
    uniqueIndex("leads_audit_id_unique_idx")
      .on(t.auditId)
      .where(sql`${t.auditId} IS NOT NULL`),
  ],
);

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
