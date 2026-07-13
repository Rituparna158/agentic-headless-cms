# Frontend — Agentic Headless CMS Admin UI

Next.js (App Router) admin dashboard. Tailwind CSS v4 + shadcn/ui, Zustand for auth state, TanStack
Query for server-state fetching/caching, React Hook Form + Zod for forms.

## Setup

```bash
cp .env.example .env   # then adjust NEXT_PUBLIC_API_URL if the backend isn't on localhost:3000
pnpm install
```

## Commands

```bash
pnpm dev            # dev server on http://localhost:3001
pnpm build           # production build
pnpm start           # run the production build
pnpm lint            # eslint
pnpm check-types     # next typegen && tsc --noEmit
```

Runs on port **3001**, not Next's default 3000 — `apps/backend` already uses 3000, so this was moved
to avoid a collision when running both apps at once.

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
