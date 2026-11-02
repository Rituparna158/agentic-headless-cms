import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  LayoutIcon,
  ImageIcon,
  UsersIcon,
  ClockIcon,
  LayersIcon,
  ArrowRightIcon,
} from './icons';
import styles from './interactivePreview.module.css';

type ModuleKey =
  | 'canvas'
  | 'tokens'
  | 'rollback'
  | 'audit'
  | 'media';

interface TourModule {
  key: ModuleKey;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  url: string;
  screenshot: string;
  detailTitle: string;
  detailDesc: string;
  docsUrl: string;
}

// Interactive showcase with aspect-ratio locked preview and deep links to guides
export function InteractivePreview() {
  const [activeKey, setActiveKey] = useState<ModuleKey>('canvas');

  const modules: TourModule[] = [
    {
      key: 'canvas',
      label: 'Visual Page Builder',
      tagline: 'Drag-and-drop GrapesJS layout blocks & style inspector',
      icon: <LayoutIcon size={16} />,
      url: 'studio.local:3003/posts/index-page/canvas',
      screenshot: useBaseUrl('/img/cms-ui/page-builder.png'),
      detailTitle: 'GrapesJS Drag-and-Drop Canvas',
      detailDesc: 'Compose custom forms, buttons, heroes, and grids with direct canvas styling and responsive breakpoint controls.',
      docsUrl: '/cms-ui/docs/guides/page-builder',
    },
    {
      key: 'tokens',
      label: 'Dynamic Tokens & Schemas',
      tagline: 'Click-to-bind {{title}}, {{author}}, and repeated slots',
      icon: <LayersIcon size={16} />,
      url: 'studio.local:3003/posts/schemas/tokens',
      screenshot: useBaseUrl('/img/cms-ui/dynamic-tokens.png'),
      detailTitle: 'Schema Token Ingestion',
      detailDesc: 'Inject dynamic tokens into repeating components that automatically hydrate live data from your headless backend.',
      docsUrl: '/cms-ui/docs/guides/collections-and-schemas',
    },
    {
      key: 'rollback',
      label: 'Version History & Rollback',
      tagline: 'Automated database snapshots with 1-click restore',
      icon: <ClockIcon size={16} />,
      url: 'studio.local:3003/collections/version-history',
      screenshot: useBaseUrl('/img/cms-ui/version-history.png'),
      detailTitle: 'Point-in-Time Revision Control',
      detailDesc: 'Review historical versions (v22, v21), inspect exact payload deltas, and restore snapshots with zero downtime.',
      docsUrl: '/cms-ui/docs/guides/version-history',
    },
    {
      key: 'audit',
      label: 'Audit Trail & Governance',
      tagline: '194+ recorded system events, user actors & payload diffs',
      icon: <UsersIcon size={16} />,
      url: 'studio.local:3003/audit-logs',
      screenshot: useBaseUrl('/img/cms-ui/audit-logs.png'),
      detailTitle: 'Tamper-Evident Audit Stream',
      detailDesc: 'Filter actions by actor, target resource, and date range with one-click JSON compliance export.',
      docsUrl: '/cms-ui/docs/guides/audit-logs',
    },
    {
      key: 'media',
      label: 'Centralized Media Library',
      tagline: 'Folder organization, image metadata & instant slot drag',
      icon: <ImageIcon size={16} />,
      url: 'studio.local:3003/media/all-assets',
      screenshot: useBaseUrl('/img/cms-ui/media-library.png'),
      detailTitle: 'Multi-Format Asset Storage',
      detailDesc: 'Manage high-resolution banners, photos, and icons with folder categorization and infinite scrolling.',
      docsUrl: '/cms-ui/docs/guides/media-library',
    },
  ];

  const currentModule = modules.find((m) => m.key === activeKey) || modules[0];

  return (
    <section className={styles.section} aria-label="Interactive Studio Tour">
      <div className={styles.inner}>
        {/* Section Header */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span>Interactive Studio Tour</span>
          </div>
          <h2 className={styles.title}>
            Inside the <span className={styles.gradientWord}>Admin Studio</span>
          </h2>
          <p className={styles.subtitle}>
            Select a module from the tour menu to inspect the actual interface in action.
          </p>
        </div>

        {/* Split Tour Layout */}
        <div className={styles.tourLayout}>
          {/* Left Navigation Menu */}
          <div className={styles.menuCol} role="tablist">
            {modules.map((m) => {
              const isActive = activeKey === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveKey(m.key)}
                  className={`${styles.navCard} ${isActive ? styles.navCardActive : ''}`}
                >
                  <div className={styles.navIconBox}>{m.icon}</div>
                  <div className={styles.navText}>
                    <div className={styles.navTitle}>{m.label}</div>
                    <div className={styles.navDesc}>{m.tagline}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Showcase Window */}
          <div className={styles.previewCol}>
            <div className={styles.window}>
              <div className={styles.windowBar}>
                <div className={styles.dots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <div className={styles.urlBar}>
                  <span>https://{currentModule.url}</span>
                </div>
                
              </div>

              <div className={styles.screenArea}>
                <img
                  src={currentModule.screenshot}
                  alt={`${currentModule.label} Screen Preview`}
                  className={styles.screenshotImg}
                />
              </div>
            </div>

            {/* Info Box Below Window */}
            <div className={styles.infoBox}>
              <div className={styles.infoText}>
                <div className={styles.infoTitle}>{currentModule.detailTitle}</div>
                <p className={styles.infoDesc}>{currentModule.detailDesc}</p>
              </div>
              <Link to={currentModule.docsUrl} className={styles.docsLink}>
                <span>Documentation</span>
                <span className={styles.docsArrow}>
                  <ArrowRightIcon size={14} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
