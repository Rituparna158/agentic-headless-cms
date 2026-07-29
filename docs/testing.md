# Testing

This repo has three layers of automated tests, each with a different scope and a
different relationship to the database.

## Backend unit & integration tests (`apps/backend/__tests__`)

Run via `pnpm --filter backend test` (Vitest + Supertest). These mock the repository
layer (`vi.mock(...)`) — no real database connection is made. They're fast and verify
routing, validation, and RBAC logic in isolation.

## Frontend unit tests (`apps/frontend/__tests__/unit`)

Run via `pnpm --filter frontend test` (Vitest + Testing Library). Pure component
tests — no network or database involved.

## End-to-end tests (`apps/frontend/__tests__/e2e`)

Run via `pnpm --filter frontend test:e2e` (Playwright). These drive a real browser
against the real Next.js frontend and the real Express backend — nothing here is
mocked. That's deliberate: E2E tests exist to catch bugs in how the real pieces work
_together_ (auth cookies, redirects, RBAC enforcement, actual SQL behavior), which a
mocked backend can't do. Bugs have already been caught this way that a mock would
have missed — e.g. an auth-redirect regression and a database schema drift issue.

### Why a dedicated test database

E2E runs need a real Postgres database, but they must never touch the database you
use for local development (`agentic_cms`) — a test run creating, publishing, and
deleting content, roles, and users would corrupt or clutter your dev data.

So E2E runs use a separate, isolated database: `agentic_cms_test`, on the same
Postgres instance/credentials as `docker-compose.yml` (see `.env.example` in both
`apps/backend` and `packages/shared-db`). This is set up automatically — you don't
need to create or migrate it by hand:

1. `apps/frontend/playwright.config.ts` starts the real backend with
   `DATABASE_URL` overridden to `E2E_DATABASE_URL` (defaults to the
   `agentic_cms_test` connection string above; override the `E2E_DATABASE_URL`
   env var if you need a different one, e.g. in CI).
2. `apps/frontend/__tests__/e2e/global-setup.ts` runs once before the suite:
   - creates the `agentic_cms_test` database if it doesn't exist yet
   - applies Drizzle migrations to it directly via `drizzle-kit migrate`
     (idempotent, so this is safe to run on every invocation)
   - seeds the fixed admin user and expired-invite fixture the specs rely on

All URLs the E2E suite points at (frontend, backend, and `E2E_DATABASE_URL` above)
are declared once in `apps/frontend/__tests__/e2e/constants.ts` and imported
everywhere else (`playwright.config.ts`, `global-setup.ts`, and specs that call the
backend directly via `page.request`) rather than repeated per-file. Override
`E2E_FRONTEND_URL` / `E2E_BACKEND_URL` if your local ports differ from the
defaults (`3001` / `3000`).

Two prerequisites: Postgres itself must be reachable (`docker compose up` locally,
or a Postgres service container in CI), and `@repo/shared-db` must already be built
(`pnpm --filter @repo/shared-db run build`, or the monorepo-wide `pnpm run build`) —
global setup runs `drizzle-kit migrate` directly rather than through the package's
`db:migrate` script, since that script rebuilds the package first, which would
restart the already-running backend dev server (it's watching the same workspace
package via `tsx watch`) partway through the run.

To run the full suite locally:

```bash
docker compose up -d
pnpm --filter @repo/shared-db run build   # only needed once, or after schema changes
pnpm --filter frontend test:e2e
```
