import React from 'react';
import Layout from '@theme/Layout';
import { HeroSection } from '../components/Homepage/hero';
import { WhyAgenticCMSSection } from '../components/Homepage/why-agentic-cms';
import { CTASection } from '../components/Homepage/cta';
import Footer from '../components/Homepage/footer';
import { BackgroundAnimation } from '../components/Homepage/background-animation';

export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="Agentic Headless CMS"
      description="Next-Gen Headless CMS Built for Content Teams & Autonomous AI Agents"
    >
      <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <BackgroundAnimation />
        <HeroSection />
        <WhyAgenticCMSSection />
        <CTASection />
        <Footer />
      </div>
    </Layout>
  );
}
