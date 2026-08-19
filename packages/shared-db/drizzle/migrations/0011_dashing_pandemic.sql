ALTER TABLE "roles" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_applications" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "content_entries" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "schemas" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "media_folders" ADD COLUMN "application_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles" ADD CONSTRAINT "roles_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_applications" ADD CONSTRAINT "user_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_entries" ADD CONSTRAINT "content_entries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schemas" ADD CONSTRAINT "schemas_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_name_application_unique" UNIQUE("name","application_id");--> statement-breakpoint
ALTER TABLE "user_applications" ADD CONSTRAINT "user_applications_user_application_unique" UNIQUE("user_id","application_id");