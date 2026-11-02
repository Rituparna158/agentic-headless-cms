import React from 'react';
import {
  LayoutIcon,
  PenToolIcon,
  ImageIcon,
  UsersIcon,
  ClockIcon,
  LayersIcon,
} from './icons';
import styles from './features.module.css';

interface FeatureCardData {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const FEATURES: FeatureCardData[] = [
  {
    id: 'page-builder',
    icon: <LayoutIcon size={22} />,
    title: 'GrapesJS Visual Canvas',
    desc: 'Drag-and-drop layout editor with custom forms, premium blocks (Hero, Pricing, CTA), and a fine-grained element properties inspector.',
  },
  {
    id: 'dynamic-tokens',
    icon: <LayersIcon size={22} />,
    title: 'Dynamic Token Binding',
    desc: 'Bind schema fields like {{title}}, {{author}}, and {{excerpt}} into dynamic repeaters that automatically hydrate in the visual canvas.',
  },
  {
    id: 'version-rollback',
    icon: <ClockIcon size={22} />,
    title: 'Automated Snapshots & Rollback',
    desc: 'Point-in-time version history snapshots stored in database with side-by-side diff inspection and instant one-click reversion.',
  },
  {
    id: 'audit-logs',
    icon: <UsersIcon size={22} />,
    title: 'Tamper-Evident Audit Logs',
    desc: 'Real-time activity stream recording every login, content mutation, rollback, and schema alteration with full actor timestamps.',
  },
  {
    id: 'media-library',
    icon: <ImageIcon size={22} />,
    title: 'Centralized Media Library',
    desc: 'Visual asset storage with folder grouping, image preview cards, file dimensions, and instant upload directly to your content slots.',
  },
  {
    id: 'page-schemas',
    icon: <PenToolIcon size={22} />,
    title: 'Multi-Entry Page Schemas',
    desc: 'Configure flexible schema sections and multi-entry items defined per page or shared across collection templates with draft status.',
  },
];

export function CmsUiFeaturesSection() {
  return (
    <section id="features" className={styles.section} aria-label="CMS UI Core Capabilities">
      <div className={styles.inner}>
        {/* Section Header */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span>Core Capabilities</span>
          </div>
          <h2 className={styles.title}>
            Engineered for <span className={styles.gradientWord}>Speed &amp; Control</span>
          </h2>
          <p className={styles.subtitle}>
            Everything content teams need to design and publish beautiful pages, backed by enterprise-grade versioning and governance.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <div key={feature.id} className={styles.card}>
              <div className={styles.iconBox}>{feature.icon}</div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
