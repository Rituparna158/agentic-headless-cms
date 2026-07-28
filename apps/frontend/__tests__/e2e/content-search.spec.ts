import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3000';

test('content list search filters entries by title', async ({ page }) => {
  const slug = `e2e-search-${crypto.randomUUID()}`;

  const schemaRes = await page.request.post(`${BACKEND_URL}/api/v1/schemas`, {
    data: {
      name: `E2E Search ${slug}`,
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

  for (const title of ['Findable Apple Pie', 'Unrelated Banana Bread']) {
    const res = await page.request.post(
      `${BACKEND_URL}/api/v1/content/${slug}`,
      { data: { title } },
    );
    expect(res.ok()).toBeTruthy();
  }

  await page.goto(`/content/${slug}`);
  await expect(page.getByText('Findable Apple Pie')).toBeVisible();
  await expect(page.getByText('Unrelated Banana Bread')).toBeVisible();

  await page.getByPlaceholder('Search by Title…').fill('Apple');

  await expect(page.getByText('Findable Apple Pie')).toBeVisible();
  await expect(page.getByText('Unrelated Banana Bread')).not.toBeVisible();
});
