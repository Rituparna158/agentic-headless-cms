import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test('admin can upload a file and delete it from the media library', async ({
  page,
}) => {
  const filename = `e2e-upload-${crypto.randomUUID()}.png`;

  await page.goto('/media');

  await page.getByLabel('Upload files').setInputFiles({
    name: filename,
    mimeType: 'image/png',
    buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
  });

  await expect(page.getByText(filename)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: `Delete ${filename}` }).click();
  await expect(
    page.getByRole('heading', { name: 'Delete this file?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page.getByText(filename)).toHaveCount(0);
});
