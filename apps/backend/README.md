# Backend — Agentic Headless CMS API

Express + TypeScript core API server for the Agentic Headless CMS. Powered by `@repo/shared-db` (Drizzle ORM) for PostgreSQL persistence and BullMQ/Redis for asynchronous job processing.

> **First time setting up the whole project?** Follow the root [README.md](../../README.md#getting-started-first-time-setup) — it covers Docker, environment variables, migrations, and seeding for the full stack. This document covers backend-specific details.

---

## Architecture & Structure

```
apps/backend/
├── src/
│   ├── server.ts              # Entry point — connects to DB/Redis, initializes OpenTelemetry, listens, handles shutdown
│   ├── app.ts                 # Express factory (middleware, security, route mounting); no listen() — importable by tests
│   ├── instrumentation.ts     # OpenTelemetry SDK and metrics initialization
│   ├── cli.ts                 # Backend CLI utility powered by CAC
│   ├── scripts/
│   │   └── run-migrations-and-seed.ts # Automated database migration and system seeding runner
│   ├── config/
│   │   └── env.ts             # Zod-validated environment config, fails fast on boot
│   ├── modules/
│   │   ├── access/            # RBAC roles, permissions, and application assignment
│   │   ├── audit/             # Detailed audit logging for human and agent operations
│   │   ├── auth/              # JWT authentication, TOTP 2FA/MFA, and SSO/OIDC
│   │   ├── content/           # Dynamic content CRUD, draft/publish lifecycle, and version history
│   │   ├── graphql/           # Apollo Server GraphQL schema generator & resolver stitching
│   │   ├── health/            # Liveness (/health/live) and readiness (/health/ready) probes
│   │   ├── locales/           # Multi-language localization configuration
│   │   ├── media/             # Media library upload handling, folder grouping, and S3/local adapters
│   │   ├── observability/     # Prometheus metrics endpoint (/metrics)
│   │   ├── schemas/           # Dynamic schema definitions (single types & collections)
│   │   └── webhooks/          # Webhook event dispatching and deliveries
│   └── routes/
│       └── index.ts           # Versioned (/api/v1) route aggregator
├── __tests__/                 # Vitest unit and integration test suite
├── Dockerfile                 # Multi-stage production container build (turbo prune)
└── docker-entrypoint.sh       # Container entrypoint with automatic migration execution
```

---

## Setup & Configuration

The backend reads configuration directly from the root unified `.env` file via `--env-file=../../.env`:

```bash
# 1. From repository root, copy the environment template
cp .env.example .env

# 2. Install dependencies
pnpm install
```

### Key Environment Variables

See the root `.env.example` for the full list with inline documentation. Common variables:

- `PORT` — Port number (defaults to `3000`).
- `DATABASE_URL` — PostgreSQL connection string (`postgresql://postgres:postgres@localhost:5432/agentic_cms`).
- `REDIS_URL` — Redis connection URI for caching and queues (`redis://localhost:6379`).
- `JWT_SECRET` — Key for signing auth tokens (must be at least 32 characters long).
- `CORS_ORIGIN` — Allowed client origin(s) (defaults to `http://localhost:3001` for the Admin UI).
- `STORAGE_ADAPTER` — Storage driver: `local` (default) or `s3` (AWS S3 / MinIO).
- `AUTO_MIGRATE` — Set to `true` (default in Docker) to automatically apply pending migrations on container boot.

---

## API Endpoints & Interfaces

When the backend is running (port `3000`):

| Endpoint            | Protocol | Description                                                            |
| :------------------ | :------- | :--------------------------------------------------------------------- |
| **`/api/v1`**       | REST     | Versioned REST API root                                                |
| **`/api-docs`**     | HTTP     | Interactive Swagger / OpenAPI documentation UI                         |
| **`/graphql`**      | GraphQL  | Apollo Server GraphQL query and mutation endpoint                      |
| **`/health/live`**  | HTTP     | Liveness probe (returns `200` if Express process is running)           |
| **`/health/ready`** | HTTP     | Readiness probe (returns `200` only if database connection is healthy) |
| **`/metrics`**      | HTTP     | Prometheus metrics for scraping                                        |

---

## Development Commands

Run from `apps/backend/` or via `pnpm --filter backend <command>`:

```bash
pnpm dev             # Start server in watch mode (tsx watch with root .env)
pnpm build           # Compile TypeScript to dist/ (using tsconfig.build.json)
pnpm start           # Run the compiled production build from dist/
pnpm lint            # Run ESLint across src/
pnpm check-types     # Typecheck using TypeScript compiler (tsc --noEmit)
pnpm test            # Run Vitest unit & integration tests
pnpm test:watch      # Run tests in interactive watch mode
pnpm cli             # Run backend CLI commands
```

---

## Docker & Production Container

The backend is packaged using a multi-stage Docker build:

- **`apps/backend/Dockerfile`**: Uses Turborepo pruning (`turbo prune backend --docker`) to produce a minimal production image (<150MB) running on Alpine Linux under non-root user `expressjs`.
- **`docker-entrypoint.sh`**: Checks database connectivity, runs `dist/scripts/run-migrations-and-seed.js` if `AUTO_MIGRATE=true`, and executes `node dist/server.js`.
