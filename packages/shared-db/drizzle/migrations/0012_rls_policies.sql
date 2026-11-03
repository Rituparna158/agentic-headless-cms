ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_isolation_policy" ON "roles"
  USING (application_id = current_setting('app.current_application_id', true)::uuid);
ALTER TABLE "user_applications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_isolation_policy" ON "user_applications"
  USING (application_id = current_setting('app.current_application_id', true)::uuid);
ALTER TABLE "schemas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_isolation_policy" ON "schemas"
  USING (application_id = current_setting('app.current_application_id', true)::uuid);
ALTER TABLE "content_entries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_isolation_policy" ON "content_entries"
  USING (application_id = current_setting('app.current_application_id', true)::uuid);
ALTER TABLE "media_folders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_isolation_policy" ON "media_folders"
  USING (application_id = current_setting('app.current_application_id', true)::uuid);
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_isolation_policy" ON "media_assets"
  USING (application_id = current_setting('app.current_application_id', true)::uuid);