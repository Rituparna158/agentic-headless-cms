import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can add and delete a locale', async ({ page }) => {
  const code = `xx-${crypto.randomUUID().slice(0, 4)}`;
  const name = `E2E Locale ${crypto.randomUUID()}`;

  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Locales' }).click();

  await page.getByRole('button', { name: 'Add Locale' }).click();
  await page.getByPlaceholder('e.g. fr-FR').fill(code);
  await page.getByPlaceholder('e.g. French').fill(name);
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  const row = page.getByRole('row', { name });
  await expect(row).toBeVisible({ timeout: 15_000 });

  await row.getByRole('button', { name: 'Delete Locale' }).click();
  await expect(
    page.getByRole('heading', { name: 'Delete locale?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(row).not.toBeVisible();
});
