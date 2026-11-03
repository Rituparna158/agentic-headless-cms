import { test, expect } from '@playwright/test';

// default storageState is an already logged in admin
test.use({ storageState: { cookies: [], origins: [] } });

test('shows an error for invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('wrong@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
});
