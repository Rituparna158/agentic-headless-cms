import { test, expect } from '@playwright/test';

test.describe('Error and fallback pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/telemetry/**', (r) =>
      r.fulfill({ status: 204 }),
    );
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      }),
    );
  });

  test('unknown route renders the 404 page', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'u1',
            email: 'a@b.com',
            firstName: 'A',
            lastName: 'B',
            roles: ['admin'],
            mfaEnabled: false,
            permissions: [],
          },
        }),
      }),
    );
    await page.goto('/definitely/not/a/route');
    await expect(page.getByText('404')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Page Not Found' }),
    ).toBeVisible();
  });

  test('"Back to Dashboard" leaves the 404 page', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'u1',
            email: 'a@b.com',
            firstName: 'A',
            lastName: 'B',
            roles: ['admin'],
            mfaEnabled: false,
            permissions: [],
          },
        }),
      }),
    );
    await page.route('**/api/v1/**', (r) =>
      /\/auth\/|\/telemetry\//.test(r.request().url())
        ? r.fallback()
        : r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { data: [] } }),
          }),
    );
    await page.goto('/definitely/not/a/route');
    await page.getByRole('button', { name: /Back to Dashboard/ }).click();
    await expect(page).not.toHaveURL(/definitely/);
  });

  test('access-denied page shows a custom message', async ({ page }) => {
    await page.route('**/api/v1/auth/logout', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      }),
    );
    await page.goto('/access-denied?message=Not%20for%20you');
    await expect(page.getByText('Access Denied')).toBeVisible();
    await expect(page.getByText('Not for you')).toBeVisible();
    await page.getByRole('button', { name: 'Return to Login' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('access-denied page shows the default message', async ({ page }) => {
    await page.goto('/access-denied');
    await expect(
      page.getByText('You do not have permission to access this application.'),
    ).toBeVisible();
  });

  test('request-access page renders', async ({ page }) => {
    await page.goto('/request-access');
    await expect(page).toHaveURL(/request-access/);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
