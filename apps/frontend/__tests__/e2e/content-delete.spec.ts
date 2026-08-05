import crypto from 'node:crypto';
import { API_PATHS } from '@/lib/constants/api-paths';
import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './constants';

test('content entries can be deleted from the list and from the edit view — neither asks for confirmation', async ({
  page,
}) => {
  const slug = `e2e-delete-${crypto.randomUUID()}`;

  const schemaRes = await page.request.post(
    `${BACKEND_URL}${API_PATHS.SCHEMAS.BASE}`,
    {
      data: {
        name: `E2E Delete ${slug}`,
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
    },
  );
  expect(schemaRes.ok()).toBeTruthy();

  for (const title of ['Delete From List', 'Delete From Edit View']) {
    const res = await page.request.post(
      `${BACKEND_URL}${API_PATHS.CONTENT.BASE(slug)}`,
      { data: { title } },
    );
    expect(res.ok()).toBeTruthy();
  }

  await page.goto(`/content/${slug}`);

  // List-row delete: no ConfirmDialog, just refetches the list in place.
  const listRow = page.getByRole('row', { name: 'Delete From List' });
  await expect(listRow).toBeVisible();
  await listRow.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(listRow).not.toBeVisible();
  await expect(
    page.getByRole('row', { name: 'Delete From Edit View' }),
  ).toBeVisible();

  // Edit-view delete: no ConfirmDialog either, but it redirects back to the
  // entry list afterward instead of refetching in place.
  await page
    .getByRole('row', { name: 'Delete From Edit View' })
    .getByRole('link', { name: 'Edit' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Delete', exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/content/${slug}$`));
  await expect(
    page.getByRole('row', { name: 'Delete From Edit View' }),
  ).not.toBeVisible();
});
