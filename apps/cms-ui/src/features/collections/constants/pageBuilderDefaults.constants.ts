import type {
  HeroSettings,
  FeatureGridSettings,
  CtaBannerSettings,
  SearchBarSettings,
  ContactFormSettings,
  NewsletterFormSettings,
  DynamicFormSettings,
  NavbarSettings,
  FooterSettings,
  VideoShowcaseSettings,
  ImageShowcaseSettings,
  TestimonialSettings,
  PricingSettings,
  FAQSettings,
  EmbedCodeSettings,
  StatCounterSettings,
  TabsSettings,
  SocialShareSettings,
  ButtonGroupSettings,
  CountdownSettings,
  MapEmbedSettings,
} from '../types/page-builder.types';

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
  targetDate: new Date(Date.now() + 86400000 * 7).toISOString(),
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

export const EMPTY_COMPONENT_STATE = {
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
};
