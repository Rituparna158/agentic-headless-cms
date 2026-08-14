# Scalable App-Based Architecture

You are spot on! I completely missed that the `user_applications` table already exists.

Right now, `user_applications` links a `userId` directly to the hardcoded `applicationTypeEnum`. We will update it so it links to the new `applications` table instead!

## Proposed Architecture

### 1. The new `applications` Table

We will create this new table in your schema:

- `id` (UUID)
- `name` (e.g., "Mobile App", "CMS UI")
- `slug` (e.g., "mobile_app", "cms_ui")
- `apiKey` (Secure generated hash for frontend authentication)

### 2. Updating Existing Tables

We will remove the hardcoded `applicationTypeEnum` and replace it with a foreign key (`application_id` pointing to `applications.id`) in the following tables:

- `roles.application_id`
- `schemas.application_id`
- `user_applications.application_id` (This perfectly solves your question! A user will now be granted access to a specific App ID instead of an enum string).

_Note: Your `user_roles` table already points to `user_applications.id`, so it doesn't need any changes!_

### 3. Automatic Backend Security

When a request comes in:

1. The middleware reads the API Key/Token from the frontend.
2. It identifies the `Application`.
3. Any request to `GET /schemas` will automatically be filtered by the database to only return schemas where `application_id` matches the requesting App.

## Implementation Steps

1. **Database:** Create the `applications` table.
2. **Database:** Modify `roles`, `schemas`, and `user_applications` to use `application_id` instead of the enum.
3. **Migration:** Write a script to insert `HEADLESS_CMS` and `CMS_UI` into the new `applications` table, and migrate all existing data to point to their new UUIDs.
4. **Backend:** Update the API controllers to filter schemas and roles by the authenticated App ID.
5. **Frontend:** Update the `CMS_UI` to pass its API key in the headers.

## Open Questions

Since we are doing a structural database migration that drops the `applicationTypeEnum`:

- Are you comfortable with me writing the Drizzle migration for this? If you approve, I will begin by creating the `applications` table and updating the schema definitions!
