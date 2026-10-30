import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Agentic Headless CMS',
  tagline: 'Enterprise-grade, API-first Headless CMS built for modern web architectures and autonomous AI agents.',
  favicon: 'img/logo.png',

  url: 'https://mindfiredigital.github.io',
  baseUrl: '/',

  organizationName: 'mindfiredigital',
  projectName: 'agentic-headless-cms',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Agentic CMS',
      logo: {
        alt: 'Agentic CMS Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/mindfiredigital/agentic-headless-cms',
          position: 'right',
          className: 'header--github-link',
        },
      ],
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'sql', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

