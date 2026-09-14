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

- **apps/frontend**: The visual admin dashboard built with Next.js 15 (App Router), Tailwind CSS, and shadcn/ui.
- **apps/backend**: The core backend API built with Express 5, supporting REST (`/api/v1`), GraphQL, authentication, and RBAC.
- **apps/worker**: Background queue worker powered by BullMQ and Redis for async media transformations (Sharp) and event jobs.
- **apps/cms-ui**: Shared UI component library for CMS interfaces.

### SDKs & Client Libraries (`packages/`)

- **packages/sdk-core**: Isomorphic TypeScript client for querying the CMS API.
- **packages/sdk-react**: React hooks (`useContentList`, `useContentEntry`, `useAuth`) powered by TanStack React Query.
- **packages/sdk-codegen**: CLI code generator that produces TypeScript types from dynamic CMS content schemas.
- **packages/sdk-nextjs**: Next.js App Router and Server Actions integration.
- **packages/sdk-node**: Server-side Node.js SDK.

### Shared Internal Packages (`packages/`)

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
- **Docker** (recommended) — the bundled `docker-compose.yml` provisions a
  matching Postgres and Redis with zero manual setup. You can use your own
  instances instead as long as they meet the minimums below.
- **PostgreSQL** >= 16
- **Redis** >= 5.0.0 — required by `apps/backend`'s job queue (BullMQ), which relies on Redis Streams. Older versions (e.g. the deprecated Windows Redis port) will fail to boot the backend.

---

## Getting Started (first-time setup)

These steps get the whole stack — database, backend API, background worker, and frontend
dashboard — running locally from a fresh clone.

1. **Install dependencies** (run once, from the repo root):

   ```bash
   pnpm install
   ```

2. **Start Postgres and Redis:**

   ```bash
   docker compose up -d postgres redis
   ```

3. **Create your env file** from the checked-in example:

   ```bash
   cp .env.example .env
   ```

   The defaults work as-is against the `docker-compose.yml` services — you
   only need to edit values if you're pointing at your own Postgres/Redis, or
   configuring real SMTP/S3 credentials (see `apps/backend/README.md`).

4. **Run database migrations:**

   ```bash
   pnpm --filter @repo/shared-db run db:migrate
   ```

5. **Seed the initial admin user & system schemas:**

   ```bash
   pnpm --filter @repo/shared-db run seed:admin
   pnpm --filter @repo/shared-db run seed:system-schemas
   ```

   Logs in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (default: `admin@agentic-cms.com` / `admin`).

6. **Start every app's development server** (frontend + backend + worker, via Turborepo):

   ```bash
   pnpm dev
   ```

7. **Access the applications:**
   - **Admin Dashboard:** [http://localhost:3001](http://localhost:3001) (log in with the seeded admin credentials).
   - **Backend API:** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
   - **Swagger API Docs:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
   - **GraphQL Playground:** [http://localhost:3000/graphql](http://localhost:3000/graphql)

_(Alternatively, you can build and run all 5 containers locally from source using `docker compose up --build -d`)_.

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

## Common Commands

```bash
pnpm dev           # Start every app's dev server in watch mode
pnpm lint          # Lint all apps and packages
pnpm check-types   # Type-check all apps and packages
pnpm format        # Format the codebase with Prettier
pnpm build         # Build all apps and packages
pnpm test          # Run backend + frontend unit/integration tests
```
