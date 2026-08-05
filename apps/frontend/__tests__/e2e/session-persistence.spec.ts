import { test, expect } from '@playwright/test';
test('authenticated session survives a full page reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // The session lives in an HttpOnly cookie, not client state - AuthHydrator
  // re-derives it via GET /api/v1/auth/me on every mount.
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
