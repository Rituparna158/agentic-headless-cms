import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
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
    exclude: ['node_modules', '.next'],
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        inline: ['@repo/shared-ui'],
      },
    },
  },
});
