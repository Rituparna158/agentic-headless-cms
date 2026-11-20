import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAuthenticatedApi } from './helpers';

const SECTIONS: Array<{ name: string; path: string; heading: RegExp }> = [
  { name: 'Websites', path: '/sites', heading: /All Websites/ },
  { name: 'Roles & access', path: '/users/roles', heading: /Roles & Access/ },
  {
    name: 'MFA requests',
    path: '/users/mfa-requests',
    heading: /MFA Reset Requests/,
  },
  { name: 'Security', path: '/security', heading: /Security/ },
  { name: 'Audit log', path: '/audit-logs', heading: /Audit Logs/ },
  { name: 'Central media', path: '/media', heading: /Central Media Bank/ },
  {
    name: 'Site posts',
    path: '/sites/acme/posts',
    heading: /Publishing Studio/,
  },
  {
    name: 'Site pages',
    path: '/sites/acme/pages',
    heading: /Pages & Site Hierarchy/,
  },
  {
    name: 'Site media',
    path: '/sites/acme/media',
    heading: /Central Media Bank/,
  },
  {
    name: 'Site menus',
    path: '/sites/acme/menus',
    heading: /Navigation Menus/,
  },
  { name: 'Site inbox', path: '/sites/acme/inbox', heading: /Inbox/ },
  {
    name: 'Site settings',
    path: '/sites/acme/settings',
    heading: /Site Settings/,
  },
  {
    name: 'Developer schemas',
    path: '/sites/acme/developer/schemas',
    heading: /Schema Model Builder/,
  },
];

test.describe('Dashboard sections', () => {
  test.beforeEach(({ page }) => mockAuthenticatedApi(page));

  for (const s of SECTIONS) {
    test(`${s.name} renders without errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));
      await page.goto(s.path);
      await expect(
        page.getByRole('heading', { name: s.heading }).first(),
      ).toBeVisible();
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      expect(pageErrors).toEqual([]);
      await expect(page).toHaveURL(new RegExp(`${s.path}$`));
    });
  }

  test('users page loads', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.locator('main#main-content')).toBeVisible();
  });
});

test.describe('Site workspace navigation', () => {
  test.beforeEach(({ page }) => mockAuthenticatedApi(page));

  test('opening a website lands in its workspace', async ({ page }) => {
    await page.goto('/sites');
    await expect(
      page.getByRole('heading', { name: /All Websites/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Grid View' }).click();
    await page.getByRole('group', { name: 'Open Acme' }).click();
    await expect(page).toHaveURL(/\/sites\/acme(\/|$)/);
  });

  test('a website can be opened from the keyboard', async ({ page }) => {
    await page.goto('/sites');
    await page.getByRole('button', { name: 'Grid View' }).click();
    const card = page.getByRole('group', { name: 'Open Acme' });
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/sites\/acme(\/|$)/);
  });

  test('workspace sidebar moves between sections', async ({ page }) => {
    await page.goto('/sites/acme/posts');
    await page.getByRole('link', { name: /Menus/i }).first().click();
    await expect(page).toHaveURL(/\/sites\/acme\/menus/);
    await page
      .getByRole('link', { name: /Settings/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/sites\/acme\/settings/);
  });
});

test.describe('Section accessibility (axe, WCAG 2.1 AA)', () => {
  test.beforeEach(({ page }) => mockAuthenticatedApi(page));

  for (const s of SECTIONS) {
    test(`${s.name} has no serious or critical violations`, async ({
      page,
    }) => {
      await page.goto(s.path);
      await expect(
        page.getByRole('heading', { name: s.heading }).first(),
      ).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          target: v.nodes[0]?.target,
        }));
      expect(blocking).toEqual([]);
    });
  }
});
