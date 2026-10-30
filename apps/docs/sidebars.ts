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
      collapsed: false,
      items: [
        'features/schema-builder',
      ],
    },
    {
      type: 'category',
      label: 'Contribution Guide',
      collapsed: false,
      items: [
        'contribution-guide/how-to-contribute',
        'contribution-guide/code-of-conduct',
      ],
    },
  ],
};

export default sidebars;

