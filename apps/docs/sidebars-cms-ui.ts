import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebarsCmsUi: SidebarsConfig = {
  cmsUiSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/installation',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/page-builder',
        'guides/collections-and-schemas',
        'guides/media-library',
        'guides/version-history',
        'guides/audit-logs',
        'guides/access-control',
      ],
    },
  ],
};

export default sidebarsCmsUi;
