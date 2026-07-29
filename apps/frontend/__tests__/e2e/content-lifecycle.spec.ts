import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './constants';

async function createTitleOnlySchema(
  request: import('@playwright/test').APIRequestContext,
  slug: string,
) {
  const res = await request.post(`${BACKEND_URL}/api/v1/schemas`, {
    data: {
      name: `E2E Content ${slug}`,
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
  expect(res.ok()).toBeTruthy();
}

test('admin can create, save as draft, and publish a content entry', async ({
  page,
}) => {
  const slug = `e2e-content-${crypto.randomUUID()}`;
  await createTitleOnlySchema(page.request, slug);

  await page.goto(`/content/${slug}`);

  await page.getByRole('link', { name: 'New Entry' }).click();

  await page.getByLabel('Title *').fill('My First Entry');
  await page.getByRole('button', { name: 'Save Draft', exact: true }).click();

  const publishButton = page.getByRole('button', {
    name: 'Publish',
    exact: true,
  });

  await expect(publishButton).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(new RegExp(`/content/${slug}/(?!new$)[^/]+$`));

  await expect(page.getByText('draft', { exact: true })).toBeVisible();

  await publishButton.click();

  await expect(page.getByText('published', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Published', exact: true }),
  ).toBeDisabled();
});
