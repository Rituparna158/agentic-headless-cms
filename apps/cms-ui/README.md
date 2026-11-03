# CMS UI — Agentic Headless CMS Studio & Page Builder

A high-performance, dark-mode native visual content studio and administration interface for the **Agentic Headless CMS**. Built with **React 19**, **Vite 6**, **TypeScript**, **Tailwind CSS**, and **GrapesJS**, `cms-ui` provides human editors and marketers with a visual workstation for managing content collections, configuring custom schemas, and designing responsive web pages.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Prerequisites & Port Allocation](#prerequisites--port-allocation)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Directory Structure](#directory-structure)
- [Core Workflows & Features](#core-workflows--features)
  - [Dual-Builder Architecture](#dual-builder-architecture)
  - [Authentication & Session Hydration](#authentication--session-hydration)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
  - [Canvas Autosave & Draft Recovery](#canvas-autosave--draft-recovery)
  - [Real User Monitoring (RUM) Telemetry](#real-user-monitoring-rum-telemetry)
- [Testing & Quality Assurance](#testing--quality-assurance)
  - [Unit Testing & 80% Coverage Gate](#unit-testing--80-coverage-gate)
  - [End-to-End Testing (Playwright)](#end-to-end-testing-playwright)
  - [Performance Budgets (Size-Limit)](#performance-budgets-size-limit)
- [Troubleshooting & References](#troubleshooting--references)

---

## Overview & Architecture

`apps/cms-ui` operates as an independent single-page application (SPA) within the Turborepo monorepo:

- **Build Engine**: [Vite 6](https://vitejs.dev/) with Rollup-level manual chunking for aggressive vendor code-splitting.
- **Rendering & UI Runtime**: [React 19](https://react.dev/) + [React Router v7](https://reactrouter.com/) (route-level lazy loading via `React.lazy()` and `Suspense`).
- **Styling & Design System**: [Tailwind CSS v3](https://tailwindcss.com/) paired with `@repo/shared-ui` design primitives, Lucide icons, and sleek dark-mode glassmorphism.
- **Server-State Management**: [TanStack Query v5](https://tanstack.com/query/latest) with 5-minute stale-time caching, query cancellation, and optimistic UI mutations.
- **Client-State Management**: [Zustand v5](https://zustand-demo.pmnd.rs/) for lightweight, persistent client stores (session status, canvas history, autosave state).
- **Visual Builder Engine**: [GrapesJS v0.23](https://grapesjs.com/) embedded in a sandboxed iframe with custom block registration, responsive viewport switching, and DOM-isolated styles.
- **Contract Resilience**: Strict runtime schema validation via [Zod v4](https://zod.dev/) in `requestHandler.ts`, ensuring all API responses conform to the `{ success: true, data: T }` envelope.

---

## Prerequisites & Port Allocation

| Service              | Application Path     | Default Port | Protocol | Purpose                                |
| :------------------- | :------------------- | :----------- | :------- | :------------------------------------- |
| **CMS UI Studio**    | `apps/cms-ui`        | `3003`       | HTTP     | Visual studio & admin dashboard (Vite) |
| **Backend API**      | `apps/backend`       | `3000`       | HTTP     | Express REST API & MCP Server          |
| **Frontend Web App** | `apps/frontend`      | `3001`       | HTTP     | Next.js production presentation site   |
| **PostgreSQL**       | `packages/shared-db` | `5432`       | TCP      | Relational content & schema storage    |
| **Redis**            | `apps/backend`       | `6379`       | TCP      | BullMQ job queue & cache               |

> [!IMPORTANT]
> `cms-ui` runs on port **3003** by default (`strictPort: true`). Ensure port 3003 is free or configure `VITE_PORT` in your environment.

---

## Quick Start

From the root of the repository:

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure environment**:

   ```bash
   cp apps/cms-ui/.env.example apps/cms-ui/.env
   ```

3. **Start backend services** (Postgres + Redis + API):

   ```bash
   docker compose up -d
   pnpm --filter @repo/shared-db run db:migrate
   pnpm --filter backend run seed:admin
   ```

4. **Start the CMS UI development server**:

   ```bash
   pnpm --filter cms-ui dev
   ```

5. **Open Studio**: Navigate to [http://localhost:3003](http://localhost:3003) and log in with:
   - Email: `admin@agentic-cms.com` (or value of `SEED_ADMIN_EMAIL`)
   - Password: `Password123!` (or value of `SEED_ADMIN_PASSWORD`)

---

## Environment Configuration

Environment variables are validated on startup using Zod in [src/config/env.ts](src/config/env.ts).

| Variable           | Type                                      | Default       | Description                                                                                                |
| :----------------- | :---------------------------------------- | :------------ | :--------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`     | `string`                                  | `/api/v1`     | URL of the backend API. Can be a relative path (proxied) or absolute URL (`http://localhost:3000/api/v1`). |
| `VITE_ENVIRONMENT` | `'development' \| 'production' \| 'test'` | `development` | Active build mode. In production, sourcemap generation is omitted.                                         |
| `VITE_APP_ID`      | `string`                                  | `CMS_UI`      | App identifier sent in `X-App-Id` request headers for telemetry and audit attribution.                     |

---

## Available Scripts

Run these commands from the repo root using `pnpm --filter cms-ui <script>` or directly within `apps/cms-ui`:

| Command              | Purpose                                                                                                     |
| :------------------- | :---------------------------------------------------------------------------------------------------------- |
| `pnpm dev`           | Starts the Vite development server with Hot Module Replacement on `http://localhost:3003`.                  |
| `pnpm build`         | Compiles TypeScript and builds production-optimized static assets to `dist/`.                               |
| `pnpm build:analyze` | Builds production bundle and generates an interactive Rollup bundle visualizer report at `dist/stats.html`. |
| `pnpm preview`       | Serves the production build from `dist/` locally for verification.                                          |
| `pnpm lint`          | Runs ESLint with boundary rules across all TypeScript and React files.                                      |
| `pnpm check-types`   | Type-checks the entire application using `tsc --noEmit`.                                                    |
| `pnpm test`          | Runs all unit and integration test suites using Vitest.                                                     |
| `pnpm test:watch`    | Runs Vitest in interactive watch mode for TDD workflows.                                                    |
| `pnpm test:coverage` | Executes tests with V8 coverage and enforces **>= 80% coverage gates**.                                     |
| `pnpm test:e2e`      | Runs Playwright end-to-end browser workflows in headless Chromium.                                          |
| `pnpm size-limit`    | Audits route-level bundle sizes and execution time budgets using `@size-limit/preset-app`.                  |

---

## Directory Structure

```text
apps/cms-ui/
├── e2e/                           # Playwright end-to-end browser test suites
│   └── cms-workflow.spec.ts       # Full login, SideDrawer, and publishing workflow
├── __tests__/                     # Vitest unit test suites (> 80% coverage enforced)
│   └── unit/
│       ├── a11y/                 # Accessibility assertions (vitest-axe)
│       ├── api/                  # Axios client, requestHandler, error normalizers
│       ├── features/             # Feature-specific store, hook, and utility tests
│       ├── security/             # DOMPurify injection tests & AuthGuard ejection
│       └── utils/                # Image URL formatting, slugification, and web vitals
├── public/                        # Static assets, favicon, and icons
├── src/
│   ├── api/                       # API layer: client, endpoints, and requestHandler
│   ├── components/                # Reusable UI components & layouts
│   │   ├── Guard/                 # AuthGuard, AuthHydrator, RoleGuard, AdminOrSupportGuard
│   │   ├── Layout/                # DashboardLayout, AuthLayout, Topbar
│   │   ├── PageSideDrawer/        # Slide-over drawer for schema and page metadata editing
│   │   ├── Sidebar/               # Collapsible accessible navigation menu
│   │   └── ui/                    # Error boundaries, live announcer, empty states
│   ├── config/                    # Zod-validated environment config
│   ├── features/                  # Domain-driven feature modules
│   │   ├── access/                # Users, roles, permissions, and API tokens
│   │   ├── audit/                 # Audit log viewer and action formatters
│   │   ├── auth/                  # Login, MFA challenge, forgot password, session store
│   │   ├── collections/           # Schemas, entries, visual page builder, and preview
│   │   │   ├── components/        # Grid cards, stats, modals, and builder canvas
│   │   │   ├── hooks/             # Canvas autosave, draft recovery
│   │   │   ├── pages/             # CollectionsList, CollectionEntries, PageEditor
│   │   │   ├── storage/           # IndexedDB/localStorage draft recovery buffer
│   │   │   └── utils/             # Schema normalizers, video embed, sanitizers
│   │   └── posts/                 # Post management, author normalization
│   ├── hooks/                     # Custom React hooks (useFocusTrap, useDebouncedValue)
│   ├── pages/                     # Standalone top-level routes (Login, NotFound, etc.)
│   ├── types/                     # TypeScript interfaces and API response contracts
│   ├── utils/                     # Slugify, imageUrl, Core Web Vitals beacon
│   ├── App.tsx                    # Route definitions and provider hierarchy
│   ├── index.css                  # Tailwind styles and global CSS custom properties
│   └── main.tsx                   # React root mount and telemetry initializer
├── Dockerfile                     # Multi-stage production Nginx container build
├── playwright.config.ts           # Playwright E2E configuration
├── tailwind.config.js             # Tailwind design tokens and animations
├── vite.config.ts                 # Vite bundler, chunking, and dev server config
└── vitest.config.ts               # Vitest configuration and coverage thresholds
```

---

## Core Workflows & Features

### Dual-Builder Architecture

`cms-ui` implements a dual-layer content management architecture balancing structured headless data modeling with visual presentation autonomy:

1. **Structured Schema Layer (`PageSideDrawer`)**:
   - Enables defining dynamic custom schemas (`fields: DynamicFieldDefinition[]`) with typed properties (text, richtext, boolean, number, select, media, relation).
   - Content entered here is stored as clean JSON in the database and delivered directly to headless consumers via REST, GraphQL, or the Model Context Protocol (MCP) server.
2. **Visual Presentation Layer (`GrapesJSEditor`)**:
   - Provides a drag-and-drop WYSIWYG canvas built on GrapesJS.
   - Includes custom block plugins (`HeroSection`, `FeatureGrid`, `PricingTable`, `Testimonials`, `MapEmbed`, `DynamicForm`, etc.).
   - Renders inside an isolated iframe, preventing style collisions between the admin dashboard and the edited document.
   - Automatically parses dynamic slots and persists structured layout blocks.

_For full technical rationale, see [docs/adr/0002-dual-builder-architecture.md](../../docs/adr/0002-dual-builder-architecture.md)._

### Authentication & Session Hydration

- **Cookie-Based Sessions**: Uses HTTP-only, SameSite cookies managed by the backend API.
- **Hydration at Startup**: [AuthHydrator.tsx](src/components/Guard/AuthHydrator.tsx) mounts at the root and executes `authApi.getCurrentUser()` (`GET /api/v1/auth/me`).
- **Reactive Zustand Store**: State transitions (`idle` → `loading` → `authenticated` \| `unauthenticated` \| `mfa_challenge_required`) drive routing automatically without screen flicker.
- **MFA Support**: Integrated TOTP enrollment and challenge verification forms.

### Role-Based Access Control (RBAC)

Routing is defended by specialized guard wrappers:

- `AuthGuard`: Ejects unauthenticated requests to `/login`.
- `RoleGuard`: Evaluates user capabilities (`manage_users`, `manage_content`). Super admins (`admin` role) automatically bypass capability checks.
- `AdminOrSupportGuard`: Restricts privileged administrative routes (MFA reset requests, system audits).

### Canvas Autosave & Draft Recovery

- **Debounced Local Storage**: Edits in the visual builder are automatically written to a browser storage buffer (`useCanvasAutoSave.ts`).
- **Crash Recovery**: If an editor closes a tab or loses connectivity before saving, [DraftRecoveryBanner.tsx](src/features/collections/pages/editors/components/DraftRecoveryBanner.tsx) detects the newer local revision upon return and prompts the user to restore unsaved changes.
- **Status Indicators**: Real-time canvas indicators display `"All changes saved"`, `"Saving..."`, or `"Unsaved changes"`.

### Real User Monitoring (RUM) Telemetry

Initializes automatically on startup via [webVitals.ts](src/utils/webVitals.ts):

- Collects **CLS**, **INP**, **LCP**, **FCP**, and **TTFB**.
- Flushes metrics using `navigator.sendBeacon` to `/api/v1/telemetry/vitals` on page unload or visibility transition.

---

## Testing & Quality Assurance

### Unit Testing & 80% Coverage Gate

Unit tests run with Vitest and `@testing-library/react`. Coverage is enforced in [vitest.config.ts](vitest.config.ts):

```bash
pnpm --filter cms-ui run test:coverage
```

**Quality Gates Enforced**:

- Statements: **>= 80%**
- Branches: **>= 70%**
- Functions: **>= 80%**
- Lines: **>= 80%**

Negative security tests verify that [template-sanitizer.util.ts](src/features/collections/utils/template-sanitizer.util.ts) strips malicious scripts, event handlers (`onerror`, `onload`), dangerous schemes (`javascript:`, `vbscript:`, `data:text/html`), and forbidden DOM nodes before canvas persistence.

### End-to-End Testing (Playwright)

End-to-end tests verify critical editor user journeys:

1. Admin authentication and route redirection.
2. Navigating collections, opening `PageSideDrawer`, modifying page meta, and saving drafts.
3. Publishing pages live directly from the drawer.

Run E2E tests:

```bash
pnpm --filter cms-ui test:e2e
```

### Performance Budgets (Size-Limit)

Route chunks are tracked with `@size-limit/preset-app` to prevent bundle bloat:

```bash
pnpm --filter cms-ui run size-limit
```

All lazy-loaded routes (Page Editor, Collections, Audit Logs, Settings) are budgeted under **250 kB brotlied** and under **550 ms loading time** on simulated 3G networks.

---

## Troubleshooting & References

- **Operational Troubleshooting Runbook**: Consult [docs/troubleshooting.md](../../docs/troubleshooting.md) for detailed diagnostics regarding CORS mismatches, GrapesJS iframe rendering, Vitest version drift, and cookie alignment.
- **Architecture Decision Records**:
  - [ADR-0001: Visual Page Builder Engine (GrapesJS)](../../docs/adr/0001-grapesjs-visual-builder-engine.md)
  - [ADR-0002: Dual-Builder Architecture (Schema + Canvas)](../../docs/adr/0002-dual-builder-architecture.md)
  - [ADR-0003: Client-Side State & Contract Envelopes](../../docs/adr/0003-client-state-and-contract-envelopes.md)
- **Shared UI Component Catalog**: See [docs/components.md](../../docs/components.md).
