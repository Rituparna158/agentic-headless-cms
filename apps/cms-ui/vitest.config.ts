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
          include: [
            'src/api/**',
            'src/utils/**',
            'src/hooks/**',
            'src/features/auth/store/**',
            'src/features/collections/utils/**',
            'src/features/collections/constants/**',
            'src/features/posts/utils/**',
            'src/features/posts/constants/**',
            'src/features/audit/utils/**',
            'src/features/audit/constants/**',
            'src/features/access/constants/**',
            'src/components/Guard/**',
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
