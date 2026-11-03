import { config as nodeConfig } from '@repo/eslint-config/node';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...nodeConfig,
  eslintPluginPrettierRecommended,
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
);
