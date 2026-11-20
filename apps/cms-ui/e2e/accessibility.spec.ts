import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function stubApi(page: Page, authenticated: boolean) {
  await page.route('**/api/v1/telemetry/**', (r) => r.fulfill({ status: 204 }));
  await page.route('**/api/v1/auth/me', (r) =>
    r.fulfill(
      authenticated
        ? {
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'u1',
                email: 'admin@agentic-cms.com',
                firstName: 'Admin',
                lastName: 'User',
                roles: ['admin'],
                mfaEnabled: false,
                permissions: [],
              },
            }),
          }
        : {
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, message: 'Unauthorized' }),
          },
    ),
  );
  await page.route('**/api/v1/**', (r) => {
    if (/\/auth\/|\/telemetry\//.test(r.request().url())) return r.fallback();
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 10, total: 0, pageCount: 0 },
          },
        },
      }),
    });
  });
}

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    target: v.nodes[0]?.target,
  }));
}

test.describe('Accessibility (axe, WCAG 2.1 AA)', () => {
  test.describe('public pages', () => {
    test.beforeEach(({ page }) => stubApi(page, false));

    for (const [name, path] of [
      ['login', '/login'],
      ['forgot password', '/forgot-password'],
      ['request access', '/request-access'],
      ['access denied', '/access-denied'],
    ] as const) {
      test(`${name} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        expect(await scan(page)).toEqual([]);
      });
    }

    test('login exposes a skip link that targets main content', async ({
      page,
    }) => {
      await page.goto('/login');
      await expect(page.getByText('Welcome back')).toBeVisible();
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skip).toBeFocused();
      await expect(skip).toBeVisible();
      await expect(page.locator('main#main-content')).toHaveCount(1);
    });

    test('document title follows the route', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle('Sign in · Agentic CMS');
      await page.goto('/forgot-password');
      await expect(page).toHaveTitle('Forgot password · Agentic CMS');
    });

    test('page declares a language', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });

  test.describe('authenticated pages', () => {
    test.beforeEach(({ page }) => stubApi(page, true));

    for (const [name, path] of [
      ['websites', '/sites'],
      ['404', '/definitely/not/a/route'],
    ] as const) {
      test(`${name} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        expect(await scan(page)).toEqual([]);
      });
    }

    test('skip link moves focus into main content', async ({ page }) => {
      await page.goto('/sites');
      await expect(page.locator('main#main-content')).toBeVisible();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await expect(page.locator('main#main-content')).toBeFocused();
    });
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await stubApi(page, false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/login');
    const duration = await page.evaluate(
      () => getComputedStyle(document.body).transitionDuration,
    );
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });
});
