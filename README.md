# Agentic Headless CMS

Welcome to the **Agentic Headless CMS**! This project is a modular, API-first content management system designed to be operated by both human editors and AI agents.

## Project Structure

This project uses a modern monorepo setup powered by **Turborepo** and **pnpm**:

- **apps/frontend**: The frontend dashboard built with Next.js, Tailwind CSS, and shadcn/ui.
- **apps/backend**: The core backend API built with Express.
- **packages/shared-db**: Database schemas, ORM logic (Drizzle), and migrations.
- **packages/shared-types**: Shared TypeScript types and Zod validation schemas.
- **packages/eslint-config**: Shared ESLint configuration.
- **packages/typescript-config**: Shared TypeScript configuration.

## Prerequisites

- **Node.js** >= 20.9.0
- **pnpm** (see `packageManager` in `package.json`)
- **Redis** >= 5.0.0 — required by `apps/backend`'s job queue (BullMQ), which relies on Redis Streams. Older versions (e.g. the deprecated Windows Redis port) will fail to boot the backend. The bundled `docker-compose.yml` provisions a compatible version (`redis:7-alpine`); if you run Redis yourself, make sure it meets this minimum.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start every app's development server (frontend + backend, via Turborepo):
   ```bash
   pnpm dev
   ```

## Running the Frontend Only

1. Copy the example environment file and adjust it if needed:
   ```bash
   cp apps/frontend/.env.example apps/frontend/.env
   ```
2. Start just the frontend dev server:
   ```bash
   pnpm --filter frontend dev
   ```
3. Open [http://localhost:3001](http://localhost:3001).

The frontend runs on port **3001**, not 3000 — `apps/backend` already uses 3000, so the frontend was moved to avoid a port collision when running both at once.

## Common Commands

```bash
pnpm lint          # Lint all apps and packages
pnpm check-types   # Type-check all apps and packages
pnpm format        # Format the codebase with Prettier
pnpm build         # Build all apps and packages
```
