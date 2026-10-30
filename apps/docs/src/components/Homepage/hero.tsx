import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './index.module.css';
import {
  ArrowRightIcon,
  GitHubIcon,
  CopyIcon,
  CheckIcon,
  TerminalIcon,
  CodeIcon,
} from './icons';

export function HeroSection() {
  return (
    <section aria-label="Hero" className={styles.heroBanner}>
      <div className={styles.heroContent}>
        

        <h1
          className="hero-h1"
          style={{
            fontSize: 'clamp(2.25rem, 4.5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 auto 1.25rem auto',
            maxWidth: '920px',
          }}
        >
          Headless CMS Built for Content Teams &amp;{' '}
          <span className="gradient-anim emphasis">Modern Developers</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Visually design relational schemas, manage draft &amp; publish lifecycles, and deliver content with sub-millisecond Redis caching and type-safe client SDKs.
        </p>

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

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.75rem',
            marginTop: '2rem',
          }}
        >
          <div className={styles.codePill}>
            <TerminalIcon size={15} style={{ color: '#ff0000' }} />
            <span>git clone https://github.com/mindfiredigital/agentic-headless-cms.git</span>
            <CopyButton text="git clone https://github.com/mindfiredigital/agentic-headless-cms.git" />
          </div>

          
        </div>
      </div>
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={clsx(styles.copyBtn, copied && styles.copied)}
      aria-label={copied ? 'Copied' : 'Copy command'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
    </button>
  );
}
