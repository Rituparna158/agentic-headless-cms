# ADR-0004: Resilient Observability, Accessible Primitives, and Production Hardening

## Status

**Accepted** (Date: 2026-11-25)

## Context

As `apps/cms-ui` expands from early prototypes to an enterprise-grade visual studio and admin portal, frontend stability, accessibility, and operational security require concrete architectural boundaries:

1. **Accessibility (WCAG 2.1 AA Standard)**: Keyboard users and assistive technologies require interactive components—especially data tables and form controls—to be fully keyboard-operable with standard ARIA roles, live announcements, and visible focus indicators.
2. **Resilient Background Polling**: Real-time state synchronizations must not create unbounded background requests when browser tabs are hidden, nor cause cascading request overlaps or silent failures during transient network drops.
3. **Session Refresh Single-Flight Coordination**: Multiple concurrent API requests encountering 401 Unauthorized responses must not flood the auth service with duplicate refresh calls or create reload loops.
4. **DevOps & Production Container Hardening**: Static SPA delivery must enforce non-root runtime permissions, native container healthchecks, immutable asset caching, and gzip compression.

---

## Decision

We instituted the following foundational patterns across `apps/cms-ui`:

### 1. Accessible UI Primitives (`FormField`, `DataTable`, `FieldShell`)

- **Discriminated Union `FormField`**: Form controls share a single typed interface with discriminated union on `props.type`, binding `aria-invalid` and `aria-describedby` automatically.
- **Memoized Table Rows (`DataTableRow`)**: Table rows rendering dynamic data are wrapped in `React.memo` keyed on `row.id` to prevent wide-table re-render bottlenecks. Clickable rows implement `tabIndex={0}`, `role="button"`, and Enter/Space `onKeyDown` handlers.
- **Centralized `LiveAnnouncer` & `SkipLink`**: Centralized polite live region announces asynchronous status changes; top-level skip links allow keyboard bypass of dashboard navigation.

### 2. Resilient Polling Lifecycle (`usePolling`)

The universal polling hook enforces:

- Automatic pause when `document.hidden` is true, resuming on `visibilitychange`.
- Strict sequential tick execution: the previous tick must settle before the next is scheduled.
- Consecutive failure threshold monitoring with visual user alerts on 3 consecutive dropouts.

### 3. Single-Flight 401 Session Refresh Lock

In `src/api/client.ts`, 401 responses trigger a cross-tab single-flight lock via `navigator.locks.request('auth-refresh', ...)`, with an in-flight promise fallback for LAN or non-supported browser contexts. In-flight requests queue until the lock releases, preventing token churn and redirect bounce.

### 4. Container and Static Server Hardening

- **Multi-Stage Dockerfile**: Pinned base image (`node:24-alpine` -> `nginx-unprivileged:1.27-alpine`), explicit `USER nginx`, and container `HEALTHCHECK`.
- **Production Nginx (`nginx.conf`)**:
  - Gzip compression on `text/plain`, `text/css`, `application/javascript`, `application/json`, `image/svg+xml`.
  - Immutable 1-year caching for `/assets/` and `no-store, no-cache, must-revalidate` for `index.html`.
  - Security headers: `server_tokens off;`, `X-Content-Type-Options: nosniff;`, `X-Frame-Options: SAMEORIGIN;`.

---

## Consequences

- **Positive**: 100% WCAG AA keyboard operability; zero test exclusions with >= 80% coverage enforced; zero duplicate 401 refresh storms; hardened non-root container deployment.
- **Trade-offs**: Slightly increased boilerplate for table rows to maintain strict keyboard and ARIA specifications.
