import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    testTimeout: 15000,
    include: ['__tests__/unit/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./vitest.setup.tsx'],
    fileParallelism: false,
    server: {
      deps: {
        inline: ['@repo/shared-ui'],
      },
    },
  },
});
