import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3001';
const BACKEND_HEALTH_URL = 'http://localhost:3000/health/live';

const monorepoRoot = '../..';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './__tests__/e2e/global-setup.ts',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './__tests__/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter backend dev',
      url: BACKEND_HEALTH_URL,
      reuseExistingServer: !process.env.CI,
      cwd: monorepoRoot,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter frontend dev',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      cwd: monorepoRoot,
      timeout: 60_000,
    },
  ],
});
