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
          include: ['src/**/*.ts', 'src/components/**', 'src/pages/**'],
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
            'src/*.tsx',
            'src/components/PageSideDrawer/**/*.tsx',
            'src/components/Sidebar/**/*.tsx',
            'src/features/**/*.tsx',
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
