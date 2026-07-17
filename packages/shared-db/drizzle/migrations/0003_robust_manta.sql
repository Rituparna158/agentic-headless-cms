ALTER TABLE "users" ADD COLUMN "invite_token_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invite_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entry_localizations_search_idx" ON "entry_localizations" USING gin (jsonb_to_tsvector('english', "data", '["string"]'));