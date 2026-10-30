import React from 'react';
import Link from '@docusaurus/Link';

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        width: '100%',
        padding: '2.5rem 1.5rem',
        borderTop: '1px solid var(--border)',
        zIndex: 10,
        backgroundColor: 'var(--background)',
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
          fontSize: '0.875rem',
        }}
      >
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} Mindfire Digital LLP &bull; Agentic Headless CMS &bull; MIT License
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/docs/getting-started/introduction" style={{ color: 'inherit' }}>
            Introduction
          </Link>
          <Link to="/docs/getting-started/installation" style={{ color: 'inherit' }}>
            Installation
          </Link>
          <Link to="/docs/configurations/architecture" style={{ color: 'inherit' }}>
            Architecture
          </Link>
          <Link to="https://github.com/mindfiredigital/agentic-headless-cms" style={{ color: 'inherit' }}>
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}

