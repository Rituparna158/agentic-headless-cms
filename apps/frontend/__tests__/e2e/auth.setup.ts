import { test as setup, expect } from '@playwright/test';

const authFile = './__tests__/e2e/.auth/admin.json';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@agentic-cms.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
