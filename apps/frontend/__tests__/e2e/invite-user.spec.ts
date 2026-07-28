import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can invite a user, and the invited user can accept and log in', async ({
  page,
  browser,
}) => {
  const email = `invitee-${crypto.randomUUID()}@example.com`;
  const password = 'a-strong-password-123';

  await page.goto('/roles-access');
  await page.getByRole('tab', { name: 'Users' }).click();
  await page.getByRole('button', { name: '+ Invite User' }).click();

  await page.locator('#email').fill(email);
  await page.locator('#firstName').fill('Test');
  await page.locator('#lastName').fill('Invitee');
  await page.locator('#role').click();
  await page.getByRole('option').first().click();

  const [inviteResponse] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/access/users/invite') &&
        res.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Send Invite', exact: true }).click(),
  ]);

  const { inviteUrl } = (await inviteResponse.json()) as {
    inviteUrl?: string;
  };
  expect(inviteUrl).toBeTruthy();

  const token = new URL(inviteUrl!).searchParams.get('token');
  expect(token).toBeTruthy();

  const inviteeContext = await browser.newContext();
  const inviteePage = await inviteeContext.newPage();

  await inviteePage.goto(`/accept-invite?token=${token}`);
  await inviteePage.locator('#password').fill(password);
  await inviteePage.locator('#confirmPassword').fill(password);
  await inviteePage
    .getByRole('button', { name: 'Activate Account', exact: true })
    .click();
  await expect(inviteePage).toHaveURL('/login');

  await inviteePage.getByLabel('Email').fill(email);
  await inviteePage.getByLabel('Password').fill(password);
  await inviteePage
    .getByRole('button', { name: 'Sign in', exact: true })
    .click();

  await expect(
    inviteePage.getByRole('heading', { name: 'Dashboard' }),
  ).toBeVisible();

  await inviteeContext.close();
});
