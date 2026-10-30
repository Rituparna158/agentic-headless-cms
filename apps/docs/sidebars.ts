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
        'features/audit-logs',
        'features/webhooks',
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
