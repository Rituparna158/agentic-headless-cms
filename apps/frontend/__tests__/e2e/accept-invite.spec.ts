import { test, expect } from '@playwright/test';

const EXPIRED_INVITE_RAW_TOKEN = 'e2e-fixed-expired-invite-token';

test.use({ storageState: { cookies: [], origins: [] } });

test('shows an error for an invalid invite token', async ({ page }) => {
  await page.goto('/accept-invite?token=not-a-real-token');
  await page.locator('#password').fill('a-strong-password-123');
  await page.locator('#confirmPassword').fill('a-strong-password-123');
  await page
    .getByRole('button', { name: 'Activate Account', exact: true })
    .click();

  await expect(
    page.getByText('Invalid or expired invitation token'),
  ).toBeVisible();
});

test('shows an error for an expired invite token', async ({ page }) => {
  await page.goto(`/accept-invite?token=${EXPIRED_INVITE_RAW_TOKEN}`);
  await page.locator('#password').fill('a-strong-password-123');
  await page.locator('#confirmPassword').fill('a-strong-password-123');
  await page
    .getByRole('button', { name: 'Activate Account', exact: true })
    .click();

  await expect(
    page.getByText('Invalid or expired invitation token'),
  ).toBeVisible();
});
