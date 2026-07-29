import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './constants';

test('version history lists prior versions and can restore one', async ({
  page,
}) => {
  const slug = `e2e-versions-${crypto.randomUUID()}`;

  const schemaRes = await page.request.post(`${BACKEND_URL}/api/v1/schemas`, {
    data: {
      name: `E2E Versions ${slug}`,
      slug,
      type: 'collection',
      fields: [
        {
          apiId: 'title',
          displayName: 'Title',
          dataType: 'text',
          isRequired: true,
          isUnique: false,
          isLocalized: false,
          isRepeatable: false,
          sortOrder: 0,
        },
      ],
    },
  });
  expect(schemaRes.ok()).toBeTruthy();

  await page.goto(`/content/${slug}/new`);
  await page.getByLabel('Title *').fill('Version One');
  await page.getByRole('button', { name: 'Save Draft', exact: true }).click();

  const viewHistoryButton = page.getByRole('button', { name: 'View history' });

  await expect(viewHistoryButton).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(new RegExp(`/content/${slug}/(?!new$)[^/]+$`));

  await page.getByLabel('Title *').fill('Version Two');
  await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
  await expect(page.getByLabel('Title *')).toHaveValue('Version Two');

  await viewHistoryButton.click();
  await expect(
    page.getByRole('heading', { name: 'Version History' }),
  ).toBeVisible();
  await expect(page.getByText('v2', { exact: true })).toBeVisible();
  await expect(page.getByText('v1', { exact: true })).toBeVisible();

  await page.getByText('v1', { exact: true }).click();
  await page.getByRole('button', { name: 'Restore v1' }).click();

  await page.reload();
  await expect(page.getByLabel('Title *')).toHaveValue('Version One');
});
