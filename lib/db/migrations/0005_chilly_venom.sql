CREATE TABLE "audits" (
	"id" text PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"lead_name" text NOT NULL,
	"lead_email" text NOT NULL,
	"business_name" text NOT NULL,
	"website_url" text,
	"phone" text,
	"industry" text,
	"monthly_leads" integer,
	"average_deal_value" integer,
	"current_response_time" text,
	"main_channel" text,
	"biggest_pain" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"content" jsonb,
	"pdf_storage_key" text,
	"emailed_at" timestamp with time zone,
	"email_message_id" text,
	"source" text DEFAULT 'audit-page' NOT NULL,
	"utm_source" text,
	"utm_campaign" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audits_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_business_id" text,
	"full_name" text,
	"first_name" text,
	"last_name" text,
	"title" text,
	"email" text,
	"phone" text,
	"linkedin_url" text,
	"company_name" text,
	"company_domain" text,
	"company_industry" text,
	"company_size_bucket" text,
	"company_location" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"notes" text,
	"enrichment" jsonb,
	"audit_id" text,
	"last_contacted_at" timestamp with time zone,
	"last_replied_at" timestamp with time zone,
	"next_action_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_business_id" text,
	"lead_id" text NOT NULL,
	"name" text NOT NULL,
	"value_prop" text NOT NULL,
	"pain_point" text NOT NULL,
	"cta" text DEFAULT '15-minute call this week' NOT NULL,
	"template" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"next_step_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"sequence_id" text,
	"lead_id" text NOT NULL,
	"direction" text NOT NULL,
	"channel" text DEFAULT 'email' NOT NULL,
	"step_index" integer,
	"subject" text,
	"body" text NOT NULL,
	"from_address" text,
	"to_address" text NOT NULL,
	"provider_message_id" text,
	"provider_status" text,
	"metadata" jsonb,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_business_id_businesses_id_fk" FOREIGN KEY ("owner_business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_sequences" ADD CONSTRAINT "outreach_sequences_owner_business_id_businesses_id_fk" FOREIGN KEY ("owner_business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_sequences" ADD CONSTRAINT "outreach_sequences_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_sequence_id_outreach_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."outreach_sequences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audits_email_idx" ON "audits" USING btree ("lead_email");--> statement-breakpoint
CREATE INDEX "audits_status_idx" ON "audits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audits_created_at_idx" ON "audits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_owner_business_idx" ON "leads" USING btree ("owner_business_id");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_stage_idx" ON "leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "leads_next_action_idx" ON "leads" USING btree ("next_action_at");--> statement-breakpoint
CREATE INDEX "outreach_sequences_lead_idx" ON "outreach_sequences" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "outreach_sequences_next_step_idx" ON "outreach_sequences" USING btree ("next_step_at");--> statement-breakpoint
CREATE INDEX "outreach_sequences_status_idx" ON "outreach_sequences" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outreach_messages_lead_idx" ON "outreach_messages" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "outreach_messages_sequence_idx" ON "outreach_messages" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "outreach_messages_sent_at_idx" ON "outreach_messages" USING btree ("sent_at");