# Agentic Headless CMS

Welcome to the **Agentic Headless CMS**! This project is a modular, API-first content management system designed to be operated by both human editors and AI agents.

## Project Structure

This project uses a modern monorepo setup powered by **Turborepo** and **pnpm**:

- **apps/cms-ui**: The visual studio and page builder dashboard built with Vite 6, React 19, Tailwind CSS, and GrapesJS (default port: `3003`).
- **apps/frontend**: The frontend web application built with Next.js, Tailwind CSS, and shadcn/ui (default port: `3001`).
- **apps/backend**: The core backend REST API and MCP server built with Express (default port: `3000`).
- **packages/shared-ui**: Shared accessible component primitives, dialogs, tables, and design tokens.
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

## Getting Started

You can run the platform in two ways:

- **Workflow A (Recommended for Development)**: Backing services (PostgreSQL + Redis) run in Docker, while application servers run natively on your host machine for instant Hot Module Replacement.
- **Workflow B (Full-Stack Containerized)**: All 7 services (Gateway, CMS UI, Frontend, Backend, Worker, Postgres, Redis) run in production containers.

---

### Workflow A: Local Development (Fast HMR)

1. **Install dependencies** (from repo root):

   ```bash
   pnpm install
   ```

2. **Start backing services** (PostgreSQL 16 + Redis 7):

   ```bash
   docker compose up -d postgres redis
   ```

3. **Initialize environment files**:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/cms-ui/.env.example apps/cms-ui/.env
   cp apps/frontend/.env.example apps/frontend/.env
   cp packages/shared-db/.env.example packages/shared-db/.env
   ```

4. **Run database migrations**:

   ```bash
   pnpm --filter @repo/shared-db run db:migrate
   ```

5. **Seed initial admin account**:

   ```bash
   pnpm --filter backend run seed:admin
   ```

   Default login: `admin@agentic-cms.com` / `Password123!`

6. **Start all application development servers**:

   ```bash
   pnpm dev
   ```

7. **Access application endpoints**:
   - **CMS UI Studio**: [http://localhost:3003](http://localhost:3003)
   - **Frontend Web App**: [http://localhost:3001](http://localhost:3001)
   - **Backend REST API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1) (Liveness: `/health/live`, Readiness: `/health/ready`)

---

### Workflow B: Full-Stack Docker Deployment

Run the complete platform via Docker Compose (ideal for pre-release testing, staging, and self-hosted deployments):

1. **Create root environment**:

   ```bash
   cp .env.example .env
   ```

2. **Build and launch all 7 services**:

   ```bash
   docker compose up -d --build
   ```

3. **Apply migrations and seed initial admin**:

   ```bash
   pnpm --filter @repo/shared-db run db:migrate
   pnpm --filter backend run seed:admin
   # Or run directly inside the running backend container:
   docker compose exec backend pnpm --filter backend run seed:admin
   ```

4. **Access the unified Gateway (Port 80)**:
   - **Frontend Web App**: [http://localhost/](http://localhost/)
   - **CMS UI Studio**: [http://localhost/admin](http://localhost/admin) (or [http://cms.localhost/](http://cms.localhost/))
   - **Backend API**: [http://localhost/api/v1](http://localhost/api/v1)
   - **Gateway Health**: [http://localhost/healthz](http://localhost/healthz)

_For advanced Docker operations, multi-stage build caching, and production orchestration, see [docs/docker.md](docs/docker.md)._

---

## Docker Compose Services

| Service      | Container Image / Dockerfile | Exposed Ports     | Description                                                    |
| :----------- | :--------------------------- | :---------------- | :------------------------------------------------------------- |
| **gateway**  | `nginx:alpine`               | `80:80`           | Reverse proxy routing web traffic to frontend, studio, and API |
| **cms-ui**   | `apps/cms-ui/Dockerfile`     | Internal (`5173`) | Vite/React 19 visual studio & page builder                     |
| **frontend** | `apps/frontend/Dockerfile`   | Internal (`3000`) | Next.js 15 production server-rendered application              |
| **backend**  | `apps/backend/Dockerfile`    | Internal (`3000`) | Express REST API, MCP server, and media upload handler         |
| **worker**   | `apps/worker/Dockerfile`     | Internal          | BullMQ background worker process                               |
| **postgres** | `postgres:16-alpine`         | `5432:5432`       | Relational database storage                                    |
| **redis**    | `redis:7-alpine`             | `6379:6379`       | In-memory message broker & job queue                           |

---

## Documentation

- **Docker & Container Deployment Guide**: [docs/docker.md](docs/docker.md)
- **CMS UI Studio Guide**: [apps/cms-ui/README.md](apps/cms-ui/README.md)
- **Frontend App Guide**: [apps/frontend/README.md](apps/frontend/README.md)
- **Backend API Guide**: [apps/backend/README.md](apps/backend/README.md)
- **Architecture Decision Records (ADRs)**: [docs/adr/README.md](docs/adr/README.md)
  - [ADR-0001: Visual Page Builder Engine (GrapesJS)](docs/adr/0001-grapesjs-visual-builder-engine.md)
  - [ADR-0002: Dual-Builder Architecture (Schema + Canvas)](docs/adr/0002-dual-builder-architecture.md)
  - [ADR-0003: Client-Side State & Contract Envelopes](docs/adr/0003-client-state-and-contract-envelopes.md)
- **Operational Troubleshooting Runbook**: [docs/troubleshooting.md](docs/troubleshooting.md)
- **Component & UI Catalog**: [docs/components.md](docs/components.md)
- **Testing Strategy**: [docs/testing.md](docs/testing.md)
- **Software Requirements Specification (SRS)**: [docs/SRS.md](docs/SRS.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

## Common Commands

```bash
pnpm dev           # Start every app's dev server
pnpm lint          # Lint all apps and packages
pnpm check-types   # Type-check all apps and packages
pnpm format        # Format the codebase with Prettier
pnpm build         # Build all apps and packages
pnpm test          # Run backend + frontend unit/integration tests
```
