import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can register and delete a webhook', async ({ page }) => {
  const name = `E2E Webhook ${crypto.randomUUID()}`;

  await page.goto('/webhooks');

  await page.getByRole('button', { name: 'Register Webhook' }).click();
  await page.getByPlaceholder('e.g. Next.js ISR Rebuild').fill(name);
  await page
    .getByPlaceholder('https://example.com/api/revalidate')
    .fill('https://example.com/webhook-target');
  await page.getByRole('checkbox', { name: 'content.published' }).check();
  await page.getByRole('button', { name: 'Register', exact: true }).click();

  const row = page.getByRole('row', { name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText('content.published')).toBeVisible();
  await expect(row.getByText('Active', { exact: true })).toBeVisible();

  await row.getByRole('button', { name: 'Delete Webhook' }).click();
  await expect(
    page.getByRole('heading', { name: 'Delete webhook?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(row).not.toBeVisible();
});
