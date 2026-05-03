ALTER TABLE "assistant_channel_connections" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "assistant_channel_connections" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "assistant_channel_connections" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_channel_connections" ADD COLUMN "verification_code_hash" text;--> statement-breakpoint
ALTER TABLE "assistant_channel_connections" ADD COLUMN "verification_expires_at" timestamp with time zone;--> statement-breakpoint
UPDATE "assistant_channel_connections" acc SET "user_id" = b."owner_id" FROM "businesses" b WHERE acc."business_id" = b."id" AND acc."user_id" IS NULL;--> statement-breakpoint
UPDATE "assistant_channel_connections" SET "phone_number" = '+1' || lpad(substr(md5("id"), 1, 10), 10, '0') WHERE "phone_number" IS NULL;--> statement-breakpoint
ALTER TABLE "assistant_channel_connections" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_channel_connections" ALTER COLUMN "phone_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_channel_connections" ADD CONSTRAINT "assistant_channel_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assistant_channel_phone_unique_idx" ON "assistant_channel_connections" USING btree ("channel","phone_number");--> statement-breakpoint
CREATE INDEX "assistant_channel_business_idx" ON "assistant_channel_connections" USING btree ("business_id");
