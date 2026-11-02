import React from 'react';
import Link from '@docusaurus/Link';

export default function CmsUiFooter() {
  return (
    <footer
      style={{
        position: 'relative',
        width: '100%',
        padding: '2.5rem 1.5rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--background)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: '1200px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          color: 'var(--muted-foreground)',
          fontSize: '0.88rem',
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>
          © {new Date().getFullYear()} Mindfire Digital LLP · Agentic CMS UI · MIT License
        </p>

        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
          <Link
            to="/cms-ui/docs/getting-started/introduction"
            style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontWeight: 500 }}
          >
            Studio Docs
          </Link>
          <Link
            to="/cms-ui/docs/getting-started/installation"
            style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontWeight: 500 }}
          >
            Installation
          </Link>
          <Link
            to="/"
            style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontWeight: 500 }}
          >
            CMS Core Docs
          </Link>
          <Link
            to="https://github.com/mindfiredigital/agentic-headless-cms"
            style={{ color: '#ff3344', textDecoration: 'none', fontWeight: 650 }}
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
