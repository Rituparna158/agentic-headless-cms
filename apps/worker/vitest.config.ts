import { mergeConfig, defineConfig } from 'vitest/config';
import rootConfig from '../../vitest.config';

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      include: ['__tests__/**/*.test.ts'],
      globals: false,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'super_secret_jwt_key_that_is_at_least_32_chars_long',
      },
    },
  }),
);

