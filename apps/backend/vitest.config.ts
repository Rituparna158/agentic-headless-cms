import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: false,
    // env.ts validates and fails fast on import — tests that only exercise
    // routes not touching the database (e.g. /health/live) still import the
    // full app module graph, so a syntactically-valid placeholder is needed
    // even though nothing here connects to a real database.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
});
