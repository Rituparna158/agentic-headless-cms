import crypto from 'node:crypto';
import { API_PATHS } from '@/lib/constants/api-paths';
import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './constants';

test('admin can create a role with a content-type permission', async ({
  page,
}) => {
  const id = crypto.randomUUID();
  const schemaSlug = `e2e-roles-${id}`;
  const schemaName = `E2E Roles ${id}`;
  const roleName = `E2E Role ${id}`;

  const schemaRes = await page.request.post(
    `${BACKEND_URL}${API_PATHS.SCHEMAS.BASE}`,
    {
      data: {
        name: schemaName,
        slug: schemaSlug,
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
    },
  );
  expect(schemaRes.ok()).toBeTruthy();

  await page.goto('/roles-access');
  await page.getByRole('button', { name: 'Roles', exact: true }).click();

  await page.getByRole('button', { name: '+ Create New Role' }).click();

  await page.getByPlaceholder('e.g. Content Editor').fill(roleName);

  const schemaRow = page.getByRole('row', { name: schemaName });
  await schemaRow
    .locator('input[type="checkbox"]')
    .nth(0)
    .check({ force: true });

  await page.getByRole('button', { name: 'Save Role', exact: true }).click();

  await expect(page.getByRole('button', { name: roleName })).toBeVisible({
    timeout: 15_000,
  });
});
