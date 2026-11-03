import { create } from 'zustand';
export { useShallow } from 'zustand/react/shallow';

export type {
  HeroSettings,
  FeatureItem,
  FeatureGridSettings,
  CtaBannerSettings,
  SearchBarSettings,
  ContactFormSettings,
  NewsletterFormSettings,
  DynamicFormField,
  DynamicFormSettings,
  NavbarLink,
  NavbarSettings,
  FooterSettings,
  VideoItem,
  VideoShowcaseSettings,
  ImageItem,
  ImageShowcaseSettings,
  ReviewItem,
  TestimonialSettings,
  PricingFeature,
  PricingTier,
  PricingSettings,
  FAQItem,
  FAQSettings,
  EmbedCodeSettings,
  StatItem,
  StatCounterSettings,
  TabItem,
  TabsSettings,
  SocialShareSettings,
  ButtonItem,
  ButtonGroupSettings,
  CountdownSettings,
  MapEmbedSettings,
  ComponentState,
  ComponentActions,
} from '@/features/collections/types/page-builder.types';
import type {
  ComponentState,
  ComponentActions,
} from '@/features/collections/types/page-builder.types';

import {
  HERO_DEFAULTS,
  FEATURE_GRID_DEFAULTS,
  CTA_BANNER_DEFAULTS,
  EMBED_CODE_DEFAULTS,
  STAT_COUNTER_DEFAULTS,
  TABS_DEFAULTS,
  SOCIAL_SHARE_DEFAULTS,
  BUTTON_GROUP_DEFAULTS,
  COUNTDOWN_DEFAULTS,
  MAP_EMBED_DEFAULTS,
  SEARCH_BAR_DEFAULTS,
  CONTACT_FORM_DEFAULTS,
  NEWSLETTER_FORM_DEFAULTS,
  DYNAMIC_FORM_DEFAULTS,
  NAVBAR_DEFAULTS,
  FOOTER_DEFAULTS,
  VIDEO_SHOWCASE_DEFAULTS,
  IMAGE_SHOWCASE_DEFAULTS,
  TESTIMONIAL_DEFAULTS,
  PRICING_DEFAULTS,
  FAQ_DEFAULTS,
  EMPTY_COMPONENT_STATE,
} from '@/features/collections/constants/pageBuilderDefaults.constants';

export {
  HERO_DEFAULTS,
  FEATURE_GRID_DEFAULTS,
  CTA_BANNER_DEFAULTS,
  EMBED_CODE_DEFAULTS,
  STAT_COUNTER_DEFAULTS,
  TABS_DEFAULTS,
  SOCIAL_SHARE_DEFAULTS,
  BUTTON_GROUP_DEFAULTS,
  COUNTDOWN_DEFAULTS,
  MAP_EMBED_DEFAULTS,
  SEARCH_BAR_DEFAULTS,
  CONTACT_FORM_DEFAULTS,
  NEWSLETTER_FORM_DEFAULTS,
  DYNAMIC_FORM_DEFAULTS,
  NAVBAR_DEFAULTS,
  FOOTER_DEFAULTS,
  VIDEO_SHOWCASE_DEFAULTS,
  IMAGE_SHOWCASE_DEFAULTS,
  TESTIMONIAL_DEFAULTS,
  PRICING_DEFAULTS,
  FAQ_DEFAULTS,
  EMPTY_COMPONENT_STATE,
};

export type PageBuilderStore = ComponentState & ComponentActions;

const getComponentStateSnapshot = (
  state: ComponentState,
): Record<string, unknown> => ({
  hero: state.hero,
  featureGrid: state.featureGrid,
  ctaBanner: state.ctaBanner,
  searchBar: state.searchBar,
  contactForm: state.contactForm,
  newsletterForm: state.newsletterForm,
  dynamicForm: state.dynamicForm,
  navbar: state.navbar,
  footer: state.footer,
  videoShowcase: state.videoShowcase,
  imageShowcase: state.imageShowcase,
  testimonials: state.testimonials,
  pricing: state.pricing,
  faq: state.faq,
  embedCode: state.embedCode,
  statCounter: state.statCounter,
  tabs: state.tabs,
  socialShare: state.socialShare,
  buttonGroup: state.buttonGroup,
  countdown: state.countdown,
  mapEmbed: state.mapEmbed,
});

export const usePageBuilderStore = create<PageBuilderStore>((set, get) => ({
  ...EMPTY_COMPONENT_STATE,

  activePageId: null,
  isDirty: false,
  lastSavedSnapshot: null,
  draftsByPageId: {},

  setActivePageId: (pageId) => set({ activePageId: pageId }),
  markDirty: (dirty = true) => set({ isDirty: dirty }),
  markClean: (_pageId, snapshot) =>
    set((state) => ({
      isDirty: false,
      lastSavedSnapshot: snapshot ?? state.lastSavedSnapshot,
    })),
  hasUnsavedChanges: () => get().isDirty,

  snapshotComponentState: () => getComponentStateSnapshot(get()),
  restoreComponentState: (savedState) =>
    set((prev) => ({
      ...prev,
      ...savedState,
      isDirty: true,
    })),

  resetStoreForPage: (newPageId: string) => {
    const state = get();
    const currentDrafts = { ...state.draftsByPageId };

    if (state.activePageId && state.isDirty) {
      currentDrafts[state.activePageId] = {
        updatedAt: Date.now(),
        componentState: getComponentStateSnapshot(state),
      };
    }

    const existingDraft = currentDrafts[newPageId];
    if (existingDraft?.componentState) {
      set({
        ...existingDraft.componentState,
        activePageId: newPageId,
        isDirty: true,
        draftsByPageId: currentDrafts,
      });
    } else {
      set({
        ...EMPTY_COMPONENT_STATE,
        activePageId: newPageId,
        isDirty: false,
        draftsByPageId: currentDrafts,
      });
    }
  },

  resetStore: () =>
    set({
      ...EMPTY_COMPONENT_STATE,
      activePageId: null,
      isDirty: false,
      lastSavedSnapshot: null,
    }),

  // Hero
  setHero: (id, patch) =>
    set((state) => ({
      isDirty: true,
      hero: {
        ...state.hero,
        [id]: { ...(state.hero[id] ?? HERO_DEFAULTS), ...patch },
      },
    })),
  clearHero: (id) =>
    set((state) => {
      const hero = { ...state.hero };
      delete hero[id];
      return { hero, isDirty: true };
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

//  Auto-save: trigger canvas state save on settings change

let _saveTimer: ReturnType<typeof setTimeout> | undefined;
usePageBuilderStore.subscribe(() => {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('table-design-change'));
  }, 150);
});
