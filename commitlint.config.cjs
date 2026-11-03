/* eslint-env node */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'db',
        'revert',
        'build',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Applications & Core
        'backend',
        'frontend',
        'cms-ui',
        'cms-ui/page-builder',
        'worker',
        'core',
        'app',

        // Feature / Domain modules
        'auth',
        'access',
        'rbac',
        'audit',
        'cms',
        'content',
        'editor',
        'features',
        'guards',
        'hooks',
        'locales',
        'media',
        'pages',
        'pagination',
        'schema',
        'sidebar',
        'store',
        'webhooks',

        // APIs & Integration
        'api',
        'graphql',
        'swagger',

        // Shared packages & Libraries
        'packages',
        'shared-ui',
        'ui',
        'types',
        'shared-types',
        'utils',
        'shared-db',
        'db',
        'validation',
        'constants',
        'logger',
        'middlewares',
        'middleware',
        'context',
        'events',
        'repository',
        'storage',
        'config',

        // SDKs
        'plugin-sdk',
        'sdk-codegen',
        'sdk-core',
        'sdk-nextjs',
        'nextjs-sdk',
        'sdk-node',
        'sdk-react',
        'sdk',

        // Configuration & Tooling
        'typescript-config',
        'eslint-config',
        'eslint',
        'env',
        'env-example',

        // Infrastructure, Database & DevOps
        'infra',
        'docker',
        'helm',
        'redis',
        'migration',

        // Testing & Quality
        'test',
        'tests',
        'unit',
        'e2e',
        'observability',

        // Repository & Maintenance
        'root',
        'repo',
        'release',
        'deps',
        'ci',
        'docs',
        'coderabbit',
        'all',
        'pnpm-lock',
      ],
    ],
    'subject-min-length': [2, 'always', 10],
  },
  ignores: [(commit) => /^feat:\s*Merge pull request/i.test(commit)],
};
