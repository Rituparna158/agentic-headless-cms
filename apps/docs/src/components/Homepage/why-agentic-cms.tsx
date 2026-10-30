import React from 'react';
import styles from './styles.module.css';
import { SectionTitleCapsule } from './section-title';
import {
  DatabaseIcon,
  LayersIcon,
  GlobeIcon,
  ShieldIcon,
  ActivityIcon,
  CodeIcon,
} from './icons';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.iconWrapper}>{icon}</div>
      <div className={styles.featureTitle}>{title}</div>
      <p className={styles.featureDesc}>{desc}</p>
    </div>
  );
}

export function WhyAgenticCMSSection() {
  return (
    <section
      aria-labelledby="why-cms-title"
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '3.5rem',
        paddingBottom: '3.5rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        backgroundColor: 'var(--background)',
      }}
    >
      <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted-foreground)',
              marginBottom: '0.75rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(255, 0, 0, 0.08)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ff0000',
              }}
            />
            Built for Developers &amp; Creators
          </div>

          <SectionTitleCapsule highlight="Platform">
            Core Platform Capabilities
          </SectionTitleCapsule>

          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: '1.6',
              color: 'var(--muted-foreground)',
              maxWidth: '620px',
              margin: '0.5rem auto 0',
            }}
          >
            A high-performance headless CMS with visual content modeling, enterprise governance, and type-safe SDKs.
          </p>
        </header>

        <div className={styles.grid}>
          <FeatureCard
            icon={<DatabaseIcon size={18} />}
            title="Dynamic Schema Builder"
            desc="Visually design content types with rich text, media, custom validations, and relational references."
          />

          <FeatureCard
            icon={<LayersIcon size={18} />}
            title="Draft & Publish Workflows"
            desc="Stage revisions safely, preview upcoming releases, and publish to production channels when approved."
          />

          <FeatureCard
            icon={<GlobeIcon size={18} />}
            title="Multi-Language Support (i18n)"
            desc="Manage content across multiple locales with granular field translations and default language fallbacks."
          />

          <FeatureCard
            icon={<ShieldIcon size={18} />}
            title="Enterprise RBAC & MFA"
            desc="Enforce strict role-based access control, field-level permissions, and TOTP two-factor security."
          />

          <FeatureCard
            icon={<ActivityIcon size={18} />}
            title="Audit Logging & Redis Caching"
            desc="Track every administrative change with tamper-evident audit logs, backed by sub-millisecond Redis caching."
          />

          <FeatureCard
            icon={<CodeIcon size={18} />}
            title="Type-Safe Client SDKs"
            desc="Seamlessly integrate content into your Next.js, React, and Node.js applications with official client SDKs."
          />
        </div>
      </div>
    </section>
  );
}
