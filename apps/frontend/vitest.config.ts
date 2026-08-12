import react from '@vitejs/plugin-react';
import { mergeConfig, defineConfig } from 'vitest/config';
import { createRequire } from 'module';
import rootConfig from '../../vitest.config';

const require = createRequire(import.meta.url);

export default mergeConfig(
  rootConfig,
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        react$: require.resolve('react'),
        'react/jsx-runtime$': require.resolve('react/jsx-runtime'),
        'react/jsx-dev-runtime$': require.resolve('react/jsx-dev-runtime'),
        'react-dom$': require.resolve('react-dom'),
      },
      tsconfigPaths: true,
    },
    test: {
      environment: 'jsdom',
      globals: false,
      testTimeout: 15000,
      include: ['__tests__/unit/**/*.test.{ts,tsx}'],
      setupFiles: ['./vitest.setup.tsx'],
      fileParallelism: false,
      server: {
        deps: {
          inline: ['@repo/shared-ui'],
        },
      },
    },
  }),
);
