ALTER TYPE "public"."permission_action" ADD VALUE 'manage';--> statement-breakpoint
ALTER TABLE "schemas" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;