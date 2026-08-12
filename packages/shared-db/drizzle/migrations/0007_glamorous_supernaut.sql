CREATE TYPE "public"."app_access_status" AS ENUM('invited', 'active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."application_type" AS ENUM('HEADLESS_CMS', 'CMS_UI');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application" "application_type" NOT NULL,
	"status" "app_access_status" DEFAULT 'invited' NOT NULL,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_applications_user_application_unique" UNIQUE("user_id","application")
);
--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_name_unique";--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "entry_localizations_search_idx";--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_role_id_pk";--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "application" "application_type" DEFAULT 'CMS_UI' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "user_application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_requests" ADD CONSTRAINT "password_reset_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_applications" ADD CONSTRAINT "user_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_applications" ADD CONSTRAINT "user_applications_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_application_id_user_applications_id_fk" FOREIGN KEY ("user_application_id") REFERENCES "public"."user_applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entry_localizations_search_idx" ON "entry_localizations" USING gin (to_tsvector('english', "data"::text));--> statement-breakpoint
ALTER TABLE "user_roles" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_name_application_unique" UNIQUE("name","application");--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_app_role_unique" UNIQUE("user_application_id","role_id");