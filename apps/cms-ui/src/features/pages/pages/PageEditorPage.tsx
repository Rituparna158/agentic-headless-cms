import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import {
  PageBuilderReact,
  type PageBuilderDesign,
} from '@mindfiredigital/page-builder-react';
import { pagesApi } from '../api/pages.api';
import { usePageSchema } from '../hooks/usePageSchema';

// Custom page-builder components
import HeroSection from '../components/page-builder/components/HeroSection';
import HeroSectionSettings from '../components/page-builder/settings/HeroSectionSettings';
import FeatureGrid from '../components/page-builder/components/FeatureGrid';
import FeatureGridSettings from '../components/page-builder/settings/FeatureGridSettings';
import CtaBanner from '../components/page-builder/components/CtaBanner';
import CtaBannerSettings from '../components/page-builder/settings/CtaBannerSettings';
// Removed old Tailwind-based components (TestimonialCard, PricingTable, FaqAccordion)
import SearchBar from '../components/page-builder/components/SearchBar';
import SearchBarSettings from '../components/page-builder/settings/SearchBarSettings';
import ContactForm from '../components/page-builder/components/ContactForm';
import ContactFormSettings from '../components/page-builder/settings/ContactFormSettings';
import NewsletterForm from '../components/page-builder/components/NewsletterForm';
import NewsletterFormSettings from '../components/page-builder/settings/NewsletterFormSettings';
import DynamicForm from '../components/page-builder/components/DynamicForm';
import DynamicFormSettings from '../components/page-builder/settings/DynamicFormSettings';
import { Navbar } from '../components/page-builder/components/Navbar';
import { NavbarSettings } from '../components/page-builder/settings/NavbarSettings';
import { Footer } from '../components/page-builder/components/Footer';
import { FooterSettings } from '../components/page-builder/settings/FooterSettings';
import { VideoShowcase } from '../components/page-builder/components/VideoShowcase';
import { VideoShowcaseSettings } from '../components/page-builder/settings/VideoShowcaseSettings';
import { ImageShowcase } from '../components/page-builder/components/ImageShowcase';
import { ImageShowcaseSettings } from '../components/page-builder/settings/ImageShowcaseSettings';
import { Testimonials } from '../components/page-builder/components/Testimonials';
import { TestimonialsSettings } from '../components/page-builder/settings/TestimonialsSettings';
import { PricingTable } from '../components/page-builder/components/PricingTable';
// PricingTable is imported below
import { PricingSettings } from '../components/page-builder/settings/PricingSettings';

import { EmbedCode } from '../components/page-builder/components/EmbedCode';
import { EmbedCodeSettings } from '../components/page-builder/settings/EmbedCodeSettings';
import { StatCounter } from '../components/page-builder/components/StatCounter';
import { StatCounterSettings } from '../components/page-builder/settings/StatCounterSettings';
import { Tabs } from '../components/page-builder/components/Tabs';
import { TabsSettings } from '../components/page-builder/settings/TabsSettings';
import { SocialShare } from '../components/page-builder/components/SocialShare';
import { SocialShareSettings } from '../components/page-builder/settings/SocialShareSettings';
import { ButtonGroup } from '../components/page-builder/components/ButtonGroup';
import { ButtonGroupSettings } from '../components/page-builder/settings/ButtonGroupSettings';
import { Countdown } from '../components/page-builder/components/Countdown';
import { CountdownSettings } from '../components/page-builder/settings/CountdownSettings';
import { MapEmbed } from '../components/page-builder/components/MapEmbed';
import { MapEmbedSettings } from '../components/page-builder/settings/MapEmbedSettings';

import { FAQ } from '../components/page-builder/components/FAQ';
import { FAQSettings } from '../components/page-builder/settings/FAQSettings';
import { usePageBuilderStore } from '../components/page-builder/stores/pageBuilderStore';

function slugify(text: string): string {
  return (
    '/' +
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const schemaQuery = usePageSchema();

  const pageQuery = useQuery({
    queryKey: ['page', id],
    queryFn: () => pagesApi.getPage(id!),
    enabled: !!id && !!schemaQuery.data,
  });

  useEffect(() => {
    // Reset the global component configuration store when switching pages
    // This prevents components like 'FeatureGrid1' from bleeding across different pages
    usePageBuilderStore.getState().resetStore();
  }, [id]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [initialBody, setInitialBody] = useState<PageBuilderDesign | undefined>(
    undefined,
  );
  const [isBuilderReady, setIsBuilderReady] = useState(false);

  const bodyRef = useRef<PageBuilderDesign>([]);

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
        // { name: 'richtext' },
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

  useEffect(() => {
    if (pageQuery.data) {
      setTitle(pageQuery.data.data.title);
      setSlug(pageQuery.data.data.slug);
      const bodyData = pageQuery.data.data.body;
      const safeBodyData = Array.isArray(bodyData) ? bodyData : [];
      setInitialBody(safeBodyData as PageBuilderDesign);
      bodyRef.current = safeBodyData as PageBuilderDesign;
      setIsBuilderReady(true);
    }
  }, [pageQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      pagesApi.updatePage(id!, {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        body: bodyRef.current ?? [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['page', id] });
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
  };

  const handleDesignChange = useCallback((newDesign: PageBuilderDesign) => {
    bodyRef.current = newDesign;
  }, []);

  useEffect(() => {
    const rebuildCustomSettingsPanel = (component: HTMLElement) => {
      const skipClasses = new Set([
        'custom-component',
        'editable-component',
        'component-resizer',
      ]);
      const componentTypeClass = Array.from(component.classList).find(
        (cls) => cls.endsWith('-component') && !skipClasses.has(cls),
      );
      if (!componentTypeClass) return;

      const componentType = componentTypeClass.replace('-component', '');
      const componentId = component.id;
      const settingsTagName = `react-settings-component-${componentType.toLowerCase()}`;

      setTimeout(() => {
        const panel = document.getElementById('functions-panel');
        if (!panel) return;

        const hasFallback = Array.from(panel.children).some(
          (el) =>
            el.tagName === 'P' &&
            el.textContent?.includes('No specific settings'),
        );
        if (!hasFallback) return;

        panel.innerHTML = '';
        let settingsEl = panel.querySelector(
          settingsTagName,
        ) as HTMLElement | null;
        if (!settingsEl) {
          settingsEl = document.createElement(settingsTagName) as HTMLElement;
          panel.appendChild(settingsEl);
        }
        settingsEl.setAttribute(
          'data-settings',
          JSON.stringify({ targetComponentId: componentId }),
        );
      }, 50);
    };

    const waitForElements = setInterval(() => {
      const canvas = document.getElementById('canvas');
      const attributeTab = document.getElementById('attribute-tab');
      if (!canvas || !attributeTab) return;
      clearInterval(waitForElements);

      // Fix A: canvas click — auto-switch to Attribute tab then rebuild panel
      canvas.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const customComp = target.closest(
          '.custom-component',
        ) as HTMLElement | null;
        if (!customComp) return;

        setTimeout(() => {
          attributeTab.click();
          rebuildCustomSettingsPanel(customComp);
        }, 0);
      });

      // Fix B: Attribute tab click — if a custom component is already selected,
      // rebuild the panel (handles switching back from Customize/Layers tabs)
      attributeTab.addEventListener('click', () => {
        const sidebar = (
          window as unknown as {
            CustomizationSidebar?: { selectedComponent: HTMLElement | null };
          }
        ).CustomizationSidebar;
        const selected: HTMLElement | null = sidebar?.selectedComponent ?? null;
        if (!selected?.classList.contains('custom-component')) return;
        rebuildCustomSettingsPanel(selected);
      });
    }, 200);

    return () => clearInterval(waitForElements);
  }, []);

  const handleSave = () => {
    if (!title.trim()) return;
    updateMutation.mutate();
  };

  if (pageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (pageQuery.isError || !pageQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Page not found</p>
        <button
          onClick={() => navigate('/pages')}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Back to Pages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pages')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Page Title"
              className="text-lg font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="/page-slug"
              className="text-sm font-mono bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!title.trim() || updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Page Builder Canvas */}
      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
        <style>{`
          #functions-panel {
            overflow-y: auto !important;
            max-height: calc(100vh - 120px) !important;
            padding-bottom: 40px !important;
          }
        `}</style>
        {isBuilderReady && (
          <PageBuilderReact
            key={id}
            config={JSON.parse(JSON.stringify(pageBuilderConfig))}
            customComponents={Object.fromEntries(
              Object.entries(customComponents).map(([key, val]) => [
                key,
                { ...val },
              ]),
            )}
            initialDesign={initialBody}
            onChange={handleDesignChange}
            editable={true}
            brandTitle={title || 'Page Builder'}
            layoutMode="grid"
            showAttributeTab={true}
          />
        )}
      </div>
    </div>
  );
}
