import { test, expect } from '@playwright/test';

const mockAdminUser = {
  id: 'admin-e2e-user',
  email: 'admin@agentic-cms.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  mfaEnabled: false,
  permissions: [],
};

const mockSchemaPages = {
  id: 'col-pages',
  name: 'Pages',
  slug: 'pages',
  description: 'Core web pages collection',
  type: 'collection',
  fields: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockPageEntry = {
  id: 'page-landing-1',
  schemaId: 'col-pages',
  status: 'draft',
  updatedBy: 'Admin User',
  data: {
    title: 'Home Landing Page',
    slug: 'home',
    _schemas: [],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test.describe('CMS-UI End-to-End Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Force grid view for consistent card layout
    await page.addInitScript(() => {
      window.localStorage.setItem('cms_entries_view_mode', 'grid');
    });

    // Intercept telemetry and web vitals
    await page.route('**/api/v1/telemetry/**', async (route) => {
      await route.fulfill({ status: 204 });
    });

    // Intercept audit logs
    await page.route('**/api/v1/audit-logs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            data: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 10,
                total: 0,
                pageCount: 0,
              },
            },
          },
        }),
      });
    });

    // Intercept login
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockAdminUser,
        }),
      });
    });

    // Intercept current user session (default: authenticated)
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockAdminUser,
        }),
      });
    });

    // Intercept schema endpoints (both single by slug and paginated list)
    await page.route('**/api/v1/schemas**', async (route) => {
      const url = route.request().url();
      if (url.includes('/schemas/slug/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockSchemaPages,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [mockSchemaPages],
              meta: {
                pagination: {
                  page: 1,
                  pageSize: 10,
                  total: 1,
                  pageCount: 1,
                },
              },
            },
          }),
        });
      }
    });

    // Intercept content pages API (list, update, publish)
    await page.route('**/api/v1/content/pages**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [mockPageEntry],
              meta: {
                pagination: {
                  page: 1,
                  pageSize: 10,
                  total: 1,
                  pageCount: 1,
                },
              },
            },
          }),
        });
      } else if (method === 'POST' && url.includes('/publish')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageEntry,
              status: 'published',
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      } else if (method === 'PUT' || method === 'PATCH') {
        const payload = route.request().postDataJSON() || {};
        const title =
          payload.title || payload.data?.title || 'Home Landing Page';
        const slug = payload.slug || payload.data?.slug || 'home';
        const isPublish =
          payload.status === 'published' || url.includes('publish');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageEntry,
              status: isPublish ? 'published' : 'draft',
              data: {
                ...mockPageEntry.data,
                ...payload.data,
                title,
                slug,
              },
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockPageEntry,
          }),
        });
      }
    });
  });

  test('verifies admin login flow with email and password', async ({
    page,
  }) => {
    let loggedIn = false;

    // For login flow test, start as unauthenticated so /login form remains mounted
    await page.route('**/api/v1/auth/me', async (route) => {
      if (!loggedIn) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Unauthorized',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockAdminUser,
          }),
        });
      }
    });

    await page.route('**/api/v1/auth/login', async (route) => {
      loggedIn = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockAdminUser,
        }),
      });
    });

    await page.goto('/login');

    // Verify presence of login form landmarks
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();

    // Fill credentials
    await page.fill('input#email', 'admin@agentic-cms.com');
    await page.fill('input#password', 'SecretPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Confirm redirection away from /login
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 10000,
    });
  });

  test('verifies opening PageSideDrawer, editing page meta, and saving draft', async ({
    page,
  }) => {
    // Navigate directly to the pages collection
    await page.goto('/collections/pages');

    // Wait for the page card to be displayed in the grid
    const pageCardTitle = page.locator('button:has-text("Home Landing Page")');
    await expect(pageCardTitle).toBeVisible({ timeout: 10000 });

    // Click to open PageSideDrawer
    await pageCardTitle.click();

    // Verify drawer dialog opened
    const drawerDialog = page.locator('div[role="dialog"]');
    await expect(drawerDialog).toBeVisible();

    // Verify and edit the Page Title input
    const titleInput = drawerDialog.locator('input[placeholder="Page Title"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue('Home Landing Page');

    // Update title
    await titleInput.fill('Updated Home Landing Page');

    // Click "Save Draft" button
    const saveDraftBtn = drawerDialog.locator('button:has-text("Save Draft")');
    await expect(saveDraftBtn).toBeVisible();
    await saveDraftBtn.click();

    // Confirm drawer remains intact with updated value
    await expect(titleInput).toHaveValue('Updated Home Landing Page');
  });

  test('verifies publishing page directly from PageSideDrawer', async ({
    page,
  }) => {
    await page.goto('/collections/pages');

    const pageCardTitle = page.locator('button:has-text("Home Landing Page")');
    await expect(pageCardTitle).toBeVisible({ timeout: 10000 });
    await pageCardTitle.click();

    const drawerDialog = page.locator('div[role="dialog"]');
    await expect(drawerDialog).toBeVisible();

    // Click "Publish Live" button
    const publishBtn = drawerDialog.locator('button:has-text("Publish Live")');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Verify publication status or indicator
    await expect(drawerDialog.getByText('Published Live')).toBeVisible();
  });
});
