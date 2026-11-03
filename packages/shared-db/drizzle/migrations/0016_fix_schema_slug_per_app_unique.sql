-- Migration: Fix schemas.slug from global unique to per-app composite unique
-- The global unique constraint on slug means two different platforms cannot have
-- a schema with the same slug (e.g. both can't have "blog-post"). This converts
-- it to a composite unique on (application_id, slug) so each platform can
-- independently define any slug it needs.
-- Step 1: Drop the existing global unique constraint on slug (if it exists)
ALTER TABLE "schemas" DROP CONSTRAINT IF EXISTS "schemas_slug_unique";
-- Step 2: Add per-app composite unique constraint
ALTER TABLE "schemas" ADD CONSTRAINT "schemas_app_slug_unique" UNIQUE ("application_id", "slug");