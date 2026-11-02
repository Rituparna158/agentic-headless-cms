import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  ArrowRightIcon,
  GitHubIcon,
} from './icons';
import styles from './hero.module.css';

export function CmsUiHeroSection({ screenshotUrl }: { screenshotUrl?: string }) {
  const defaultScreenshot = useBaseUrl('/img/cms-ui/page-builder.png');
  const heroImage = screenshotUrl || defaultScreenshot;

  return (
    <section className={styles.hero} aria-label="CMS UI Hero">
      <div className={styles.glowTop} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />

      <div className={styles.container}>
        {/* Announcement Badge */}
        

        {/* Centered Editorial Headline */}
        <h1 className={styles.headline}>
          <span className={styles.headlineMain}>Build pages visually </span>
          <span className={styles.headlineSub}>Deliver content instantly </span>
        </h1>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          An open-source visual studio that connects directly to your headless backend with
          live previews, dynamic schema tokens, and tamper-evident audit logs.
        </p>

        {/* CTAs */}
        <div className={styles.buttons}>
          <Link
            to="/cms-ui/docs/getting-started/introduction"
            id="cms-ui-explore-docs-btn"
            className={styles.btnPrimary}
          >
            Explore Studio Docs <ArrowRightIcon size={15} />
          </Link>
          <Link
            to="https://github.com/mindfiredigital/agentic-headless-cms"
            id="cms-ui-github-btn"
            className={styles.btnSecondary}
          >
            <GitHubIcon size={16} /> View on GitHub
          </Link>
        </div>

        {/* Expansive Header Image Window (Increased Width to 1380px) */}
        <div className={styles.heroWindowWrap}>
          <div className={styles.windowFrame}>
            <div className={styles.windowTitlebar}>
              <div className={styles.windowDots}>
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotGreen} />
              </div>
              <span className={styles.windowTitle}>
                studio.local:3003 — Visual Page Builder Canvas
              </span>
              <span className={styles.windowBadge}>● Live Connected</span>
            </div>

            <img
              src={heroImage}
              alt="Agentic CMS UI Visual Canvas Editor"
              className={styles.windowScreenshot}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
