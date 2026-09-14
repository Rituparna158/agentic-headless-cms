# Frontend — Agentic Headless CMS Admin UI

Next.js 15 (App Router) visual admin dashboard for the Agentic Headless CMS. Built with TypeScript, Tailwind CSS, `@mindfiredigital/ignix-ui`, shadcn/ui primitives, Lexical Rich Text Editor, Zustand for client state, and TanStack React Query for server-state caching.

> **First time setting up the whole project?** Follow the root [README.md](../../README.md#getting-started-first-time-setup) — it covers Docker, environment variables, migrations, and seeding for the full stack. This document covers frontend-specific details.

---

## Setup & Configuration

The frontend connects to the backend API via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`):

```bash
# 1. From repository root, initialize the unified environment file
cp .env.example .env

# 2. (Optional) In apps/frontend, create a local override if your API is on another host
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# 3. Install dependencies
pnpm install
```

---

## Development Commands

Run from `apps/frontend/` or via `pnpm --filter frontend <command>`:

```bash
pnpm dev             # Start dev server on http://localhost:3001 (configured in package.json)
pnpm build           # Build Next.js production bundle (outputs standalone server)
pnpm start           # Run the production build on port 3001
pnpm lint            # Run ESLint across app code
pnpm check-types     # Generate Next.js types and check with TypeScript (tsc --noEmit)
pnpm test            # Run Vitest unit/component tests
pnpm test:watch      # Run tests in interactive watch mode
pnpm test:e2e        # Run Playwright end-to-end tests against live backend
pnpm test:e2e:ui     # Run Playwright tests in interactive UI mode
```

---

## Directory Structure

```
apps/frontend/
├── app/
│   ├── layout.tsx              # Root layout — TanStack Query provider, global fonts, toast notifications
│   ├── (auth)/login/           # Administrator authentication screen (with TOTP 2FA step)
│   └── (dashboard)/            # Dashboard shell (collapsible sidebar, breadcrumbs, topbar)
│       ├── content-manager/    # Dynamic schema entry list, creation, editing, and version history
│       ├── schema-builder/     # Visual drag-and-drop content modeler (single types & collections)
│       ├── media-library/      # Asset browser, multi-file uploader, folder management, and previews
│       ├── settings/           # System settings: Users, Roles, API Tokens, Locales, Webhooks
│       └── audit-logs/         # Auditable trail of human and agent actions
├── components/
│   ├── editor/                 # Lexical Rich Text Editor with markdown and formatting plugins
│   ├── ui/                     # Ignix UI & Radix primitives (Button, Dialog, Drawer, Input, Table)
│   ├── layout/                 # Responsive sidebar, navigation items, header
│   └── auth/                   # Authentication forms and 2FA verification modals
├── lib/
│   ├── api-client.ts           # Fetch client with cookie credentials and error mapping
│   ├── api/                    # Modular API client functions per domain (content, schemas, auth)
│   └── query-client.ts         # TanStack Query configuration and cache defaults
├── stores/
│   └── auth-store.ts           # Zustand store managing authenticated user session
├── Dockerfile                  # Multi-stage production build producing a minimal standalone Next.js image
└── playwright.config.ts        # Playwright E2E configuration
```

---

## Docker & Production Container

The frontend is packaged using a multi-stage Docker build:

- **`apps/frontend/Dockerfile`**: Compiles the application using Next.js `output: 'standalone'` mode. Unused files and devDependencies are stripped, resulting in an ultra-lean runtime image (<120MB) running on Alpine Linux under non-root user `nextjs`.
- **Default Port:** The container exposes port `3000` internally, which maps to `3001:3000` in `docker-compose.prod.yml`.
