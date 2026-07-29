import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can create a schema with two fields and reorder them via drag-and-drop', async ({
  page,
}) => {
  const id = crypto.randomUUID();
  const slug = `e2e-article-${id}`;

  await page.goto('/content-types/new');

  await page.getByLabel('Name', { exact: true }).fill(`E2E Article ${id}`);
  await page.getByLabel('Slug', { exact: true }).fill(slug);

  await page.getByLabel('Display name').fill('Alpha Field');
  await page.getByLabel('API ID').fill('alpha_field');

  await page.getByRole('button', { name: 'Add field' }).click();
  await page.getByLabel('Display name').fill('Beta Field');
  await page.getByLabel('API ID').fill('beta_field');

  const rowNames = page.locator(
    '[data-slot="field-list-item"] span.font-medium',
  );
  await expect(rowNames).toHaveText(['Alpha Field', 'Beta Field']);

  const firstHandle = page.getByRole('button', { name: 'Reorder field 1' });
  const secondHandle = page.getByRole('button', { name: 'Reorder field 2' });
  const firstBox = await firstHandle.boundingBox();
  const secondBox = await secondHandle.boundingBox();
  if (!firstBox || !secondBox) {
    throw new Error('Could not measure drag handles');
  }

  await page.mouse.move(
    firstBox.x + firstBox.width / 2,
    firstBox.y + firstBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    secondBox.x + secondBox.width / 2,
    secondBox.y + secondBox.height / 2 + secondBox.height,
    { steps: 10 },
  );
  await page.mouse.up();

  await expect(rowNames).toHaveText(['Beta Field', 'Alpha Field']);

  await page
    .getByRole('button', { name: 'Create schema', exact: true })
    .click();

  await expect(page).toHaveURL(new RegExp(`/content-types\\?created=${slug}`), {
    timeout: 15_000,
  });
  await expect(
    page.getByRole('cell', { name: `E2E Article ${id}` }),
  ).toBeVisible();
});
