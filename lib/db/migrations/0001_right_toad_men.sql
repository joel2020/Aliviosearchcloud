ALTER TABLE "assistant_conversations" ADD COLUMN "agent_mode" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD COLUMN "channel" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD COLUMN "agent_mode" text;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assistant_conversations_business_idx" ON "assistant_conversations" USING btree ("business_id","updated_at");--> statement-breakpoint
CREATE INDEX "assistant_messages_conversation_idx" ON "assistant_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "assistant_messages_business_idx" ON "assistant_messages" USING btree ("business_id","created_at");