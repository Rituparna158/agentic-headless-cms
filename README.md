# Agentic Headless CMS

Welcome to the **Agentic Headless CMS**! This project is a modular, API-first content management system designed to be operated by both human editors and AI agents.

## Project Structure

This project uses a modern monorepo setup powered by **Turborepo** and **pnpm**:

- **apps/frontend**: The frontend dashboard built with Next.js, Tailwind CSS, and shadcn/ui.
- **apps/backend**: The core backend API built with Express.
- **packages/shared-db**: Database schemas, ORM logic (Drizzle), and migrations.
- **packages/types**: Shared compile-time TypeScript interfaces and definitions.
- **packages/validation**: Zod validation schemas and dynamic compilers.
- **packages/constants**: Shared runtime constants (error messages, HTTP status codes, cookies, email templates).
- **packages/eslint-config**: Shared ESLint configuration.
- **packages/typescript-config**: Shared TypeScript configuration.

## Prerequisites

- **Node.js** >= 20.9.0
- **pnpm** (see `packageManager` in `package.json`)
- **Docker** (recommended) — the bundled `docker-compose.yml` provisions a
  matching Postgres and Redis with zero manual setup. You can use your own
  instances instead as long as they meet the minimums below.
- **PostgreSQL** >= 16
- **Redis** >= 5.0.0 — required by `apps/backend`'s job queue (BullMQ), which relies on Redis Streams. Older versions (e.g. the deprecated Windows Redis port) will fail to boot the backend.

## Getting Started (first-time setup)

These steps get the whole stack — database, backend API, and frontend
dashboard — running locally from a fresh clone.

1. **Install dependencies** (run once, from the repo root):
   ```bash
   pnpm install
   ```
2. **Start Postgres and Redis:**
   ```bash
   docker compose up -d
   ```
3. **Create your env files** from the checked-in examples:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   cp packages/shared-db/.env.example packages/shared-db/.env
   ```
   The defaults work as-is against the `docker-compose.yml` services — you
   only need to edit values if you're pointing at your own Postgres/Redis, or
   configuring real SMTP/S3 credentials (see `apps/backend/README.md`).
4. **Run database migrations:**
   ```bash
   pnpm --filter @repo/shared-db run db:migrate
   ```
5. **Seed the initial admin user:**
   ```bash
   pnpm --filter backend run seed:admin
   ```
   Logs in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from
   `apps/backend/.env`
6. **Start every app's development server** (frontend + backend, via Turborepo):
   ```bash
   pnpm dev
   ```
7. Open (http://localhost:xxxx) and log in with the
   seeded admin credentials. The backend API listens on (http://localhost:xxxx).

For app-specific details (structure, individual commands, environment
variables), see [apps/frontend/README.md](apps/frontend/README.md) and
[apps/backend/README.md](apps/backend/README.md). For how this project is
tested, see [docs/testing.md](docs/testing.md). To contribute, see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Common Commands

```bash
pnpm dev           # Start every app's dev server
pnpm lint          # Lint all apps and packages
pnpm check-types   # Type-check all apps and packages
pnpm format        # Format the codebase with Prettier
pnpm build         # Build all apps and packages
pnpm test          # Run backend + frontend unit/integration tests
```
