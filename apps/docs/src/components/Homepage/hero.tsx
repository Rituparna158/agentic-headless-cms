import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles/hero.module.css';
import { Typewriter } from './typewriter';
import { ScrollReveal } from './scroll-reveal';
import { ArrowRightIcon, GitHubIcon } from './icons';

export function HeroSection() {
  return (
    <section aria-label="Hero" className={styles.heroBanner}>
      <div className={styles.heroContent}>
        <ScrollReveal delay={60}>
          <div className={styles.badge}>
            <span>Agentic Headless CMS</span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <h1
            className="hero-h1"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
              margin: '0 auto 1.25rem auto',
              maxWidth: '920px',
            }}
          >
            <span style={{ display: 'block' }}>Headless by Design.</span>
            <span style={{ display: 'block' }}>Agentic by</span>
            <span style={{ display: 'block' }}>
              <Typewriter
                className="gradient-anim emphasis"
                words={[
                  'Architecture.',
                  'Default.',
                  'Nature.',
                  'Intelligence.',
                ]}
              />
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <p className={styles.heroSubtitle}>
            Where content meets intelligence, and ideas become experiences.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={340}>
          <div className={styles.buttons}>
            <Link
              to="/docs/getting-started/introduction"
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
              <GitHubIcon size={16} /> GitHub
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
