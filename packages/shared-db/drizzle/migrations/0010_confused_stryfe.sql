CREATE TABLE IF NOT EXISTS "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"api_key_hash" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'CLIENT_APP' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_api_key_hash_unique" UNIQUE("api_key_hash")
);
--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_name_application_unique";--> statement-breakpoint
ALTER TABLE "user_applications" DROP CONSTRAINT "user_applications_user_application_unique";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN IF EXISTS "application";--> statement-breakpoint
ALTER TABLE "user_applications" DROP COLUMN IF EXISTS "application";--> statement-breakpoint
DROP TYPE "public"."application_type";