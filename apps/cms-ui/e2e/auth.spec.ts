import { test, expect, type Page } from '@playwright/test';

const adminUser = {
  id: 'admin-e2e-user',
  email: 'admin@agentic-cms.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  mfaEnabled: false,
  permissions: [],
};

const json = (status: number, body: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

async function stubCommon(page: Page) {
  await page.route('**/api/v1/telemetry/**', (r) => r.fulfill({ status: 204 }));
}

async function stubUnauthenticated(page: Page) {
  await stubCommon(page);
  await page.route('**/api/v1/auth/me', (r) =>
    r.fulfill(json(401, { success: false, message: 'Unauthorized' })),
  );
}

test.describe('Authentication', () => {
  test('redirects unauthenticated visitors to /login', async ({ page }) => {
    await stubUnauthenticated(page);
    await page.goto('/sites');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('shows validation errors for an empty login form', async ({ page }) => {
    await stubUnauthenticated(page);
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input#email')).toBeVisible();
  });

  test('stays on /login when credentials are rejected', async ({ page }) => {
    await stubUnauthenticated(page);
    await page.route('**/api/v1/auth/login', (r) =>
      r.fulfill(
        json(401, {
          success: false,
          error: { message: 'Invalid credentials' },
        }),
      ),
    );
    await page.goto('/login');
    await page.fill('input#email', 'admin@agentic-cms.com');
    await page.fill('input#password', 'WrongPassword1!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('logs in and leaves the login page', async ({ page }) => {
    let loggedIn = false;
    await stubCommon(page);
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill(
        loggedIn
          ? json(200, { success: true, data: adminUser })
          : json(401, { success: false, message: 'Unauthorized' }),
      ),
    );
    await page.route('**/api/v1/auth/login', (r) => {
      loggedIn = true;
      return r.fulfill(json(200, { success: true, data: adminUser }));
    });
    await page.route('**/api/v1/**', (r) => {
      if (/\/auth\/|\/telemetry\//.test(r.request().url())) return r.fallback();
      return r.fulfill(json(200, { success: true, data: { data: [] } }));
    });
    await page.goto('/login');
    await page.fill('input#email', 'admin@agentic-cms.com');
    await page.fill('input#password', 'SecretPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Forgot password', () => {
  test.beforeEach(async ({ page }) => stubUnauthenticated(page));

  test('requests a reset link and shows confirmation', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (r) =>
      r.fulfill(json(200, { success: true })),
    );
    await page.goto('/forgot-password');
    await expect(page.getByText('Forgot Password')).toBeVisible();
    await page.fill('input#email', 'user@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText(/Check your email/)).toBeVisible();
    await page.getByRole('link', { name: 'Return to sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows the server error when the request fails', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (r) =>
      r.fulfill(
        json(500, { success: false, error: { message: 'Mail unavailable' } }),
      ),
    );
    await page.goto('/forgot-password');
    await page.fill('input#email', 'user@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('Mail unavailable')).toBeVisible();
  });

  test('links back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByRole('link', { name: 'Back to login' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
