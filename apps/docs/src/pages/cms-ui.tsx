import React from 'react';
import Layout from '@theme/Layout';
import { CmsUiNavbar } from '../components/CmsUiHomepage/navbar';
import { CmsUiHeroSection } from '../components/CmsUiHomepage/hero';
import { CmsUiFeaturesSection } from '../components/CmsUiHomepage/features';
import { CmsUiCTASection } from '../components/CmsUiHomepage/cta';
import CmsUiFooter from '../components/CmsUiHomepage/footer';
import { InteractivePreview } from '../components/CmsUiHomepage/interactivePreview';


export default function CmsUiHome(): React.JSX.Element {
  return (
    <Layout
      wrapperClassName="cms-ui-page"
      noFooter
      title="CMS UI – Admin Studio | Agentic CMS"
      description="A modern, open-source CMS admin studio with visual page builder, dynamic tokens, media library, and tamper-evident audit logs."
    >
      {/* Custom CMS UI Top Navigation (Replaces Default Docusaurus Navbar) */}
      <CmsUiNavbar />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          background: 'var(--background)',
          minHeight: '100vh',
        }}
      >
        <CmsUiHeroSection />
        <InteractivePreview />
        <CmsUiFeaturesSection />
        <CmsUiCTASection />
        <CmsUiFooter />
      </div>
    </Layout>
  );
}
