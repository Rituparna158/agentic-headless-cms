import { nextJsConfig } from '@mindfiredigital/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    ignores: ['playwright-report/**', 'test-results/**', 'blob-report/**'],
  },
];
