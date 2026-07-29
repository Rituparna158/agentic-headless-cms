import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can generate an API token, see the raw value once, and revoke it', async ({
  page,
}) => {
  const tokenName = `E2E Token ${crypto.randomUUID()}`;

  await page.goto('/roles-access');
  await page.getByRole('tab', { name: 'API Tokens' }).click();

  await page.getByRole('button', { name: 'Generate Token' }).click();
  await page.getByPlaceholder('e.g. CI/CD Script').fill(tokenName);

  await page.locator('select').selectOption({ label: 'admin' });

  await page.getByRole('button', { name: 'Generate', exact: true }).click();

  await expect(page.getByText('Token generated successfully')).toBeVisible({
    timeout: 15_000,
  });
  const rawToken = await page.getByRole('textbox').inputValue();
  expect(rawToken.length).toBeGreaterThan(10);

  await page.getByRole('button', { name: 'Done' }).click();

  const tokenRow = page.getByRole('row', { name: tokenName });
  await expect(tokenRow.getByText('Active')).toBeVisible();

  await tokenRow.getByRole('button', { name: 'Revoke Token' }).click();

  await expect(tokenRow.getByText('Revoked')).toBeVisible();
  await expect(
    tokenRow.getByRole('button', { name: 'Revoke Token' }),
  ).not.toBeVisible();
});
