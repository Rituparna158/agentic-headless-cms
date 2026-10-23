# Agentic Headless CMS

Welcome to the **Agentic Headless CMS**! This project is a modular, API-first content management system designed to be operated collaboratively by both **human editors and autonomous AI agents**.

---

## Core Concepts: Headless & Agentic

### What is a Headless CMS?

Unlike a traditional CMS (like WordPress or Drupal) where the content database, admin dashboard, and public website templates are tightly coupled, a **Headless CMS** separates the content repository and management backend from the frontend presentation layer:

- **Backend & APIs:** The core CMS validates, manages, and stores content, exposing it through clean REST (`/api/v1`) and GraphQL (`/graphql`) endpoints.
- **Frontend Independence:** Any client application—a Next.js website, mobile app (iOS/Android), or external service—can fetch and render the exact same content from one central system using our client SDKs (`@repo/sdk-react`, `@repo/sdk-core`).

---

## Project Structure

This project uses a modern monorepo setup powered by **Turborepo** and **pnpm**:

### Applications (`apps/`)

- **apps/cms-ui**: Visual studio and page builder dashboard built with Vite 6, React 19, Tailwind CSS, and GrapesJS (default port: `3003`).
- **apps/frontend**: The visual admin dashboard built with Next.js 15 (App Router), Tailwind CSS, and shadcn/ui (default port: `3001`).
- **apps/backend**: The core backend API built with Express, supporting REST (`/api/v1`), GraphQL, MCP server, authentication, and RBAC (default port: `3000`).
- **apps/worker**: Background queue worker powered by BullMQ and Redis for async media transformations (Sharp) and event jobs.

### SDKs & Client Libraries (`packages/`)

- **packages/sdk-core**: Isomorphic TypeScript client for querying the CMS API.
- **packages/sdk-react**: React hooks (`useContentList`, `useContentEntry`, `useAuth`) powered by TanStack React Query.
- **packages/sdk-codegen**: CLI code generator that produces TypeScript types from dynamic CMS content schemas.
- **packages/sdk-nextjs**: Next.js App Router and Server Actions integration.
- **packages/sdk-node**: Server-side Node.js SDK.

### Shared Internal Packages (`packages/`)

- **packages/shared-ui**: Shared accessible component primitives, dialogs, tables, and design tokens.
- **packages/shared-db**: Database schemas, ORM logic (Drizzle), PostgreSQL adapter, migrations, and seed scripts.
- **packages/storage**: Multi-adapter storage (local disk and AWS S3/MinIO) with Sharp image processing.
- **packages/validation**: Zod validation schemas and dynamic content compilers.
- **packages/constants**: Shared runtime constants (error messages, HTTP status codes, cookies, email templates).
- **packages/middlewares**: Express middlewares (Authentication, RBAC, error handling, rate limiting).
- **packages/events**: Internal event emitter for system actions.
- **packages/types**: Shared compile-time TypeScript interfaces and domain definitions.
- **packages/config**: Centralized environment configuration and database adapters.
- **packages/logger**: High-performance structured JSON logging with Pino.
- **packages/utils**: Shared utility functions, pagination helpers, and error mappers.
- **packages/eslint-config**: Shared ESLint configuration.
- **packages/typescript-config**: Shared TypeScript configuration.

---

## Self-Hosted Production (Docker Compose)

For end-users and teams who want to run the self-hosted CMS platform without cloning the full repository or installing Node.js/pnpm:

1. **Download the production compose file and env template:**

   ```bash
   curl -O https://raw.githubusercontent.com/mindfire-test/agentic-headless-cms/main/docker-compose.prod.yml
   curl -O https://raw.githubusercontent.com/mindfire-test/agentic-headless-cms/main/.env.example
   cp .env.example .env
   ```

2. **Configure your secrets in `.env`:**
   Set your `JWT_SECRET` (at least 32 characters) and custom database password if needed.

3. **Start the platform:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
   _Pre-built production images for Backend, Frontend, Worker, PostgreSQL 16, and Redis 7 will be pulled directly from GitHub Container Registry (GHCR). Database migrations and initial admin account creation run automatically on first boot._

---

## Prerequisites (for Local Development)

- **Node.js** >= 20.9.0
- **pnpm** (see `packageManager` in `package.json`, version 9.0.0)
- **Docker** (recommended) — the bundled `docker-compose.yml` provisions a matching Postgres and Redis with zero manual setup.
- **PostgreSQL** >= 16
- **Redis** >= 5.0.0 — required by `apps/backend`'s job queue (BullMQ), which relies on Redis Streams.

---

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
   cp .env.example .env
   cp apps/backend/.env.example apps/backend/.env 2>/dev/null || true
   cp apps/cms-ui/.env.example apps/cms-ui/.env 2>/dev/null || true
   cp apps/frontend/.env.example apps/frontend/.env 2>/dev/null || true
   cp packages/shared-db/.env.example packages/shared-db/.env 2>/dev/null || true
   ```

4. **Run database migrations**:

   ```bash
   pnpm --filter @repo/shared-db run db:migrate
   ```

5. **Seed initial admin account & system schemas**:

   ```bash
   pnpm --filter @repo/shared-db run seed:admin
   pnpm --filter @repo/shared-db run seed:system-schemas
   ```

   Default login: `admin@agentic-cms.com` / `Password123!` (or configured `SEED_ADMIN_PASSWORD`).

6. **Start all application development servers**:

   ```bash
   pnpm dev
   ```

7. **Access application endpoints**:
   - **CMS UI Studio:** [http://localhost:3003](http://localhost:3003)
   - **Admin Dashboard:** [http://localhost:3001](http://localhost:3001)
   - **Backend API:** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
   - **Swagger API Docs:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
   - **GraphQL Playground:** [http://localhost:3000/graphql](http://localhost:3000/graphql)

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

## Consuming Content with Client SDKs

External frontend applications (React, Next.js, Remix, Astro) can consume published content directly:

```bash
npm install @repo/sdk-core @repo/sdk-react
```

```tsx
import React from 'react';
import { CmsProvider, useContentList } from '@repo/sdk-react';

function ArticleList() {
  const {
    data: articles,
    isLoading,
    error,
  } = useContentList('article', {
    status: 'published',
  });

  if (isLoading) return <p>Loading articles...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {articles?.map((article) => (
        <li key={article.id}>{article.title}</li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <CmsProvider baseUrl="http://localhost:3000/api/v1">
      <ArticleList />
    </CmsProvider>
  );
}
```

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

---

## Common Commands

```bash
pnpm dev           # Start every app's dev server in watch mode
pnpm lint          # Lint all apps and packages
pnpm check-types   # Type-check all apps and packages
pnpm format        # Format the codebase with Prettier
pnpm build         # Build all apps and packages
pnpm test          # Run backend + frontend unit/integration tests
```
