import crypto from 'node:crypto';
import { API_PATHS } from '@/lib/constants/api-paths';
import { test, expect } from '@playwright/test';

test('admin can invite a user, and the invited user can accept and log in', async ({
  page,
  browser,
}) => {
  const email = `invitee-${crypto.randomUUID()}@example.com`;
  const password = 'a-strong-password-123';

  await page.goto('/roles-access');
  await page.getByRole('button', { name: 'Users', exact: true }).click();
  await page.getByRole('button', { name: '+ Invite User' }).click();

  await page.locator('#email').fill(email);
  await page.locator('#firstName').fill('Test');
  await page.locator('#lastName').fill('Invitee');
  await page.getByRole('button', { name: 'Select a role' }).click();
  await page
    .getByRole('menuitem')
    .first()
    .evaluate((node) => node.click());

  const [inviteResponse] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(API_PATHS.ACCESS.INVITE) &&
        res.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Send Invite', exact: true }).click(),
  ]);

  const { data } = (await inviteResponse.json()) as {
    data?: { inviteUrl?: string };
  };
  const inviteUrl = data?.inviteUrl;
  expect(inviteUrl).toBeTruthy();

  const token = new URL(inviteUrl!).searchParams.get('token');
  expect(token).toBeTruthy();

  /* browser.newContext() inherits the project's default storageState (the
   admin's cookie) unless explicitly overridden - without this, proxy.ts's
   "already-authenticated visitors get redirected off /accept-invite" rule
   fires here too, since this context wouldn't actually be a fresh visitor.*/
  const inviteeContext = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
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
