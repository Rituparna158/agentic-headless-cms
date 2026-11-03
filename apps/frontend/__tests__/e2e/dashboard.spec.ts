import { test, expect } from '@playwright/test';

test('authenticated user can view the dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Quick Actions')).toBeVisible();
});
