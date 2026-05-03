import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Public-facing Revenue Leak Audit requests submitted from the marketing
 * `/audit` form. Each row tracks one prospect's audit through the lifecycle:
 *   `pending` → `generating` → `ready` (or `failed`)
 *
 * The actual AI-generated findings are stored in `content` (mirrors the
 * `revenueLeakAgent` output schema). A short-lived secret `accessToken` lets
 * the lead view their audit page without requiring login.
 */
export const auditsTable = pgTable(
  "audits",
  {
    id: text("id").primaryKey(),

    // Public access token — embedded in the success URL so the lead can view
    // their result page without authenticating. Random 32-char string.
    accessToken: text("access_token").notNull().unique(),

    // Lead identity (captured from the form)
    leadName: text("lead_name").notNull(),
    leadEmail: text("lead_email").notNull(),
    businessName: text("business_name").notNull(),
    websiteUrl: text("website_url"),
    phone: text("phone"),
    industry: text("industry"),

    // Audit inputs
    monthlyLeads: integer("monthly_leads"),
    averageDealValue: integer("average_deal_value"),
    currentResponseTime: text("current_response_time"),
    mainChannel: text("main_channel"),
    biggestPain: text("biggest_pain"),

    // Lifecycle
    status: text("status").notNull().default("pending"),
    errorMessage: text("error_message"),

    // Output
    content: jsonb("content").$type<Record<string, unknown> | null>(),
    pdfStorageKey: text("pdf_storage_key"),

    // Delivery tracking
    emailedAt: timestamp("emailed_at", { withTimezone: true }),
    emailMessageId: text("email_message_id"),

    // Lead source / attribution
    source: text("source").notNull().default("audit-page"),
    utmSource: text("utm_source"),
    utmCampaign: text("utm_campaign"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audits_email_idx").on(t.leadEmail),
    index("audits_status_idx").on(t.status),
    index("audits_created_at_idx").on(t.createdAt),
  ],
);

export const insertAuditSchema = createInsertSchema(auditsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof auditsTable.$inferSelect;
