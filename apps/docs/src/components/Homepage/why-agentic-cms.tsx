import React from 'react';
import styles from './styles/why-agentic-cms.module.css';
import { SectionTitleCapsule } from './section-title';
import { ScrollReveal } from './scroll-reveal';
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
        paddingTop: '2.25rem',
        paddingBottom: '2.25rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        backgroundColor: 'transparent',
      }}
    >
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <ScrollReveal delay={50}>
          <header style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 1.75rem auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.725rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--muted-foreground)',
                marginBottom: '0.5rem',
                padding: '0.25rem 0.7rem',
                borderRadius: '9999px',
                background: 'rgba(255, 0, 0, 0.08)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
              }}
            >
              Built for Developers &amp; Creators
            </div>

            <SectionTitleCapsule highlight="Platform">
              Core Platform Capabilities
            </SectionTitleCapsule>

            <p
              style={{
                fontSize: '0.925rem',
                lineHeight: '1.5',
                color: 'var(--muted-foreground)',
                maxWidth: '560px',
                margin: '0.35rem auto 0',
              }}
            >
              A high-performance headless CMS with visual content modeling, enterprise governance, and type-safe SDKs.
            </p>
          </header>
        </ScrollReveal>

        <div className={styles.grid}>
          <ScrollReveal delay={60} style={{ height: '100%' }}>
            <FeatureCard
              icon={<DatabaseIcon size={14} />}
              title="Dynamic Schema Builder"
              desc="Visually design content types with rich text, media, custom validations, and relational references."
            />
          </ScrollReveal>

          <ScrollReveal delay={120} style={{ height: '100%' }}>
            <FeatureCard
              icon={<LayersIcon size={14} />}
              title="Draft & Publish Workflows"
              desc="Stage revisions safely, preview upcoming releases, and publish to production channels when approved."
            />
          </ScrollReveal>

          <ScrollReveal delay={180} style={{ height: '100%' }}>
            <FeatureCard
              icon={<GlobeIcon size={14} />}
              title="Multi-Language Support (i18n)"
              desc="Manage content across multiple locales with granular field translations and default language fallbacks."
            />
          </ScrollReveal>

          <ScrollReveal delay={240} style={{ height: '100%' }}>
            <FeatureCard
              icon={<ShieldIcon size={14} />}
              title="Enterprise RBAC & MFA"
              desc="Enforce strict role-based access control, field-level permissions, and TOTP two-factor security."
            />
          </ScrollReveal>

          <ScrollReveal delay={300} style={{ height: '100%' }}>
            <FeatureCard
              icon={<ActivityIcon size={14} />}
              title="Audit Logging & Redis Caching"
              desc="Track every administrative change with tamper-evident audit logs, backed by sub-millisecond Redis caching."
            />
          </ScrollReveal>

          <ScrollReveal delay={360} style={{ height: '100%' }}>
            <FeatureCard
              icon={<CodeIcon size={14} />}
              title="Type-Safe Client SDKs"
              desc="Seamlessly integrate content into your Next.js, React, and Node.js applications with official client SDKs."
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
