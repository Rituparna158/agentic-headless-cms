import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './constants';

test('admin can format rich text content and see it persist after reload', async ({
  page,
}) => {
  const slug = `e2e-richtext-${crypto.randomUUID()}`;

  const schemaRes = await page.request.post(`${BACKEND_URL}/api/v1/schemas`, {
    data: {
      name: `E2E Rich Text ${slug}`,
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
        {
          apiId: 'body',
          displayName: 'Body',
          dataType: 'richtext',
          isRequired: false,
          isUnique: false,
          isLocalized: false,
          isRepeatable: false,
          sortOrder: 1,
        },
      ],
    },
  });
  expect(schemaRes.ok()).toBeTruthy();

  await page.goto(`/content/${slug}`);
  await page.getByRole('link', { name: 'New Entry' }).click();

  await page.getByLabel('Title *').fill('Rich Text Entry');

  const editor = page.locator('[contenteditable="true"]');
  await editor.click();
  await page.keyboard.type('Hello world');
  await page.keyboard.press('Control+A');
  await page.getByRole('button', { name: 'Bold' }).click();

  await expect(
    editor.locator('strong', { hasText: 'Hello world' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/content/${slug}/(?!new$)[^/]+$`));

  await page.reload();

  const reloadedEditor = page.locator('[contenteditable="true"]');
  await expect(
    reloadedEditor.locator('strong', { hasText: 'Hello world' }),
  ).toBeVisible();
});
