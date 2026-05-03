import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactSubmissionsTable = pgTable(
  "contact_submissions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    businessName: text("business_name"),
    email: text("email").notNull(),
    phone: text("phone"),
    preferredChannel: text("preferred_channel").notNull().default("email"),
    message: text("message").notNull(),
    source: text("source").notNull().default("contact-page"),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("contact_submissions_email_idx").on(t.email),
    index("contact_submissions_status_idx").on(t.status),
  ],
);

export const insertContactSubmissionSchema = createInsertSchema(
  contactSubmissionsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertContactSubmission = z.infer<
  typeof insertContactSubmissionSchema
>;
export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
