ALTER TABLE "content_entries" ADD COLUMN IF NOT EXISTS "updated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "content_entries" ADD COLUMN IF NOT EXISTS "collaborators" text;