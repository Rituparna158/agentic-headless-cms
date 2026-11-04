import { config as baseConfig } from '@mindfiredigital/eslint-config/base';

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
