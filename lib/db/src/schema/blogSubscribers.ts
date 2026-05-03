import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blogSubscribersTable = pgTable(
  "blog_subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    source: text("source").notNull(),
    status: text("status").notNull().default("subscribed"),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("blog_subscribers_source_idx").on(t.source)],
);

export const insertBlogSubscriberSchema = createInsertSchema(
  blogSubscribersTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertBlogSubscriber = z.infer<typeof insertBlogSubscriberSchema>;
export type BlogSubscriber = typeof blogSubscribersTable.$inferSelect;
