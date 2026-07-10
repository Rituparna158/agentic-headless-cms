-- Drizzle's defaultNow() only fires on INSERT. Postgres has no built-in
-- equivalent to an ORM-level "touch on save" that also covers raw SQL
-- writes, so updated_at is maintained by a trigger instead.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_schemas_updated_at BEFORE UPDATE ON schemas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_fields_updated_at BEFORE UPDATE ON fields FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_content_entries_updated_at BEFORE UPDATE ON content_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_entry_localizations_updated_at BEFORE UPDATE ON entry_localizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_media_assets_updated_at BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION set_updated_at();