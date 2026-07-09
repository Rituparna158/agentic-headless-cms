# Agentic Headless CMS

Welcome to the **Agentic Headless CMS**! This project is a modular, API-first content management system designed to be operated by both human editors and AI agents.

## Project Structure

This project uses a modern monorepo setup powered by **Turborepo** and **pnpm**:

- **apps/frontend**: The frontend dashboard built with Next.js, Tailwind CSS, and shadcn/ui.
- **apps/backend**: The core backend API built with NestJS.
- **packages/shared-db**: Database schemas, ORM logic (Drizzle), and migrations.
- **packages/shared-types**: Shared TypeScript types and Zod validation schemas.
- **packages/eslint-config**: Shared ESLint configuration.
- **packages/typescript-config**: Shared TypeScript configuration.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm dev
   ```

## Common Commands

```bash
pnpm lint          # Lint all apps and packages
pnpm check-types   # Type-check all apps and packages
pnpm format        # Format the codebase with Prettier
pnpm build         # Build all apps and packages
```
