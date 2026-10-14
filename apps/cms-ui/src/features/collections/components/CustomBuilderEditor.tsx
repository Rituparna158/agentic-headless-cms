import { useMemo } from 'react';
import { PageBuilderReact } from '@mindfiredigital/page-builder-react';

// Custom page-builder components
import HeroSection from './page-builder/components/HeroSection';
import HeroSectionSettings from './page-builder/settings/HeroSectionSettings';
import FeatureGrid from './page-builder/components/FeatureGrid';
import FeatureGridSettings from './page-builder/settings/FeatureGridSettings';
import CtaBanner from './page-builder/components/CtaBanner';
import CtaBannerSettings from './page-builder/settings/CtaBannerSettings';
import SearchBar from './page-builder/components/SearchBar';
import SearchBarSettings from './page-builder/settings/SearchBarSettings';
import ContactForm from './page-builder/components/ContactForm';
import ContactFormSettings from './page-builder/settings/ContactFormSettings';
import NewsletterForm from './page-builder/components/NewsletterForm';
import NewsletterFormSettings from './page-builder/settings/NewsletterFormSettings';
import DynamicForm from './page-builder/components/DynamicForm';
import DynamicFormSettings from './page-builder/settings/DynamicFormSettings';
import { Navbar } from './page-builder/components/Navbar';
import { NavbarSettings } from './page-builder/settings/NavbarSettings';
import { Footer } from './page-builder/components/Footer';
import { FooterSettings } from './page-builder/settings/FooterSettings';
import { VideoShowcase } from './page-builder/components/VideoShowcase';
import { VideoShowcaseSettings } from './page-builder/settings/VideoShowcaseSettings';
import { ImageShowcase } from './page-builder/components/ImageShowcase';
import { ImageShowcaseSettings } from './page-builder/settings/ImageShowcaseSettings';
import { Testimonials } from './page-builder/components/Testimonials';
import { TestimonialsSettings } from './page-builder/settings/TestimonialsSettings';
import { PricingTable } from './page-builder/components/PricingTable';
import { PricingSettings } from './page-builder/settings/PricingSettings';
import { EmbedCode } from './page-builder/components/EmbedCode';
import { EmbedCodeSettings } from './page-builder/settings/EmbedCodeSettings';
import { StatCounter } from './page-builder/components/StatCounter';
import { StatCounterSettings } from './page-builder/settings/StatCounterSettings';
import { Tabs } from './page-builder/components/Tabs';
import { TabsSettings } from './page-builder/settings/TabsSettings';
import { SocialShare } from './page-builder/components/SocialShare';
import { SocialShareSettings } from './page-builder/settings/SocialShareSettings';
import { ButtonGroup } from './page-builder/components/ButtonGroup';
import { ButtonGroupSettings } from './page-builder/settings/ButtonGroupSettings';
import { Countdown } from './page-builder/components/Countdown';
import { CountdownSettings } from './page-builder/settings/CountdownSettings';
import { MapEmbed } from './page-builder/components/MapEmbed';
import { MapEmbedSettings } from './page-builder/settings/MapEmbedSettings';
import { FAQ } from './page-builder/components/FAQ';
import { FAQSettings } from './page-builder/settings/FAQSettings';

import { PageBuilderDesign } from '@mindfiredigital/page-builder-react';

interface CustomBuilderEditorProps {
  id: string;
  initialDesign: PageBuilderDesign | undefined;
  onChange: (design: PageBuilderDesign) => void;
  title: string;
}

export default function CustomBuilderEditor({
  id,
  initialDesign,
  onChange,
  title,
}: CustomBuilderEditorProps) {
  const pageBuilderConfig = useMemo(
    () => ({
      Basic: [
        { name: 'button' },
        { name: 'header' },
        { name: 'text' },
        { name: 'image' },
        { name: 'video' },
        { name: 'container' },
        { name: 'twoCol' },
        { name: 'threeCol' },
        { name: 'table' },
        { name: 'link' },
      ],
      Extra: [],
    }),
    [],
  );

  const customComponents = useMemo(
    () => ({
      HeroSection: {
        component: HeroSection,
        settingsComponent: HeroSectionSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 7h8M4 10h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        title: 'Hero Section',
        defaultWidth: '100%',
        defaultHeight: '400px',
      },
      FeatureGrid: {
        component: FeatureGrid,
        settingsComponent: FeatureGridSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>',
        title: 'Feature Grid',
        defaultWidth: '100%',
        defaultHeight: '350px',
      },
      CtaBanner: {
        component: CtaBanner,
        settingsComponent: CtaBannerSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 8h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        title: 'CTA Banner',
        defaultWidth: '100%',
        defaultHeight: '200px',
      },
      EmbedCode: {
        component: EmbedCode,
        settingsComponent: EmbedCodeSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6L1 8l3 2M12 6l3 2-3 2M9.5 3l-3 10"/></svg>',
        title: 'HTML Embed',
        defaultWidth: '100%',
        defaultHeight: '200px',
      },
      StatCounter: {
        component: StatCounter,
        settingsComponent: StatCounterSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 14h12M4 14V8M8 14V4M12 14v-6"/></svg>',
        title: 'Stat Counter',
        defaultWidth: '100%',
        defaultHeight: '300px',
      },
      Tabs: {
        component: Tabs,
        settingsComponent: TabsSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h4v3H2z"/><path d="M6 7h8v5H2V7"/></svg>',
        title: 'Tabs',
        defaultWidth: '100%',
        defaultHeight: '300px',
      },
      SocialShare: {
        component: SocialShare,
        settingsComponent: SocialShareSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="4" cy="8" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><path d="M5.5 7l5-2.5M5.5 9l5 2.5"/></svg>',
        title: 'Social Share',
        defaultWidth: '100%',
        defaultHeight: '100px',
      },
      ButtonGroup: {
        component: ButtonGroup,
        settingsComponent: ButtonGroupSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="5" height="4" rx="1"/><rect x="9" y="6" width="5" height="4" rx="1"/></svg>',
        title: 'Button Group',
        defaultWidth: '100%',
        defaultHeight: '100px',
      },
      Countdown: {
        component: Countdown,
        settingsComponent: CountdownSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>',
        title: 'Countdown Timer',
        defaultWidth: '100%',
        defaultHeight: '200px',
      },
      MapEmbed: {
        component: MapEmbed,
        settingsComponent: MapEmbedSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1c3 0 5 2.5 5 5 0 3-3 7-5 9-2-2-5-6-5-9 0-2.5 2-5 5-5z"/><circle cx="8" cy="6" r="2"/></svg>',
        title: 'Google Map',
        defaultWidth: '100%',
        defaultHeight: '400px',
      },
      SearchBar: {
        component: SearchBar,
        settingsComponent: SearchBarSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        title: 'Search Bar',
        defaultWidth: '100%',
        defaultHeight: '100px',
      },
      ContactForm: {
        component: ContactForm,
        settingsComponent: ContactFormSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6h8M4 9h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        title: 'Contact Form',
        defaultWidth: '100%',
        defaultHeight: '500px',
      },
      NewsletterForm: {
        component: NewsletterForm,
        settingsComponent: NewsletterFormSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4 6-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>',
        title: 'Newsletter Form',
        defaultWidth: '100%',
        defaultHeight: '300px',
      },
      DynamicForm: {
        component: DynamicForm,
        settingsComponent: DynamicFormSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>',
        title: 'Dynamic Form',
        defaultWidth: '100%',
        defaultHeight: '400px',
      },
      Navbar: {
        component: Navbar,
        settingsComponent: NavbarSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M4 6h2M10 6h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        title: 'Navbar',
        defaultWidth: '100%',
        defaultHeight: '64px',
      },
      Footer: {
        component: Footer,
        settingsComponent: FooterSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="8" width="14" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M4 11h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        title: 'Footer',
        defaultWidth: '100%',
        defaultHeight: '200px',
      },
      VideoShowcase: {
        component: VideoShowcase,
        settingsComponent: VideoShowcaseSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="2" ry="2"/><polygon points="6 6 11 8 6 10 6 6"/></svg>',
        title: 'Video Showcase',
        defaultWidth: '100%',
        defaultHeight: '400px',
      },
      ImageShowcase: {
        component: ImageShowcase,
        settingsComponent: ImageShowcaseSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="10" height="10" rx="2" ry="2"/><circle cx="7" cy="7" r="1.5"/><path d="m13 10-3-3-4 4"/></svg>',
        title: 'Image Showcase',
        defaultWidth: '100%',
        defaultHeight: '400px',
      },
      Testimonials: {
        component: Testimonials,
        settingsComponent: TestimonialsSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8c0 3.31-2.69 6-6 6a5.98 5.98 0 0 1-3.69-1.26L2 14l1.26-2.31A5.98 5.98 0 0 1 2 8c0-3.31 2.69-6 6-6s6 2.69 6 6z"/><path d="M6 7h.01M10 7h.01"/></svg>',
        title: 'Testimonials',
        defaultWidth: '100%',
        defaultHeight: '400px',
      },
      PricingTable: {
        component: PricingTable,
        settingsComponent: PricingSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="4" height="10" rx="1"/><rect x="10" y="3" width="4" height="10" rx="1"/></svg>',
        title: 'Pricing Table',
        defaultWidth: '100%',
        defaultHeight: '600px',
      },
      FAQ: {
        component: FAQ,
        settingsComponent: FAQSettings,
        svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7"/><path d="M9.09 5a3 3 0 0 0-5.83 1c0 2 3 3 3 3"/><path d="M8 12h.01"/></svg>',
        title: 'FAQ',
        defaultWidth: '100%',
        defaultHeight: '300px',
      },
    }),
    [],
  );

  return (
    <PageBuilderReact
      key={id}
      config={JSON.parse(JSON.stringify(pageBuilderConfig))}
      customComponents={Object.fromEntries(
        Object.entries(customComponents).map(([key, val]) => [key, { ...val }]),
      )}
      initialDesign={initialDesign}
      onChange={onChange}
      editable={true}
      brandTitle={title || 'Page Builder'}
      layoutMode="grid"
      showAttributeTab={true}
    />
  );
}
