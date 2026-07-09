# Agentic Headless CMS

Welcome to the **Agentic Headless CMS**! This project is a modular, API-first content management system designed to be operated by both human editors and AI agents.

## Project Structure

This project uses a modern monorepo setup powered by **Turborepo** and **pnpm**:

- **apps/frontend**: The frontend dashboard built with Next.js, Tailwind CSS, and shadcn/ui.
- **apps/backend**: The core backend API built with NestJS.
- **packages/db**: Database schemas, ORM logic (Drizzle), and migrations.
- **packages/ui**: Shared React components.
- **packages/types**: Shared TypeScript types and Zod validation schemas.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm dev
   ```
