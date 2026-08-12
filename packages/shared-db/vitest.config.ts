import { mergeConfig, defineConfig } from 'vitest/config';
import rootConfig from '../../vitest.config';

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      globals: true,
      include: ['tests/**/*.test.ts'],
    },
  }),
);
