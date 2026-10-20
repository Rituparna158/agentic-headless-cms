import { config as reactInternal } from '@repo/eslint-config/react-internal';
import boundaries from 'eslint-plugin-boundaries';

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
              ],
            },
            // Features can import shared, components, internal modules of their own feature, and auth for identity
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
              ],
            },
            // Shared code must remain strictly decoupled from features, pages, and layout
            {
              from: { element: { type: 'shared' } },
              allow: [{ to: { element: { type: 'shared' } } }],
            },
          ],
        },
      ],
    },
  },
];
