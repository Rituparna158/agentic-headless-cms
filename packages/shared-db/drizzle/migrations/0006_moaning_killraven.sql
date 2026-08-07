CREATE TYPE "public"."mfa_reset_request_status" AS ENUM('pending', 'approved', 'rejected', 'completed', 'expired');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mfa_reset_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "mfa_reset_request_status" DEFAULT 'pending' NOT NULL,
	"admin_id" uuid,
	"token_hash" varchar(255),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mfa_reset_requests" ADD CONSTRAINT "mfa_reset_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mfa_reset_requests" ADD CONSTRAINT "mfa_reset_requests_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
