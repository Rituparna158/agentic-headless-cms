import { test, expect } from '@playwright/test';

test('authenticated user can view the dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: '+ New Entry' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Recent Activity' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Platform Modules' }),
  ).toBeVisible();
});
