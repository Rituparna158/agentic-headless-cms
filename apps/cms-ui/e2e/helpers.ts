import type { Page } from '@playwright/test';

export const adminUser = {
  id: 'admin-e2e-user',
  email: 'admin@agentic-cms.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  mfaEnabled: false,
  permissions: [],
};

export const site = {
  id: 'site-1',
  name: 'Acme',
  slug: 'acme',
  type: 'collection',
  description: 'Acme marketing site',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {},
};

const pagination = (total: number) => ({
  page: 1,
  pageSize: 10,
  total,
  pageCount: total ? 1 : 0,
});

export const json = (status: number, body: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/**
 * Mocks the whole API for an authenticated admin session. Unknown endpoints
 * answer with an empty paginated list so pages render their empty states.
 */
export async function mockAuthenticatedApi(
  page: Page,
  overrides: Array<{ match: RegExp; body: unknown; status?: number }> = [],
) {
  await page.route('**/api/v1/telemetry/**', (r) => r.fulfill({ status: 204 }));
  await page.route('**/api/v1/auth/me', (r) =>
    r.fulfill(json(200, { success: true, data: adminUser })),
  );
  await page.route('**/api/v1/**', (r) => {
    const url = r.request().url();
    if (/\/auth\/|\/telemetry\//.test(url)) return r.fallback();
    const hit = overrides.find((o) => o.match.test(url));
    if (hit) {
      return r.fulfill(
        json(hit.status ?? 200, { success: true, data: hit.body }),
      );
    }
    const isSchemas = /\/schemas/.test(url);
    return r.fulfill(
      json(200, {
        success: true,
        data: {
          data: isSchemas ? [site] : [],
          meta: { pagination: pagination(isSchemas ? 1 : 0) },
        },
      }),
    );
  });
}

export async function mockUnauthenticatedApi(page: Page) {
  await page.route('**/api/v1/telemetry/**', (r) => r.fulfill({ status: 204 }));
  await page.route('**/api/v1/auth/me', (r) =>
    r.fulfill(json(401, { success: false, message: 'Unauthorized' })),
  );
}
