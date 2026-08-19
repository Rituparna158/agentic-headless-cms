import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';
test('admin can generate an API token, see the raw value once, and revoke it', async ({
  page,
}) => {
  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
  const tokenName = `E2E Token ${crypto.randomUUID()}`;
  await page.goto('/roles-access');
  await page.getByRole('button', { name: 'API Tokens', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Token' }).click();
  await page.getByPlaceholder('e.g. CI/CD Script').fill(tokenName);
  await page.getByRole('button', { name: 'Select a role...' }).click();
  await page
    .getByRole('menuitem', { name: 'admin', exact: true })
    .evaluate((node) => (node as HTMLElement).click());
  await page.getByPlaceholder('6-digit authenticator code').fill('000000');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.getByText('Token generated successfully')).toBeVisible({
    timeout: 15_000,
  });
  const rawToken = await page.locator('input:disabled').inputValue();
  expect(rawToken.length).toBeGreaterThan(10);
  await page.getByRole('button', { name: 'Done' }).click();
  const tokenRow = page.getByRole('row', { name: tokenName });
  await expect(tokenRow.getByText('Active')).toBeVisible();
  await tokenRow.getByRole('button', { name: 'Revoke Token' }).click();
  await page.getByPlaceholder('6-digit authenticator code').fill('000000');
  await page.getByRole('button', { name: 'Revoke', exact: true }).click();
  await expect(tokenRow.getByText('Revoked')).toBeVisible();
  await expect(
    tokenRow.getByRole('button', { name: 'Revoke Token' }),
  ).not.toBeVisible();
});
