import React from 'react';
import Link from '@docusaurus/Link';
import { ArrowRightIcon, GitHubIcon } from './icons';

export function CTASection() {
  return (
    <section
      style={{
        width: '100%',
        paddingTop: '3.5rem',
        paddingBottom: '3.5rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '920px',
          padding: '3rem 2rem',
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.04) 0%, rgba(20, 20, 20, 0.4) 100%)',
          border: '1px solid rgba(255, 0, 0, 0.2)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '0.75rem',
              color: 'var(--foreground)',
            }}
          >
            Ready to Build with <span style={{ color: '#ff0000' }}>Agentic CMS</span>?
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--muted-foreground)',
              maxWidth: '600px',
              margin: '0 auto 1.75rem auto',
              lineHeight: 1.55,
            }}
          >
            Deploy in minutes with Docker, design custom content models, and deliver content across web and mobile with type-safe SDKs.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
            }}
          >
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
              Get Started with Installation <ArrowRightIcon size={14} />
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
    </section>
  );
}
