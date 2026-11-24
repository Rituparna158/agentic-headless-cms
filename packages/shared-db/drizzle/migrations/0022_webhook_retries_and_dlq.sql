ALTER TABLE "webhook_deliveries" ADD COLUMN IF NOT EXISTS "max_attempts" integer DEFAULT 3 NOT NULL;
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'delivered' NOT NULL;
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD COLUMN IF NOT EXISTS "next_retry_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD COLUMN IF NOT EXISTS "last_error" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_status_retry_idx" ON "webhook_deliveries" USING btree ("status", "next_retry_at");
