import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/admin-panel',
      ],
    },
    {
      type: 'category',
      label: 'Core Features',
      collapsed: true,
      items: [
        'features/schema-builder',
        'features/content-manager',
        'features/draft-and-publish',
        'features/media-library',
        'features/internationalization',
        'features/roles-and-permissions',
        'features/api-tokens',
        'features/audit-logs',
        'features/webhooks',
      ],
    },
    {
      type: 'category',
      label: 'Developer SDKs',
      collapsed: true,
      items: [
        'content-apis/sdks',
      ],
    },
    {
      type: 'category',
      label: 'Contribution Guide',
      collapsed: true,
      items: [
        'contribution-guide/how-to-contribute',
        'contribution-guide/code-of-conduct',
      ],
    },
  ],
};

export default sidebars;
