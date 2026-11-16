CREATE TABLE IF NOT EXISTS "content_workflow_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"current_stage" varchar(100) NOT NULL,
	"application_id" uuid DEFAULT current_setting('app.current_application_id', true)::uuid NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_workflow_states_entry_unique" UNIQUE("application_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schema_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"schema_id" uuid NOT NULL,
	"application_id" uuid DEFAULT current_setting('app.current_application_id', true)::uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schema_workflows_app_schema_unique" UNIQUE("application_id","schema_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"from_stage" varchar(100) NOT NULL,
	"to_stage" varchar(100) NOT NULL,
	"action" varchar(100),
	"comment" text,
	"actor_type" "actor_type" DEFAULT 'user' NOT NULL,
	"actor_user_id" uuid,
	"application_id" uuid DEFAULT current_setting('app.current_application_id', true)::uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"application_id" uuid DEFAULT current_setting('app.current_application_id', true)::uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"stages" jsonb NOT NULL,
	"transitions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_workflow_states" ADD CONSTRAINT "content_workflow_states_entry_id_content_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."content_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_workflow_states" ADD CONSTRAINT "content_workflow_states_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_workflow_states" ADD CONSTRAINT "content_workflow_states_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_workflow_states" ADD CONSTRAINT "content_workflow_states_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schema_workflows" ADD CONSTRAINT "schema_workflows_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schema_workflows" ADD CONSTRAINT "schema_workflows_schema_id_schemas_id_fk" FOREIGN KEY ("schema_id") REFERENCES "public"."schemas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schema_workflows" ADD CONSTRAINT "schema_workflows_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_histories" ADD CONSTRAINT "workflow_histories_entry_id_content_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."content_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_histories" ADD CONSTRAINT "workflow_histories_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_histories" ADD CONSTRAINT "workflow_histories_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_histories" ADD CONSTRAINT "workflow_histories_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflows" ADD CONSTRAINT "workflows_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schema_workflows_workflow_idx" ON "schema_workflows" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_histories_entry_idx" ON "workflow_histories" USING btree ("application_id","entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_tokens_app_revoked_expires_idx" ON "api_tokens" USING btree ("application_id","revoked_at","expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_assets_app_folder_deleted_idx" ON "media_assets" USING btree ("application_id","folder_id","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_assets_app_created_idx" ON "media_assets" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_folders_app_parent_folder_idx" ON "media_folders" USING btree ("application_id","parent_folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_app_timestamp_idx" ON "audit_logs" USING btree ("application_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_app_resource_idx" ON "audit_logs" USING btree ("application_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_app_action_idx" ON "audit_logs" USING btree ("application_id","action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_created_idx" ON "webhook_deliveries" USING btree ("webhook_id","created_at");