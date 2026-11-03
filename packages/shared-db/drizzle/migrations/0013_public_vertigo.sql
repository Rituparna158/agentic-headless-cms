ALTER TABLE "locales" DROP CONSTRAINT "locales_code_unique";--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "entry_localizations" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "entry_relations" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "relation_defs" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "schema_versions" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "media_asset_tags" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "media_tags" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_interactions" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_operations" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "locales" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "entry_localizations" ADD CONSTRAINT "entry_localizations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "entry_relations" ADD CONSTRAINT "entry_relations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fields" ADD CONSTRAINT "fields_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "relation_defs" ADD CONSTRAINT "relation_defs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schema_versions" ADD CONSTRAINT "schema_versions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions" ADD CONSTRAINT "permissions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_asset_tags" ADD CONSTRAINT "media_asset_tags_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_interactions" ADD CONSTRAINT "agent_interactions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_operations" ADD CONSTRAINT "agent_operations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locales" ADD CONSTRAINT "locales_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "locales" ADD CONSTRAINT "locales_app_code_unique" UNIQUE("application_id","code");