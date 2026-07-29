# Backend — Agentic Headless CMS API

Express + TypeScript API for the Agentic Headless CMS. Uses `@repo/shared-db` (Drizzle ORM) for
all database access.

> First time setting up the whole project? Follow the root
> [README.md](../../README.md#getting-started-first-time-setup) — it covers
> Docker, env files, migrations, and seeding for the full stack. This file
> only covers backend-specific details.

## Structure

```
src/
  server.ts              # entry point — builds the app, connects, listens, handles graceful shutdown
  app.ts                 # Express app factory (middleware + route mounting); no listen() — importable by tests
  config/
    env.ts                # zod-validated environment config, fails fast on boot
  database/
    index.ts               # wraps @repo/shared-db client lifecycle for this process
  common/
    errors/                # typed HTTP error hierarchy + DatabaseError → HTTP status mapping
    middlewares/            # request-id, 404, and the central error handler
    logger.ts               # pino instance
  modules/
    health/                  # routes / controller / service — the template for future feature modules
  routes/
    index.ts                 # versioned (/api/v1) router aggregator feature modules mount into
test/                        # vitest + supertest
```

## Setup

```bash
cp .env.example .env   # defaults match docker-compose.yml; adjust if needed
pnpm install
```

## Environment variables

See `.env.example` for the full list with inline comments. Ones you're most likely to
change:

- `DATABASE_URL` / `REDIS_URL` — only if you're not using the bundled `docker-compose.yml`.
- `JWT_SECRET` — the `.env.example` value is a local-dev placeholder only; use a real
  generated secret anywhere this isn't a throwaway environment.
- `CORS_ORIGIN` — restrict this beyond `*` outside of local development.
- `STORAGE_ADAPTER` — `local` (default, writes to `STORAGE_LOCAL_UPLOAD_DIR`) or `s3`
  (fill in the `STORAGE_S3_*` variables).
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — required for real invitation emails to send;
  left blank, the backend logs emails instead of sending them.
- `E2E_DATABASE_URL` — only used by the frontend's Playwright suite; see
  [docs/testing.md](../../docs/testing.md). You don't need to set this yourself.

## Commands

```bash
pnpm dev                        # watch mode (tsx)
pnpm build                      # compile to dist/
pnpm start                      # run the compiled build
pnpm lint                       # eslint
pnpm check-types                # tsc --noEmit
pnpm test                       # vitest run
pnpm test:watch                 # vitest watch mode
pnpm seed:admin                 # create/update the initial superadmin user
pnpm seed:e2e-expired-invite    # E2E-only fixture, see docs/testing.md
```

## Health checks

- `GET /health/live` — liveness; always 200 if the process is up, no dependencies checked.
- `GET /health/ready` — readiness; 200 only if the database is reachable, 503 otherwise. Intended
  for Kubernetes readiness probes / load balancer health checks.
