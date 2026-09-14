# Worker — Agentic Headless CMS Background Queue Worker

Background worker application for the Agentic Headless CMS. Powered by **BullMQ** and **Redis** to execute asynchronous, compute-heavy jobs outside of the main HTTP request/response cycle.

---

## Capabilities & Responsibilities

1. **Asynchronous Media Processing:**
   - Listens on BullMQ queues for newly uploaded media assets.
   - Generates responsive thumbnails and multi-resolution variants using **Sharp** via `@repo/storage`.
   - Converts formats (WebP, AVIF) and extracts image dimensions/metadata.
2. **Event & Webhook Processing:**
   - Dispatches outbound webhooks to third-party endpoints with retry logic and exponential backoff.
3. **Graceful Shutdown & Resilience:**
   - Pre-flight checks guarantee Redis is available before workers initialize.
   - Cleanly drains active queue jobs on `SIGTERM` / `SIGINT` signals.

---

## Setup & Configuration

The worker reads configuration directly from the root unified `.env` file:

```bash
# 1. From repository root, initialize environment configuration
cp .env.example .env

# 2. Start Redis
docker compose up -d redis

# 3. Start the worker process
pnpm --filter worker dev
```

### Key Environment Variables

- `REDIS_URL` — Redis connection URI (`redis://localhost:6379`). Must be Redis >= 5.0 (Redis Streams support).
- `DATABASE_URL` — PostgreSQL connection string (for updating asset metadata).
- `STORAGE_ADAPTER` — Storage driver: `local` (default) or `s3`.
- `STORAGE_LOCAL_UPLOAD_DIR` — Path to media storage (defaults to `./uploads`).
- `QUEUE_JOB_ATTEMPTS` — Max retry attempts for failed jobs (defaults to `3`).
- `QUEUE_JOB_BACKOFF_DELAY_MS` — Exponential backoff delay between retries in milliseconds (defaults to `5000`).

---

## Development Commands

Run from `apps/worker/` or via `pnpm --filter worker <command>`:

```bash
pnpm dev             # Start worker in watch mode with tsx
pnpm build           # Compile TypeScript using tsc
pnpm start           # Run the compiled worker from dist/index.js
pnpm check-types     # Typecheck using TypeScript (tsc --noEmit)
pnpm retry-failed    # Script to retry failed BullMQ queue jobs
```

---

## Docker & Container Deployment

The worker is containerized using `apps/worker/Dockerfile`:

- Multi-stage Turborepo build (`turbo prune worker --docker`).
- Runs under low-privilege system user `workerjs` on Node 24 Alpine.
- Orchestrated in `docker-compose.prod.yml` and root `docker-compose.yml`, mounting the shared `media_uploads` volume.
