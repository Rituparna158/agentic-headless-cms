import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config';
import rootConfig from '../../vitest.config';

const resolvedViteConfig =
  typeof viteConfig === 'function'
    ? (
        viteConfig as unknown as (env: {
          mode: string;
          command: string;
        }) => Record<string, unknown>
      )({
        mode: 'test',
        command: 'serve',
      })
    : viteConfig;

export default mergeConfig(
  resolvedViteConfig,
  mergeConfig(
    rootConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts',
        css: true,
        include: ['__tests__/unit/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', '**/e2e/**'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          // Unit-tested layers: every non-UI module (APIs, stores, hooks,
          // utils, storage, constants, editor plugins) plus the guards and
          // simple pages. Page/component UI is covered by Playwright e2e.
          include: [
            'src/**/*.ts',
            'src/components/Guard/**',
            'src/components/ui/**',
            'src/components/modals/**',
            'src/pages/GeneralError/**',
            'src/pages/NotFound/**',
            'src/pages/RequestAccess/**',
            'src/pages/MfaResetComplete/**',
          ],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.d.ts',
            'src/test/**',
            'src/utils/axeDev.ts',
            'src/**/types/**',
            'src/**/*.types.ts',
            'src/types/**',
            'src/**/index.ts',
            'src/vite-env.d.ts',
            // UI (tsx) is exercised by component tests + Playwright e2e, so
            // it is outside the unit-coverage gate except the dirs included above.
            'src/*.tsx',
            'src/components/*.tsx',
            'src/components/Layout/**',
            'src/components/PageSideDrawer/**/*.tsx',
            'src/components/Sidebar/**/*.tsx',
            'src/features/**/*.tsx',
            'src/pages/AcceptInvite/**',
            'src/pages/AccessDenied/**',
            'src/pages/Dashboard/**',
            'src/pages/ForgotPassword/**',
            'src/pages/Login/**',
            'src/pages/ResetPassword/**',
            'src/pages/Security/**/*.tsx',
            'src/features/collections/utils/slugify.util.ts',
            'src/components/Guard/types.ts',
            '**/*.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
          ],
          thresholds: {
            lines: 80,
            statements: 80,
            functions: 80,
            branches: 70,
          },
        },
      },
    }),
  ),
);
