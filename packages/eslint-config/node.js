import { config as baseConfig } from './base.js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * A custom ESLint configuration for Node.js backend applications.
 *
 * @type {import("eslint").Linter.Config[]} */
export const config = [
  ...baseConfig,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
    },
  },
];
