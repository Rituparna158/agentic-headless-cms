import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles/hero.module.css';
import { Typewriter } from './typewriter';
import { ScrollReveal } from './scroll-reveal';
import { ArrowRightIcon, GitHubIcon } from './icons';

function ProductSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.9rem',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 0, 0, 0.35)',
          background: 'rgba(255, 0, 0, 0.07)',
          color: '#ff6b6b',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff0000', flexShrink: 0 }} />
        CMS Core
        <svg
          width={12}
          height={12}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '180px',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.75rem',
            padding: '0.4rem',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              color: '#ff6b6b',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(255, 0, 0, 0.08)',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff0000', flexShrink: 0 }} />
            CMS Core
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.7 }}>✓</span>
          </div>
          <Link
            to="/cms-ui"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.85rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#7c3aed',
                boxShadow: '0 0 5px #7c3aed',
                flexShrink: 0,
              }}
            />
            CMS UI (Admin Studio)
          </Link>
        </div>
      )}
    </div>
  );
}

export function HeroSection() {
  return (
    <section aria-label="Hero" className={styles.heroBanner}>
      <div className={styles.heroContent}>
        <ScrollReveal delay={60}>
          <ProductSwitcher />
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