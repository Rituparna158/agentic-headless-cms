# Backend — Agentic Headless CMS API

Express + TypeScript API for the Agentic Headless CMS. Uses `@repo/shared-db` (Drizzle ORM) for
all database access.

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
cp .env.example .env   # then fill in DATABASE_URL, etc.
pnpm install
```

## Commands

```bash
pnpm dev            # watch mode (tsx)
pnpm build           # compile to dist/
pnpm start           # run the compiled build
pnpm lint            # eslint
pnpm check-types     # tsc --noEmit
pnpm test            # vitest run
pnpm test:watch      # vitest watch mode
```

## Health checks

- `GET /health/live` — liveness; always 200 if the process is up, no dependencies checked.
- `GET /health/ready` — readiness; 200 only if the database is reachable, 503 otherwise. Intended
  for Kubernetes readiness probes / load balancer health checks.
