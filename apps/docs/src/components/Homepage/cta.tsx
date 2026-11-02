import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles/cta.module.css';
import { ScrollReveal } from './scroll-reveal';
import { ArrowRightIcon, GitHubIcon } from './icons';

export function CTASection() {
  return (
    <section className={styles.section}>
      <ScrollReveal delay={80} style={{ width: '100%', maxWidth: '920px' }}>
        <div className={styles.ctaCard}>
          <div className={styles.innerContent}>
            <h2 className={styles.title}>
              Ready to Build with <span className={styles.titleHighlight}>Agentic CMS</span>?
            </h2>

            <p className={styles.description}>
              Deploy in minutes with Docker, design custom content models, and deliver content across web and mobile with type-safe SDKs.
            </p>

            <div className={styles.buttons}>
              <Link
                to="/docs/getting-started/installation"
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                Get Started <ArrowRightIcon size={14} />
              </Link>

              <Link
                to="https://github.com/mindfiredigital/agentic-headless-cms"
                className="btn-secondary"
                style={{
                  padding: '10px 24px',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <GitHubIcon size={16} /> Star on GitHub
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
