import type React from 'react';
import type { CanvasDraftRecord } from './collections.types';

export interface BasePageBuilderComponentProps {
  componentId: string;
  isPreview?: boolean;
}

export type HeroSectionProps = BasePageBuilderComponentProps;
export type FeatureGridProps = BasePageBuilderComponentProps;
export type CtaBannerProps = BasePageBuilderComponentProps;
export type SearchBarProps = BasePageBuilderComponentProps;
export type ContactFormProps = BasePageBuilderComponentProps;
export type NewsletterFormProps = BasePageBuilderComponentProps;
export type DynamicFormProps = BasePageBuilderComponentProps;
export type NavbarProps = BasePageBuilderComponentProps;
export type FooterProps = BasePageBuilderComponentProps;
export type VideoShowcaseProps = BasePageBuilderComponentProps;
export type ImageShowcaseProps = BasePageBuilderComponentProps;
export type TestimonialProps = BasePageBuilderComponentProps;
export type PricingProps = BasePageBuilderComponentProps;
export type FAQProps = BasePageBuilderComponentProps;
export type EmbedCodeProps = BasePageBuilderComponentProps;
export type StatCounterProps = BasePageBuilderComponentProps;
export type TabsProps = BasePageBuilderComponentProps;
export type SocialShareProps = BasePageBuilderComponentProps;
export type ButtonGroupProps = BasePageBuilderComponentProps;
export type CountdownProps = BasePageBuilderComponentProps;
export type MapEmbedProps = BasePageBuilderComponentProps;

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
  options?: string[];
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
  links: NavbarLink[];
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
  overlayOpacity: number;
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
  overlayOpacity: number;
}

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
  rating: number;
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
  cycle: string;
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
  targetDate: string;
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

export interface ComponentState {
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
  activePageId: string | null;
  isDirty: boolean;
  lastSavedSnapshot: string | null;
  draftsByPageId: Record<
    string,
    {
      updatedAt: number;
      componentState: Record<string, unknown>;
    }
  >;
}

export interface ComponentActions {
  setActivePageId: (pageId: string | null) => void;
  markDirty: (dirty?: boolean) => void;
  markClean: (pageId?: string, snapshot?: string) => void;
  hasUnsavedChanges: () => boolean;
  snapshotComponentState: () => Record<string, unknown>;
  restoreComponentState: (state: Record<string, unknown>) => void;
  resetStoreForPage: (newPageId: string) => void;
  setHero: (id: string, patch: Partial<HeroSettings>) => void;
  clearHero: (id: string) => void;
  setFeatureGrid: (id: string, patch: Partial<FeatureGridSettings>) => void;
  clearFeatureGrid: (id: string) => void;
  setCtaBanner: (id: string, patch: Partial<CtaBannerSettings>) => void;
  clearCtaBanner: (id: string) => void;
  clearTestimonial: (id: string) => void;
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
  setSearchBar: (id: string, patch: Partial<SearchBarSettings>) => void;
  clearSearchBar: (id: string) => void;
  setContactForm: (id: string, patch: Partial<ContactFormSettings>) => void;
  clearContactForm: (id: string) => void;
  setNewsletterForm: (
    id: string,
    patch: Partial<NewsletterFormSettings>,
  ) => void;
  clearNewsletterForm: (id: string) => void;
  setDynamicForm: (id: string, patch: Partial<DynamicFormSettings>) => void;
  clearDynamicForm: (id: string) => void;
  setNavbar: (id: string, patch: Partial<NavbarSettings>) => void;
  clearNavbar: (id: string) => void;
  setFooter: (id: string, patch: Partial<FooterSettings>) => void;
  clearFooter: (id: string) => void;
  setVideoShowcase: (id: string, patch: Partial<VideoShowcaseSettings>) => void;
  clearVideoShowcase: (id: string) => void;
  setImageShowcase: (id: string, patch: Partial<ImageShowcaseSettings>) => void;
  clearImageShowcase: (id: string) => void;
  setTestimonial: (id: string, patch: Partial<TestimonialSettings>) => void;
  setPricing: (id: string, patch: Partial<PricingSettings>) => void;
  clearPricing: (id: string) => void;
  setFAQ: (id: string, patch: Partial<FAQSettings>) => void;
  clearFAQ: (id: string) => void;
  resetStore: () => void;
}

export interface DraftRecoveryBannerProps {
  draft: CanvasDraftRecord | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export interface PageEditorHeaderProps {
  schemaSlug: string;
  slug: string;
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeBuilder: 'grapesjs' | 'custom';
  availableSchemasCount: number;
  onOpenSchemaDrawer: () => void;
  onOpenImportModal: () => void;
  onOpenHistoryDrawer: () => void;
  lastAutoSavedAt: number | null;
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
  onNavigateBack: () => void;
}
