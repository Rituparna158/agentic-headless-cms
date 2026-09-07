import { create } from 'zustand';

// ─── Type Definitions ───

export interface HeroSettings {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  textColor: string;
  titleColor: string;
  subtitleColor: string;
  buttonColor: string;
  buttonTextColor: string;
  showButton: boolean;
  alignment: 'left' | 'center' | 'right';
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureGridSettings {
  title: string;
  subtitle: string;
  columns: 2 | 3 | 4;
  features: FeatureItem[];
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardBorderRadius: number;
  showIcons: boolean;
  iconColor: string;
}

export interface CtaBannerSettings {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  alignment: 'left' | 'center' | 'right';
  showButton: boolean;
}

export interface SearchBarSettings {
  placeholder: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  showButton: boolean;
  borderRadius: number;
  iconColor: string;
  alignment: 'left' | 'center' | 'right';
  maxWidth: string;
}

export interface ContactFormSettings {
  title: string;
  subtitle: string;
  showName: boolean;
  showPhone: boolean;
  showCompany: boolean;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  buttonColor: string;
  buttonTextColor: string;
  alignment: 'left' | 'center' | 'right';
}

export interface NewsletterFormSettings {
  title: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  buttonColor: string;
  buttonTextColor: string;
  alignment: 'left' | 'center' | 'right';
  layout: 'inline' | 'stacked';
}

export interface DynamicFormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Used for select, radio, checkbox
}

export interface DynamicFormSettings {
  title: string;
  subtitle: string;
  fields: DynamicFormField[];
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  buttonColor: string;
  buttonTextColor: string;
  alignment: 'left' | 'center' | 'right';
}

export interface NavbarLink {
  id: string;
  label: string;
  url: string;
}

export interface NavbarSettings {
  brandText: string;
  links: NavbarLink[];
  ctaText: string;
  ctaUrl: string;
  backgroundColor: string;
  textColor: string;
  ctaButtonColor: string;
  ctaButtonTextColor: string;
  layout: 'left' | 'center' | 'right';
  isSticky: boolean;
}

export interface FooterSettings {
  brandText: string;
  description: string;
  copyrightText: string;
  links: NavbarLink[]; // Reusing NavbarLink since it has id, label, url
  backgroundColor: string;
  textColor: string;
  dividerColor: string;
}

export interface VideoItem {
  id: string;
  url: string;
  title: string;
  description: string;
}

export interface VideoShowcaseSettings {
  layout: 'single' | 'grid' | 'hero';
  videos: VideoItem[];
  backgroundColor: string;
  textColor: string;
  overlayOpacity: number; // For hero layout
}

export interface ImageItem {
  id: string;
  url: string;
  alt: string;
  caption: string;
}

export interface ImageShowcaseSettings {
  layout: 'grid' | 'masonry' | 'slider' | 'hero';
  images: ImageItem[];
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  gap: number;
  overlayOpacity: number; // For hero layout
}

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
  rating: number; // 1-5
}

export interface TestimonialSettings {
  layout: 'grid' | 'slider';
  reviews: ReviewItem[];
  backgroundColor: string;
  textColor: string;
  cardColor: string;
}

export interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  cycle: string; // e.g., "/month"
  description: string;
  features: PricingFeature[];
  buttonText: string;
  buttonUrl: string;
  isPopular: boolean;
}

export interface PricingSettings {
  tiers: PricingTier[];
  backgroundColor: string;
  textColor: string;
  cardColor: string;
  accentColor: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQSettings {
  title: string;
  description: string;
  items: FAQItem[];
  backgroundColor: string;
  textColor: string;
  accordionColor: string;
}

// ─── Default Values ───

export const HERO_DEFAULTS: HeroSettings = {
  title: 'Build Something Amazing',
  subtitle:
    'Create stunning pages with our drag-and-drop builder. No coding required.',
  buttonText: 'Get Started',
  buttonUrl: '#',
  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  textColor: '#ffffff',
  titleColor: '#ffffff',
  subtitleColor: 'rgba(255,255,255,0.9)',
  buttonColor: '#ffffff',
  buttonTextColor: '#667eea',
  showButton: true,
  alignment: 'center',
};

export const FEATURE_GRID_DEFAULTS: FeatureGridSettings = {
  title: 'Powerful Features',
  subtitle: 'Everything you need to succeed',
  columns: 3,
  features: [
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
      title: 'Lightning Fast',
      description: 'Optimized for speed and performance',
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      title: 'Secure',
      description: 'Enterprise-grade security built in',
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      title: 'Scalable',
      description: 'Grows with your business needs',
    },
  ],
  backgroundColor: '#ffffff',
  titleColor: '#1a202c',
  subtitleColor: '#718096',
  cardBackgroundColor: '#ffffff',
  cardBorderColor: '#e2e8f0',
  cardBorderRadius: 12,
  showIcons: true,
  iconColor: '#667eea',
};

export const CTA_BANNER_DEFAULTS: CtaBannerSettings = {
  title: 'Ready to Get Started?',
  subtitle: 'Join thousands of satisfied customers today',
  buttonText: 'Start Free Trial',
  buttonUrl: '#',
  backgroundColor: '#667eea',
  textColor: '#ffffff',
  buttonColor: '#ffffff',
  buttonTextColor: '#667eea',
  alignment: 'center',
  showButton: true,
};

export interface EmbedCodeSettings {
  htmlContent: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  prefix: string;
  suffix: string;
}

export interface StatCounterSettings {
  items: StatItem[];
  backgroundColor: string;
  textColor: string;
  valueColor: string;
}

export interface TabItem {
  id: string;
  title: string;
  content: string;
}

export interface TabsSettings {
  items: TabItem[];
  backgroundColor: string;
  textColor: string;
  activeColor: string;
  inactiveColor: string;
}

export interface SocialShareSettings {
  layout: 'icons' | 'buttons';
  platforms: {
    twitter: string;
    linkedin: string;
    facebook: string;
    instagram: string;
  };
  alignment: 'left' | 'center' | 'right';
  iconColor: string;
  hoverColor: string;
}

export interface ButtonItem {
  id: string;
  text: string;
  url: string;
  variant: 'solid' | 'outline' | 'ghost';
  color: string;
}

export interface ButtonGroupSettings {
  buttons: ButtonItem[];
  alignment: 'left' | 'center' | 'right';
  layout: 'row' | 'column';
  gap: number;
}

export interface CountdownSettings {
  targetDate: string; // ISO string
  labelDays: string;
  labelHours: string;
  labelMinutes: string;
  labelSeconds: string;
  backgroundColor: string;
  textColor: string;
  numberColor: string;
}

export interface MapEmbedSettings {
  address: string;
  height: number;
  zoom: number;
}

export const EMBED_CODE_DEFAULTS: EmbedCodeSettings = {
  htmlContent:
    '<div style="padding: 20px; text-align: center; border: 2px dashed #ccc;">Paste your HTML/iframe here</div>',
};

export const STAT_COUNTER_DEFAULTS: StatCounterSettings = {
  items: [
    { id: '1', value: '10', label: 'Users', prefix: '', suffix: 'M+' },
    { id: '2', value: '99.9', label: 'Uptime', prefix: '', suffix: '%' },
    { id: '3', value: '50', label: 'Awards', prefix: '', suffix: '+' },
  ],
  backgroundColor: '#ffffff',
  textColor: '#4b5563',
  valueColor: '#111827',
};

export const TABS_DEFAULTS: TabsSettings = {
  items: [
    {
      id: '1',
      title: 'Tab 1',
      content:
        'This is the content for Tab 1. You can edit this text in the settings panel.',
    },
    {
      id: '2',
      title: 'Tab 2',
      content:
        'This is the content for Tab 2. Tabs are a great way to organize dense information.',
    },
  ],
  backgroundColor: '#ffffff',
  textColor: '#4b5563',
  activeColor: '#2563eb',
  inactiveColor: '#e5e7eb',
};

export const SOCIAL_SHARE_DEFAULTS: SocialShareSettings = {
  layout: 'icons',
  platforms: {
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    facebook: '',
    instagram: '',
  },
  alignment: 'center',
  iconColor: '#4b5563',
  hoverColor: '#2563eb',
};

export const BUTTON_GROUP_DEFAULTS: ButtonGroupSettings = {
  buttons: [
    {
      id: '1',
      text: 'Primary Action',
      url: '#',
      variant: 'solid',
      color: '#2563eb',
    },
    {
      id: '2',
      text: 'Secondary',
      url: '#',
      variant: 'outline',
      color: '#4b5563',
    },
  ],
  alignment: 'center',
  layout: 'row',
  gap: 16,
};

export const COUNTDOWN_DEFAULTS: CountdownSettings = {
  targetDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
  labelDays: 'Days',
  labelHours: 'Hours',
  labelMinutes: 'Minutes',
  labelSeconds: 'Seconds',
  backgroundColor: '#ffffff',
  textColor: '#4b5563',
  numberColor: '#111827',
};

export const MAP_EMBED_DEFAULTS: MapEmbedSettings = {
  address: '1600 Amphitheatre Parkway, Mountain View, CA',
  height: 400,
  zoom: 14,
};

export const SEARCH_BAR_DEFAULTS: SearchBarSettings = {
  placeholder: 'Search for anything...',
  buttonText: 'Search',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  showButton: true,
  borderRadius: 8,
  iconColor: '#a0aec0',
  alignment: 'center',
  maxWidth: '600px',
};

export const CONTACT_FORM_DEFAULTS: ContactFormSettings = {
  title: 'Contact Us',
  subtitle: 'We would love to hear from you. Fill out the form below.',
  showName: true,
  showPhone: false,
  showCompany: false,
  buttonText: 'Send Message',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  inputBackgroundColor: '#f7fafc',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center',
};

export const NEWSLETTER_FORM_DEFAULTS: NewsletterFormSettings = {
  title: 'Subscribe to our Newsletter',
  subtitle: 'Get the latest news and updates right to your inbox.',
  placeholder: 'Enter your email address',
  buttonText: 'Subscribe',
  backgroundColor: '#f7fafc',
  textColor: '#1a202c',
  inputBackgroundColor: '#ffffff',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center',
  layout: 'inline',
};

export const DYNAMIC_FORM_DEFAULTS: DynamicFormSettings = {
  title: 'Custom Form',
  subtitle: 'Please fill out this form.',
  fields: [],
  buttonText: 'Submit',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  inputBackgroundColor: '#f7fafc',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center',
};

export const NAVBAR_DEFAULTS: NavbarSettings = {
  brandText: 'MyBrand',
  links: [
    { id: '1', label: 'Home', url: '#' },
    { id: '2', label: 'About', url: '#about' },
    { id: '3', label: 'Contact', url: '#contact' },
  ],
  ctaText: 'Get Started',
  ctaUrl: '#',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  ctaButtonColor: '#2563eb',
  ctaButtonTextColor: '#ffffff',
  layout: 'right',
  isSticky: true,
};

export const FOOTER_DEFAULTS: FooterSettings = {
  brandText: 'MyBrand',
  description: 'Building the future of web design, one block at a time.',
  copyrightText: '© 2026 MyBrand. All rights reserved.',
  links: [
    { id: '1', label: 'Privacy Policy', url: '#' },
    { id: '2', label: 'Terms of Service', url: '#' },
    { id: '3', label: 'Contact Us', url: '#' },
  ],
  backgroundColor: '#111827',
  textColor: '#f9fafb',
  dividerColor: '#374151',
};

export const VIDEO_SHOWCASE_DEFAULTS: VideoShowcaseSettings = {
  layout: 'single',
  videos: [
    {
      id: '1',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Sample Video',
      description: 'This is a placeholder video description.',
    },
  ],
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  overlayOpacity: 0.5,
};

export const IMAGE_SHOWCASE_DEFAULTS: ImageShowcaseSettings = {
  layout: 'grid',
  images: [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1506744626753-dba37c2ade9a?w=800&auto=format&fit=crop&q=60',
      alt: 'Beautiful landscape',
      caption: 'Mountain View',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=60',
      alt: 'Scenic valley',
      caption: 'Green Valley',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=60',
      alt: 'Nature hike',
      caption: 'Forest Trail',
    },
  ],
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  borderRadius: 8,
  gap: 16,
  overlayOpacity: 0.4,
};

export const TESTIMONIAL_DEFAULTS: TestimonialSettings = {
  layout: 'grid',
  reviews: [
    {
      id: '1',
      name: 'Sarah Jenkins',
      role: 'CEO at TechCorp',
      quote:
        'This platform completely transformed the way we build pages. Highly recommended!',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      rating: 5,
    },
    {
      id: '2',
      name: 'David Chen',
      role: 'Marketing Director',
      quote:
        'The ease of use and versatility is unmatched. It saved us hundreds of hours.',
      avatar: 'https://i.pravatar.cc/150?u=david',
      rating: 5,
    },
  ],
  backgroundColor: '#f9fafb',
  textColor: '#111827',
  cardColor: '#ffffff',
};

export const PRICING_DEFAULTS: PricingSettings = {
  tiers: [
    {
      id: '1',
      name: 'Starter',
      price: '$29',
      cycle: '/month',
      description: 'Perfect for small teams getting started.',
      features: [
        { id: 'f1', text: '1 Project', included: true },
        { id: 'f2', text: 'Basic Analytics', included: true },
        { id: 'f3', text: 'Priority Support', included: false },
      ],
      buttonText: 'Start Free Trial',
      buttonUrl: '#',
      isPopular: false,
    },
    {
      id: '2',
      name: 'Pro',
      price: '$79',
      cycle: '/month',
      description: 'Everything you need to scale your business.',
      features: [
        { id: 'f1', text: 'Unlimited Projects', included: true },
        { id: 'f2', text: 'Advanced Analytics', included: true },
        { id: 'f3', text: 'Priority Support', included: true },
      ],
      buttonText: 'Get Started',
      buttonUrl: '#',
      isPopular: true,
    },
  ],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  cardColor: '#f9fafb',
  accentColor: '#3b82f6',
};

export const FAQ_DEFAULTS: FAQSettings = {
  title: 'Frequently Asked Questions',
  description: 'Everything you need to know about our product and billing.',
  items: [
    {
      id: '1',
      question: 'Can I cancel my subscription at any time?',
      answer:
        'Yes, you can cancel your subscription at any time from your account settings. You will still have access to the platform until the end of your current billing period.',
    },
    {
      id: '2',
      question: 'Do you offer a free trial?',
      answer:
        'Yes! We offer a 14-day free trial on all plans. No credit card is required to sign up and start building.',
    },
  ],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  accordionColor: '#f9fafb',
};

// ─── Store Types ───

interface ComponentState {
  hero: Record<string, HeroSettings>;
  featureGrid: Record<string, FeatureGridSettings>;
  ctaBanner: Record<string, CtaBannerSettings>;
  searchBar: Record<string, SearchBarSettings>;
  contactForm: Record<string, ContactFormSettings>;
  newsletterForm: Record<string, NewsletterFormSettings>;
  dynamicForm: Record<string, DynamicFormSettings>;
  navbar: Record<string, NavbarSettings>;
  footer: Record<string, FooterSettings>;
  videoShowcase: Record<string, VideoShowcaseSettings>;
  imageShowcase: Record<string, ImageShowcaseSettings>;
  testimonials: Record<string, TestimonialSettings>;
  pricing: Record<string, PricingSettings>;
  faq: Record<string, FAQSettings>;
  embedCode: Record<string, EmbedCodeSettings>;
  statCounter: Record<string, StatCounterSettings>;
  tabs: Record<string, TabsSettings>;
  socialShare: Record<string, SocialShareSettings>;
  buttonGroup: Record<string, ButtonGroupSettings>;
  countdown: Record<string, CountdownSettings>;
  mapEmbed: Record<string, MapEmbedSettings>;
}

interface ComponentActions {
  // Hero
  setHero: (id: string, patch: Partial<HeroSettings>) => void;
  clearHero: (id: string) => void;

  // Feature Grid
  setFeatureGrid: (id: string, patch: Partial<FeatureGridSettings>) => void;
  clearFeatureGrid: (id: string) => void;

  // CTA Banner
  setCtaBanner: (id: string, patch: Partial<CtaBannerSettings>) => void;
  clearCtaBanner: (id: string) => void;

  // Testimonial
  clearTestimonial: (id: string) => void;

  // Pricing Table

  // FAQ

  setEmbedCode: (id: string, patch: Partial<EmbedCodeSettings>) => void;
  clearEmbedCode: (id: string) => void;
  setStatCounter: (id: string, patch: Partial<StatCounterSettings>) => void;
  clearStatCounter: (id: string) => void;
  setTabs: (id: string, patch: Partial<TabsSettings>) => void;
  clearTabs: (id: string) => void;
  setSocialShare: (id: string, patch: Partial<SocialShareSettings>) => void;
  clearSocialShare: (id: string) => void;
  setButtonGroup: (id: string, patch: Partial<ButtonGroupSettings>) => void;
  clearButtonGroup: (id: string) => void;
  setCountdown: (id: string, patch: Partial<CountdownSettings>) => void;
  clearCountdown: (id: string) => void;
  setMapEmbed: (id: string, patch: Partial<MapEmbedSettings>) => void;
  clearMapEmbed: (id: string) => void;

  // Search Bar
  setSearchBar: (id: string, patch: Partial<SearchBarSettings>) => void;
  clearSearchBar: (id: string) => void;

  // Contact Form
  setContactForm: (id: string, patch: Partial<ContactFormSettings>) => void;
  clearContactForm: (id: string) => void;

  // Newsletter Form
  setNewsletterForm: (
    id: string,
    patch: Partial<NewsletterFormSettings>,
  ) => void;
  clearNewsletterForm: (id: string) => void;

  // Dynamic Form
  setDynamicForm: (id: string, patch: Partial<DynamicFormSettings>) => void;
  clearDynamicForm: (id: string) => void;

  // Navbar
  setNavbar: (id: string, patch: Partial<NavbarSettings>) => void;
  clearNavbar: (id: string) => void;

  // Footer
  setFooter: (id: string, patch: Partial<FooterSettings>) => void;
  clearFooter: (id: string) => void;

  // Video Showcase
  setVideoShowcase: (id: string, patch: Partial<VideoShowcaseSettings>) => void;
  clearVideoShowcase: (id: string) => void;

  // Image Showcase
  setImageShowcase: (id: string, patch: Partial<ImageShowcaseSettings>) => void;
  clearImageShowcase: (id: string) => void;

  // Testimonials
  setTestimonial: (id: string, patch: Partial<TestimonialSettings>) => void;
  // Pricing
  setPricing: (id: string, patch: Partial<PricingSettings>) => void;
  clearPricing: (id: string) => void;

  // FAQ
  setFAQ: (id: string, patch: Partial<FAQSettings>) => void;
  clearFAQ: (id: string) => void;

  // Reset entirely
  resetStore: () => void;
}

export type PageBuilderStore = ComponentState & ComponentActions;

// ─── Store ───

export const usePageBuilderStore = create<PageBuilderStore>((set) => ({
  // Initial state
  hero: {},
  featureGrid: {},
  ctaBanner: {},
  searchBar: {},
  contactForm: {},
  newsletterForm: {},
  dynamicForm: {},
  navbar: {},
  footer: {},
  videoShowcase: {},
  imageShowcase: {},
  testimonials: {},
  pricing: {},
  faq: {},
  embedCode: {},
  statCounter: {},
  tabs: {},
  socialShare: {},
  buttonGroup: {},
  countdown: {},
  mapEmbed: {},

  // Reset Entire Store
  resetStore: () =>
    set({
      hero: {},
      featureGrid: {},
      ctaBanner: {},
      faq: {},
      embedCode: {},
      statCounter: {},
      tabs: {},
      socialShare: {},
      buttonGroup: {},
      countdown: {},
      mapEmbed: {},

      searchBar: {},
      contactForm: {},
      newsletterForm: {},
      dynamicForm: {},
    }),

  // Hero
  setHero: (id, patch) =>
    set((state) => ({
      hero: {
        ...state.hero,
        [id]: { ...(state.hero[id] ?? HERO_DEFAULTS), ...patch },
      },
    })),
  clearHero: (id) =>
    set((state) => {
      const hero = { ...state.hero };
      delete hero[id];
      return { hero };
    }),

  // Feature Grid
  setFeatureGrid: (id, patch) =>
    set((state) => ({
      featureGrid: {
        ...state.featureGrid,
        [id]: { ...(state.featureGrid[id] ?? FEATURE_GRID_DEFAULTS), ...patch },
      },
    })),
  clearFeatureGrid: (id) =>
    set((state) => {
      const featureGrid = { ...state.featureGrid };
      delete featureGrid[id];
      return { featureGrid };
    }),

  // CTA Banner
  setCtaBanner: (id, patch) =>
    set((state) => ({
      ctaBanner: {
        ...state.ctaBanner,
        [id]: { ...(state.ctaBanner[id] ?? CTA_BANNER_DEFAULTS), ...patch },
      },
    })),
  clearCtaBanner: (id) =>
    set((state) => {
      const ctaBanner = { ...state.ctaBanner };
      delete ctaBanner[id];
      return { ctaBanner };
    }),

  setEmbedCode: (id, patch) =>
    set((state) => ({
      embedCode: {
        ...state.embedCode,
        [id]: { ...(state.embedCode[id] ?? EMBED_CODE_DEFAULTS), ...patch },
      },
    })),
  clearEmbedCode: (id) =>
    set((state) => {
      const embedCode = { ...state.embedCode };
      delete embedCode[id];
      return { embedCode };
    }),

  setStatCounter: (id, patch) =>
    set((state) => ({
      statCounter: {
        ...state.statCounter,
        [id]: { ...(state.statCounter[id] ?? STAT_COUNTER_DEFAULTS), ...patch },
      },
    })),
  clearStatCounter: (id) =>
    set((state) => {
      const statCounter = { ...state.statCounter };
      delete statCounter[id];
      return { statCounter };
    }),

  setTabs: (id, patch) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [id]: { ...(state.tabs[id] ?? TABS_DEFAULTS), ...patch },
      },
    })),
  clearTabs: (id) =>
    set((state) => {
      const tabs = { ...state.tabs };
      delete tabs[id];
      return { tabs };
    }),

  setSocialShare: (id, patch) =>
    set((state) => ({
      socialShare: {
        ...state.socialShare,
        [id]: { ...(state.socialShare[id] ?? SOCIAL_SHARE_DEFAULTS), ...patch },
      },
    })),
  clearSocialShare: (id) =>
    set((state) => {
      const socialShare = { ...state.socialShare };
      delete socialShare[id];
      return { socialShare };
    }),

  setButtonGroup: (id, patch) =>
    set((state) => ({
      buttonGroup: {
        ...state.buttonGroup,
        [id]: { ...(state.buttonGroup[id] ?? BUTTON_GROUP_DEFAULTS), ...patch },
      },
    })),
  clearButtonGroup: (id) =>
    set((state) => {
      const buttonGroup = { ...state.buttonGroup };
      delete buttonGroup[id];
      return { buttonGroup };
    }),

  setCountdown: (id, patch) =>
    set((state) => ({
      countdown: {
        ...state.countdown,
        [id]: { ...(state.countdown[id] ?? COUNTDOWN_DEFAULTS), ...patch },
      },
    })),
  clearCountdown: (id) =>
    set((state) => {
      const countdown = { ...state.countdown };
      delete countdown[id];
      return { countdown };
    }),

  setMapEmbed: (id, patch) =>
    set((state) => ({
      mapEmbed: {
        ...state.mapEmbed,
        [id]: { ...(state.mapEmbed[id] ?? MAP_EMBED_DEFAULTS), ...patch },
      },
    })),
  clearMapEmbed: (id) =>
    set((state) => {
      const mapEmbed = { ...state.mapEmbed };
      delete mapEmbed[id];
      return { mapEmbed };
    }),

  // Search Bar
  setSearchBar: (id, patch) =>
    set((state) => ({
      searchBar: {
        ...state.searchBar,
        [id]: { ...(state.searchBar[id] ?? SEARCH_BAR_DEFAULTS), ...patch },
      },
    })),
  clearSearchBar: (id) =>
    set((state) => {
      const searchBar = { ...state.searchBar };
      delete searchBar[id];
      return { searchBar };
    }),

  // Contact Form
  setContactForm: (id, patch) =>
    set((state) => ({
      contactForm: {
        ...state.contactForm,
        [id]: { ...(state.contactForm[id] ?? CONTACT_FORM_DEFAULTS), ...patch },
      },
    })),
  clearContactForm: (id) =>
    set((state) => {
      const contactForm = { ...state.contactForm };
      delete contactForm[id];
      return { contactForm };
    }),

  // Newsletter Form
  setNewsletterForm: (id, patch) =>
    set((state) => ({
      newsletterForm: {
        ...state.newsletterForm,
        [id]: {
          ...(state.newsletterForm[id] ?? NEWSLETTER_FORM_DEFAULTS),
          ...patch,
        },
      },
    })),
  clearNewsletterForm: (id) =>
    set((state) => {
      const newsletterForm = { ...state.newsletterForm };
      delete newsletterForm[id];
      return { newsletterForm };
    }),

  // Dynamic Form
  setDynamicForm: (id, patch) =>
    set((state) => ({
      dynamicForm: {
        ...state.dynamicForm,
        [id]: { ...(state.dynamicForm[id] ?? DYNAMIC_FORM_DEFAULTS), ...patch },
      },
    })),
  clearDynamicForm: (id) =>
    set((state) => {
      const dynamicForm = { ...state.dynamicForm };
      delete dynamicForm[id];
      return { dynamicForm };
    }),

  // Navbar
  setNavbar: (id, patch) =>
    set((state) => ({
      navbar: {
        ...state.navbar,
        [id]: { ...(state.navbar[id] ?? NAVBAR_DEFAULTS), ...patch },
      },
    })),
  clearNavbar: (id) =>
    set((state) => {
      const navbar = { ...state.navbar };
      delete navbar[id];
      return { navbar };
    }),

  // Footer
  setFooter: (id, patch) =>
    set((state) => ({
      footer: {
        ...state.footer,
        [id]: { ...(state.footer[id] ?? FOOTER_DEFAULTS), ...patch },
      },
    })),
  clearFooter: (id) =>
    set((state) => {
      const footer = { ...state.footer };
      delete footer[id];
      return { footer };
    }),

  // Video Showcase
  setVideoShowcase: (id, patch) =>
    set((state) => ({
      videoShowcase: {
        ...state.videoShowcase,
        [id]: {
          ...(state.videoShowcase[id] ?? VIDEO_SHOWCASE_DEFAULTS),
          ...patch,
        },
      },
    })),
  clearVideoShowcase: (id) =>
    set((state) => {
      const videoShowcase = { ...state.videoShowcase };
      delete videoShowcase[id];
      return { videoShowcase };
    }),

  // Image Showcase
  setImageShowcase: (id, patch) =>
    set((state) => ({
      imageShowcase: {
        ...state.imageShowcase,
        [id]: {
          ...(state.imageShowcase[id] ?? IMAGE_SHOWCASE_DEFAULTS),
          ...patch,
        },
      },
    })),
  clearImageShowcase: (id) =>
    set((state) => {
      const imageShowcase = { ...state.imageShowcase };
      delete imageShowcase[id];
      return { imageShowcase };
    }),

  // Testimonials
  setTestimonial: (id, patch) =>
    set((state) => ({
      testimonials: {
        ...state.testimonials,
        [id]: { ...(state.testimonials[id] ?? TESTIMONIAL_DEFAULTS), ...patch },
      },
    })),
  clearTestimonial: (id) =>
    set((state) => {
      const testimonials = { ...state.testimonials };
      delete testimonials[id];
      return { testimonials };
    }),

  // Pricing
  setPricing: (id, patch) =>
    set((state) => ({
      pricing: {
        ...state.pricing,
        [id]: { ...(state.pricing[id] ?? PRICING_DEFAULTS), ...patch },
      },
    })),
  clearPricing: (id) =>
    set((state) => {
      const pricing = { ...state.pricing };
      delete pricing[id];
      return { pricing };
    }),

  // FAQ
  setFAQ: (id, patch) =>
    set((state) => ({
      faq: {
        ...state.faq,
        [id]: { ...(state.faq[id] ?? FAQ_DEFAULTS), ...patch },
      },
    })),
  clearFAQ: (id) =>
    set((state) => {
      const faq = { ...state.faq };
      delete faq[id];
      return { faq };
    }),
}));

// ─── Component Removal Cleanup ───

document.addEventListener('pb:component-removed', (e: Event) => {
  const { componentId } = (e as CustomEvent<{ componentId: string }>).detail;
  const store = usePageBuilderStore.getState();
  store.clearHero(componentId);
  store.clearFeatureGrid(componentId);
  store.clearCtaBanner(componentId);

  store.clearEmbedCode(componentId);
  store.clearStatCounter(componentId);
  store.clearTabs(componentId);
  store.clearSocialShare(componentId);
  store.clearButtonGroup(componentId);
  store.clearCountdown(componentId);
  store.clearMapEmbed(componentId);
  store.clearSearchBar(componentId);
  store.clearContactForm(componentId);
  store.clearNewsletterForm(componentId);
  store.clearDynamicForm(componentId);
  store.clearNavbar(componentId);
  store.clearFooter(componentId);
  store.clearVideoShowcase(componentId);
  store.clearImageShowcase(componentId);
  store.clearTestimonial(componentId);
  store.clearPricing(componentId);
  store.clearFAQ(componentId);
});

// ─── Auto-save: trigger canvas state save on settings change ───

let _saveTimer: ReturnType<typeof setTimeout> | undefined;
usePageBuilderStore.subscribe(() => {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('table-design-change'));
  }, 150);
});
