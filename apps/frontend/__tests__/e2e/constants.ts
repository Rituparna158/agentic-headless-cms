/**
 * Single source of truth for the URLs/connection string the E2E suite points
 * at
 */
export const FRONTEND_URL =
  process.env.E2E_FRONTEND_URL ?? 'http://localhost:3001';

export const BACKEND_URL =
  process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';

export const BACKEND_HEALTH_URL = `${BACKEND_URL}/health/live`;

/* Isolated from the development database (agentic_cms) so E2E runs never
 * read or write dev data. Same Postgres instance/credentials as
 * docker-compose.yml, different database name. See docs/testing.md for how
 * this gets created and migrated.
 */
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/agentic_cms_test';
