import React from 'react';
import Link from '@docusaurus/Link';
import { ArrowRightIcon } from './icons';
import styles from './cta.module.css';

export function CmsUiCTASection() {
  return (
    <section className={styles.section} aria-label="CMS UI CTA">
      {/* Border glow */}
      <div className={styles.glowBorder} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Background grid pattern */}
        <div className={styles.gridPattern} aria-hidden="true" />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div className={styles.badge}>Documentation</div>

          <h2 className={styles.heading}>
            Start with{' '}
            <span className={styles.gradientText}>CMS UI</span>
            {' '}Today
          </h2>

          <p className={styles.subtext}>
            Full documentation, quick-start guide, component reference, and API docs —
            everything you need to ship faster.
          </p>

          <div className={styles.buttons}>
            <Link
              to="/cms-ui/docs/getting-started/introduction"
              id="cms-ui-cta-docs-btn"
              className={styles.btnPrimary}
            >
              Open Documentation <ArrowRightIcon size={15} />
            </Link>
            <Link
              to="/"
              id="cms-ui-cta-core-btn"
              className={styles.btnGhost}
            >
              View CMS Core Docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
