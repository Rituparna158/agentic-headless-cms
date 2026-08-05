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
  await page.getByRole('tab', { name: 'Users' }).click();
  await page.getByRole('button', { name: '+ Invite User' }).click();
  await page.locator('#email').fill(email);
  await page.locator('#role').click();
  await page.getByRole('option', { name: roleName }).click();

  const [inviteResponse] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(API_PATHS.ACCESS.INVITE) &&
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

  /* Accept and log in as the new non-admin user in a fresh context - not
   the admin session used to create the role/invite above. Must pass an
   explicit blank storageState: browser.newContext() otherwise inherits
   the project's default (the admin's cookie), which would make proxy.ts's
   "already-authenticated visitors get redirected off /accept-invite" rule
   fire here too, since this context wouldn't actually be a fresh visitor.*/
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
  await expect(memberPage.getByRole('tab', { name: 'Users' })).toBeVisible();
  await expect(memberPage.getByRole('tab', { name: 'Roles' })).toHaveCount(0);
  await expect(memberPage.getByRole('tab', { name: 'API Tokens' })).toHaveCount(
    0,
  );
  await expect(
    memberPage.getByRole('button', { name: '+ Invite User' }),
  ).toHaveCount(0);

  /* Backend enforcement, not just UI hiding - content-editor components
   have no client-side permission gating at all, so a 403 here is the
   only real boundary for most of the app.*/
  const forbiddenRes = await memberPage.request.post(
    `${BACKEND_URL}${API_PATHS.ACCESS.ROLES}`,
    { data: { name: 'should-not-be-created', permissions: [] } },
  );
  expect(forbiddenRes.status()).toBe(403);
  /* requireAdmin responds directly with { error: "<string>" } rather than
  going through the centralized error handler's { error: { message } }
  shape used elsewhere in this app - two different error body shapes
  depending on which code path rejects the request.*/
  const body = await forbiddenRes.json();
  expect(body.error).toBe('Forbidden: Insufficient permissions');

  await memberContext.close();
});
