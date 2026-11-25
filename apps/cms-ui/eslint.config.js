import { config as reactInternal } from '@repo/eslint-config/react-internal';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
    ],
  },
  ...reactInternal,
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    files: ['src/**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {},
  },
  {
    // Test doubles routinely need loose typing
    files: ['__tests__/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'boundaries/elements': [
        {
          type: 'feature',
          pattern: 'src/features/*',
          capture: ['featureName'],
        },
        {
          type: 'components',
          pattern: 'src/components/**',
        },
        {
          type: 'pages',
          pattern: 'src/pages/**',
        },
        {
          type: 'shared',
          pattern:
            'src/@(api|config|constants|hooks|store|tokens|types|utils)/**',
        },
      ],
      'boundaries/files': [
        {
          category: 'app',
          pattern: 'src/*.{ts,tsx}',
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // Root app entry points (main.tsx, App.tsx) can import features, pages, components, and shared
            {
              from: { file: { categories: 'app' } },
              allow: [
                { to: { element: { type: 'feature' } } },
                { to: { element: { type: 'pages' } } },
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'shared' } } },
                { to: { file: { categories: 'app' } } },
              ],
            },
            // Pages can import features, components, and shared
            {
              from: { element: { type: 'pages' } },
              allow: [
                { to: { element: { type: 'feature' } } },
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'pages' } } },
              ],
            },
            // Application shell components (Guards, Sidebar, Layout, PageSideDrawer)
            {
              from: { element: { type: 'components' } },
              allow: [
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'shared' } } },
                // Allow shell/guard components to access auth session and access control
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { featureName: 'auth' },
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { featureName: 'access' },
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { featureName: 'media' },
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { featureName: 'posts' },
                    },
                  },
                },
              ],
            },
            // Features can import shared, components, internal modules of their own feature, and auth/media for identity & central asset storage
            {
              from: { element: { type: 'feature' } },
              allow: [
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'components' } } },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { featureName: '{{from.featureName}}' },
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { featureName: 'auth' },
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { featureName: 'media' },
                    },
                  },
                },
              ],
            },
            // Content-domain and presentation features (pages, posts, blog, menus, theme, render)
            // are consumed by site-level features (inbox, settings, developer, render, ...)
            {
              from: { element: { type: 'feature' } },
              allow: [
                'collections',
                'posts',
                'blog',
                'menus',
                'site-content',
                'theme',
                'render',
              ].map((featureName) => ({
                to: {
                  element: { type: 'feature', captured: { featureName } },
                },
              })),
            },
            // Shared code must remain strictly decoupled from features, pages, and layout
            {
              from: { element: { type: 'shared' } },
              allow: [
                { to: { element: { type: 'shared' } } },
                // Cross-cutting access hooks (useCan, useSiteConfig) read the
                // signed-in user and the website list.
                ...['auth', 'posts'].map((featureName) => ({
                  to: {
                    element: { type: 'feature', captured: { featureName } },
                  },
                })),
              ],
            },
          ],
        },
      ],
    },
  },
];
