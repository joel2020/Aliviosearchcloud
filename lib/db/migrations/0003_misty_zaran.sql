CREATE TABLE "blog_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'subscribed' NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "blog_subscribers_source_idx" ON "blog_subscribers" USING btree ("source");