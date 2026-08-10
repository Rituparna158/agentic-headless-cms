import { config as baseConfig } from '@repo/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "packages/shared-ui/**"
    ]
  }
];
