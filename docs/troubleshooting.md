# Operational Troubleshooting & Runbook

This guide provides diagnostics, root cause explanations, and step-by-step remediation procedures for common development, testing, and deployment issues across the **Agentic Headless CMS** platform.

---

## Table of Contents

- [1. Authentication & Cookie Issues](#1-authentication--cookie-issues)
  - [Symptom: 401 Unauthorized Loop or Immediate Logout on Localhost](#symptom-401-unauthorized-loop-or-immediate-logout-on-localhost)
  - [Symptom: CORS Blocked by Origin Policy](#symptom-cors-blocked-by-origin-policy)
- [2. GrapesJS Visual Builder & Canvas Issues](#2-grapesjs-visual-builder--canvas-issues)
  - [Symptom: Visual Canvas Renders Blank or Styles Do Not Apply](#symptom-visual-canvas-renders-blank-or-styles-do-not-apply)
  - [Symptom: Unsaved Canvas Changes Lost on Reload](#symptom-unsaved-canvas-changes-lost-on-reload)
- [3. Testing & Tooling Issues](#3-testing--tooling-issues)
  - [Symptom: Vitest Coverage Crashes with `TypeError: Cannot read properties of undefined`](#symptom-vitest-coverage-crashes-with-typeerror-cannot-read-properties-of-undefined)
  - [Symptom: Playwright E2E Fails with Strict Mode Violation](#symptom-playwright-e2e-fails-with-strict-mode-violation)
  - [Symptom: Playwright Mock Throws `Cannot use 'in' operator to search for 'mfaRequired' in undefined`](#symptom-playwright-mock-throws-cannot-use-in-operator-to-search-for-mfarequired-in-undefined)
- [4. Build, Monorepo & Bundle Budget Issues](#4-build-monorepo--bundle-budget-issues)
  - [Symptom: Size-Limit Budget Violation on Page Editor](#symptom-size-limit-budget-violation-on-page-editor)
  - [Symptom: Turborepo Fails with Missing Type Declarations](#symptom-turborepo-fails-with-missing-type-declarations)

---

## 1. Authentication & Cookie Issues

### Symptom: 401 Unauthorized Loop or Immediate Logout on Localhost

#### Cause

The backend API issues session cookies with `HttpOnly`, `SameSite=Lax`, and conditional `Secure` flags. If `COOKIE_SECURE=true` is set while developing over plain HTTP on `http://localhost:3003`, browsers will silently reject or discard the cookie. Furthermore, if `client.ts` does not specify `withCredentials: true`, cookies will not be sent on cross-origin requests between port 3003 (CMS UI) and port 3000 (Backend API).

#### Remediation

1. Verify `apps/backend/.env` has:
   ```bash
   COOKIE_SECURE=false
   COOKIE_SAME_SITE=lax
   CORS_ORIGIN=http://localhost:3003,http://localhost:3001
   ```
2. Confirm [client.ts](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/api/client.ts) includes `withCredentials: true`:
   ```typescript
   export const apiClient = axios.create({
     baseURL: env.VITE_API_URL,
     withCredentials: true,
   });
   ```
3. In Chrome/Brave, check Developer Tools → Application → Cookies → `http://localhost:3000` to confirm `session` or `token` cookie presence.

---

### Symptom: CORS Blocked by Origin Policy

```text
Access to XMLHttpRequest at 'http://localhost:3000/api/v1/...' from origin 'http://localhost:3003'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check.
```

#### Cause

The backend's Express CORS middleware is rejecting the `Origin` header sent by Vite (port 3003).

#### Remediation

1. Open `apps/backend/.env` and update `CORS_ORIGIN`:
   ```bash
   CORS_ORIGIN=http://localhost:3003,http://localhost:3001
   ```
2. Ensure the backend includes credentials in the CORS configuration:
   ```typescript
   cors({
     origin: process.env.CORS_ORIGIN?.split(','),
     credentials: true,
   });
   ```
3. Restart the backend process (`pnpm --filter backend dev`).

---

## 2. GrapesJS Visual Builder & Canvas Issues

### Symptom: Visual Canvas Renders Blank or Styles Do Not Apply

#### Cause

GrapesJS embeds the canvas document inside a sandboxed `<iframe>`. The parent document's Tailwind CSS stylesheets and design tokens do not cascade into the iframe by default. If the canvas container has 0 height or missing injected stylesheets, components appear unstyled or invisible.

#### Remediation

1. Verify that `apps/cms-ui/src/features/collections/pages/editors/GrapesJSTheme.css` is loaded by the editor.
2. In [GrapesJSEditor.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/collections/pages/editors/GrapesJSEditor.tsx), ensure the canvas configuration injects the Tailwind base CSS:
   ```typescript
   canvas: {
     styles: [
       'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.17/dist/tailwind.min.css',
       '/src/features/collections/pages/editors/GrapesJSTheme.css',
     ],
   }
   ```
3. Inspect the DOM to ensure `#gjs-container` has explicit CSS sizing (`height: 100%` and `flex: 1`).

---

### Symptom: Unsaved Canvas Changes Lost on Reload

#### Cause

The user closed the browser tab before clicking "Save Draft" or "Publish Live", and the local storage autosave buffer was either disabled or evicted.

#### Remediation

1. Check the top of the canvas for the [DraftRecoveryBanner.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/collections/pages/editors/components/DraftRecoveryBanner.tsx). If an unsaved local snapshot is detected, click **"Restore Local Draft"**.
2. Verify browser storage in DevTools → Application → Local Storage → key: `canvas_draft_<pageId>`.
3. Check `apps/cms-ui/src/features/collections/hooks/useCanvasAutoSave.ts` to ensure the debounce interval is active (default: 2000 ms).

---

## 3. Testing & Tooling Issues

### Symptom: Vitest Coverage Crashes with `TypeError: Cannot read properties of undefined`

```text
TypeError: Cannot read properties of undefined (reading 'split')
  at node_modules/@vitest/coverage-v8/...
```

#### Cause

Version drift between `vitest` and `@vitest/coverage-v8`. In Vitest 3/4, the coverage provider package must match the exact core version.

#### Remediation

Ensure both packages are strictly pinned to the identical version in `package.json`:

```json
{
  "devDependencies": {
    "vitest": "4.1.10",
    "@vitest/coverage-v8": "4.1.10"
  }
}
```

Run `pnpm install` and verify with `pnpm --filter cms-ui run test:coverage`.

---

### Symptom: Playwright E2E Fails with Strict Mode Violation

```text
Error: strict mode violation: locator('div[role="dialog"]').locator('text=Publish') resolved to 2 elements:
  1) <strong class="text-emerald-400">Published Live</strong>
  2) <span>Publishing...</span>
```

#### Cause

Playwright's `locator('text=...')` matches any element containing the substring. When multiple elements in the DOM share the phrase (such as a status badge and a button label), Playwright throws a strict mode error.

#### Remediation

Disambiguate the locator using specific Playwright locator helpers:

- Target exact text: `page.getByText('Published Live', { exact: true })`
- Target buttons by role: `page.getByRole('button', { name: 'Publish Live' })`

---

### Symptom: Playwright Mock Throws `Cannot use 'in' operator to search for 'mfaRequired' in undefined`

#### Cause

The centralized [requestHandler.ts](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/api/requestHandler.ts) expects all backend endpoints to return an envelope matching `{ success: boolean, data: T }`. If a mock in `cms-workflow.spec.ts` fulfills raw data directly (e.g., `{ id: 'user-1' }`), `res.data` becomes `undefined`, triggering a runtime TypeError.

#### Remediation

Always wrap mock responses in the API contract envelope:

```typescript
await page.route('**/api/v1/auth/login', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        id: 'admin-e2e-user',
        email: 'admin@agentic-cms.com',
        roles: ['admin'],
        permissions: [],
      },
    }),
  });
});
```

---

## 4. Build, Monorepo & Bundle Budget Issues

### Symptom: Size-Limit Budget Violation on Page Editor

```text
Package size limit has been exceeded:
  Route: Page Editor
  Size limit:   250 kB
  Size:         1.29 MB (exceeded by 1.04 MB)
```

#### Cause

Synchronous imports of heavy third-party canvas dependencies (`grapesjs`, plugins, `html2canvas`) pull large libraries into the main route chunk instead of being code-split.

#### Remediation

1. Verify `vite.config.ts` includes Rollup manual chunks:
   ```typescript
   manualChunks(id) {
     if (id.includes('grapesjs')) return 'grapesjs';
     if (id.includes('grapesjs-blocks-basic') || id.includes('grapesjs-plugin-forms')) return 'grapesjs-plugins';
     if (id.includes('html2canvas')) return 'html2canvas';
   }
   ```
2. Verify [App.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/App.tsx) uses `React.lazy()` for route code splitting.
3. Run `pnpm --filter cms-ui run size-limit` to confirm all chunks pass within the 250 kB limit.

---

### Symptom: Turborepo Fails with Missing Type Declarations

```text
Cannot find module '@repo/types' or its corresponding type declarations.
```

#### Cause

Internal monorepo packages (`@repo/types`, `@repo/validation`, `@repo/shared-db`) have not been built before running the application.

#### Remediation

Run a monorepo build for dependency packages:

```bash
pnpm --filter "@repo/*" run build
```

Turborepo will compile TypeScript declarations to their respective `dist/` folders and cache the output.
