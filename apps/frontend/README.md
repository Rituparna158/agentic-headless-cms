# Frontend — Agentic Headless CMS Admin UI

Next.js (App Router) admin dashboard. Tailwind CSS v4 + shadcn/ui, Zustand for auth state, TanStack
Query for server-state fetching/caching, React Hook Form + Zod for forms.

> First time setting up the whole project? Follow the root
> [README.md](../../README.md#getting-started-first-time-setup) — it covers
> Docker, env files, migrations, and seeding for the full stack. This file
> only covers frontend-specific details.

## Setup

```bash
cp .env.example .env   # then adjust NEXT_PUBLIC_API_URL if the backend isn't on localhost:3000
pnpm install
```

## Commands

```bash
pnpm dev             # dev server on http://localhost:3001 (backend already uses 3000)
pnpm build           # production build
pnpm start           # run the production build
pnpm lint            # eslint
pnpm check-types     # next typegen && tsc --noEmit
pnpm test            # vitest run (unit tests)
pnpm test:watch      # vitest watch mode
pnpm test:e2e        # playwright (see docs/testing.md for the test-database setup)
pnpm test:e2e:ui     # playwright, interactive UI mode
```

## Structure

```
app/
  layout.tsx              root layout — QueryProvider, global styles
  (auth)/login/            login screen (no public register — admin users are invited, see Settings > Users)
  (dashboard)/             dashboard shell (sidebar + topbar) and its pages
components/
  ui/                       shadcn/ui primitives
  layout/                   sidebar, topbar, nav config
  auth/                     login form
  providers/                TanStack Query provider
lib/
  api-client.ts             fetch wrapper (credentials: 'include' for the backend's session cookie)
  api/                       per-resource API calls
  query-client.ts           TanStack Query client factory
stores/
  auth-store.ts             Zustand auth/session state
```
