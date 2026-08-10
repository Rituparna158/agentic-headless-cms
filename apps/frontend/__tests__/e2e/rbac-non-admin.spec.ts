import crypto from 'node:crypto';
import { API_PATHS } from '@/lib/constants/api-paths';
import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './constants';

test('a non-admin role cannot see or perform admin-only actions', async ({
  page,
  browser,
}) => {
  const id = crypto.randomUUID();
  const roleName = `E2E ReadOnly ${id}`;
  const email = `readonly-${id}@example.com`;
  const password = 'a-strong-password-123';

  // A role with no permissions granted at all - deliberately not "admin".
  const roleRes = await page.request.post(
    `${BACKEND_URL}${API_PATHS.ACCESS.ROLES}`,
    {
      data: { name: roleName, permissions: [] },
    },
  );
  expect(roleRes.ok()).toBeTruthy();

  await page.goto('/roles-access');
  await page.getByRole('button', { name: 'Users', exact: true }).click();
  await page.getByRole('button', { name: '+ Invite User' }).click();
  await page.locator('#email').fill(email);
  await page.getByRole('button', { name: 'Select a role' }).click();
  await page
    .getByRole('menuitem', { name: roleName })
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

  const memberContext = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const memberPage = await memberContext.newPage();

  await memberPage.goto(`/accept-invite?token=${token}`);
  await memberPage.locator('#password').fill(password);
  await memberPage.locator('#confirmPassword').fill(password);
  await memberPage
    .getByRole('button', { name: 'Activate Account', exact: true })
    .click();
  await expect(memberPage).toHaveURL('/login');

  await memberPage.getByLabel('Email').fill(email);
  await memberPage.getByLabel('Password').fill(password);
  await memberPage
    .getByRole('button', { name: 'Sign in', exact: true })
    .click();
  await expect(
    memberPage.getByRole('heading', { name: 'Dashboard' }),
  ).toBeVisible();

  /* Roles & Access page hides the Roles/API Tokens tabs and the invite
   button entirely for non-admins - not just disables them.*/
  await memberPage.goto('/roles-access');
  await expect(
    memberPage.getByRole('button', { name: 'Users', exact: true }),
  ).toBeVisible();
  await expect(
    memberPage.getByRole('button', { name: 'Roles', exact: true }),
  ).toHaveCount(0);
  await expect(
    memberPage.getByRole('button', { name: 'API Tokens', exact: true }),
  ).toHaveCount(0);
  await expect(
    memberPage.getByRole('button', { name: '+ Invite User' }),
  ).toHaveCount(0);

  const forbiddenRes = await memberPage.request.post(
    `${BACKEND_URL}${API_PATHS.ACCESS.ROLES}`,
    { data: { name: 'should-not-be-created', permissions: [] } },
  );
  expect(forbiddenRes.status()).toBe(403);

  const body = await forbiddenRes.json();
  expect(body.error?.message).toBe('Forbidden: Insufficient permissions');

  await memberContext.close();
});
