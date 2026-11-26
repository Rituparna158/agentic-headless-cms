import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Palette,
  Sparkles,
  Save,
  Loader2,
  Type,
  Maximize2,
  Code2,
  Check,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Layers,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  Upload,
  Download,
  Copy,
  Edit2,
  Trash2,
  Search,
  Bookmark,
  Sliders,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useCmsToast } from '@/hooks/useCmsToast';
import { useCan } from '@/hooks/useCan';
import {
  themeApi,
  findThemeEntry,
  readThemeConfig,
  readCustomTemplates,
  exportTemplateAsJson,
  importTemplateFromJson,
} from '../api/theme.api';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
} from '../constants/theme.constants';
import { CustomThemeTemplateModal } from '../components/CustomThemeTemplateModal';
import {
  buildSiteModel,
  fetchAllSiteEntries,
  resolvePath,
  normalizeSlug,
  type SitePage,
} from '@/features/render/siteModel';
import { useSiteInfo } from '@/features/render/useSiteInfo';
import { renderView } from '@/features/render/renderView';
import { buildPreviewDocument } from '@/features/render/previewDocument';
import { PREVIEW_DEVICE_WIDTH } from '@/features/render/constants';
import type { DeviceType } from '@/features/render/types';
import type {
  ThemeConfig,
  ThemePresetId,
  ThemeTokens,
  CustomThemeTemplate,
  BuiltinPresetId,
} from '../types/theme.types';

const pageBase = (page: SitePage | null | undefined) =>
  !page || page.slug === '/' ? '' : page.slug;

export const ThemeSettingsPage: React.FC = () => {
  const { siteId = '' } = useParams<{ siteId: string }>();
  const queryClient = useQueryClient();
  const toast = useCmsToast();
  const canManage = useCan(siteId)('manage_settings');
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Fetch real site entries (all pages, sections, menus, and existing theme)
  const entriesQuery = useQuery({
    queryKey: ['site-preview-entries', siteId],
    queryFn: () => fetchAllSiteEntries(siteId),
    enabled: Boolean(siteId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const site = useSiteInfo(siteId);

  // 2. Locate existing saved theme entry
  const existingThemeEntry = useMemo(() => findThemeEntry(entries), [entries]);

  // 3. UI and Theme State
  const [activeTab, setActiveTab] = useState<
    'presets' | 'colors' | 'typography' | 'layout' | 'css'
  >('presets');
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [customTemplates, setCustomTemplates] = useState<CustomThemeTemplate[]>(
    [],
  );
  const [initialised, setInitialised] = useState(false);
  const [previewPath, setPreviewPath] = useState<string>('/');
  const [device, setDevice] = useState<DeviceType>('desktop');

  // Custom Template Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CustomThemeTemplate | null>(null);
  const [baseTokensForModal, setBaseTokensForModal] = useState<
    ThemeTokens | undefined
  >(undefined);

  // Template Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Navigation history inside the preview frame
  const [history, setHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const go = useCallback(
    (targetPath: string) => {
      const norm = normalizeSlug(targetPath);
      setPreviewPath(norm);
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        if (next[next.length - 1] === norm) return next;
        return [...next, norm];
      });
      setHistoryIndex((idx) => idx + 1);
    },
    [historyIndex],
  );

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const target = history[prevIdx];
      if (target) {
        setHistoryIndex(prevIdx);
        setPreviewPath(target);
      }
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const target = history[nextIdx];
      if (target) {
        setHistoryIndex(nextIdx);
        setPreviewPath(target);
      }
    }
  };

  // Initialize theme and custom templates from database when entry loads
  useEffect(() => {
    if (existingThemeEntry && !initialised) {
      const loaded = readThemeConfig(existingThemeEntry, siteId);
      setTheme(loaded);
      setCustomTemplates(loaded.customTemplates || []);
      setInitialised(true);
    } else if (!existingThemeEntry && !entriesQuery.isLoading && !initialised) {
      const fallbackTemplates = readCustomTemplates(null, siteId);
      setCustomTemplates(fallbackTemplates);
      setInitialised(true);
    }
  }, [existingThemeEntry, entriesQuery.isLoading, initialised, siteId]);

  // 4. Build base model from actual site content
  const baseModel = useMemo(() => buildSiteModel(entries, 'draft'), [entries]);

  // 5. Dynamically inject the reactive live theme state and custom templates into the real site model
  const reactiveModel = useMemo(() => {
    return {
      ...baseModel,
      theme: {
        ...theme,
        customTemplates,
      },
    };
  }, [baseModel, theme, customTemplates]);

  // 6. Resolve the real page currently being viewed
  const resolved = useMemo(() => {
    const byPath = resolvePath(reactiveModel, previewPath);
    if (byPath) return byPath;

    // Fallback to homepage or first available page
    const home = resolvePath(reactiveModel, '/');
    if (home) return home;

    const first = reactiveModel.pages[0];
    if (first) {
      return { page: first, post: null, tag: undefined };
    }
    return null;
  }, [reactiveModel, previewPath]);

  // 7. Listen for navigation and click events from inside the preview iframe
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        action?: string;
        href?: string;
        slug?: string;
      };
      if (!data) return;

      // Only listen to events originating from the preview frame
      if (frameRef.current && event.source !== frameRef.current.contentWindow) {
        return;
      }

      if (data.type === 'CMS_PREVIEW_SELECT' && data.slug) {
        const baseSlug = resolved?.page ? pageBase(resolved.page) : '';
        go(`${baseSlug}/${data.slug}`);
        return;
      }

      if (data.type === 'CMS_PREVIEW_NAVIGATE') {
        if (data.action === 'view-post' && data.slug) {
          const baseSlug = resolved?.page ? pageBase(resolved.page) : '';
          go(`${baseSlug}/${data.slug}`);
          return;
        }

        if (data.action === 'back-to-list' && resolved?.page) {
          go(resolved.page.slug);
          return;
        }

        const href = data.href ?? '';
        if (/^(https?:)?\/\//.test(href)) {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else if (href) {
          go(href);
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [resolved, go]);

  // 8. Render real page view with live theme tokens applied
  const view = useMemo(() => {
    if (!resolved) return null;
    return renderView(reactiveModel, resolved, {
      site,
      url: (p) => p,
    });
  }, [reactiveModel, resolved, site]);

  // 9. Generate sandboxed preview document HTML for the iframe
  const srcDoc = useMemo(() => {
    if (!view) return '';
    return buildPreviewDocument(view.html, view.css, view.head);
  }, [view]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      themeApi.save(siteId, existingThemeEntry, theme, customTemplates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['site-preview-entries', siteId],
      });
      queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      toast.show({
        title: 'Theme Published Live!',
        message:
          'Your website theme changes are now published across all pages.',
        type: 'success',
      });
    },
    onError: () => {
      toast.show({
        title: 'Failed to Save Theme',
        message: 'Could not update site theme. Please try again.',
        type: 'error',
      });
    },
  });

  // Action: Apply Curated Preset
  const selectPreset = (presetId: ThemePresetId) => {
    const preset = THEME_PRESETS[presetId as BuiltinPresetId];
    if (preset) {
      setTheme({
        ...preset,
        name: preset.name,
        customTemplates,
      });
      toast.show({
        title: `Switched to ${preset.name}`,
        message:
          'Preview updated. Click "Save & Publish" to push changes live.',
        type: 'info',
      });
    }
  };

  // Action: Apply User Custom Template
  const selectCustomTemplate = (template: CustomThemeTemplate) => {
    setTheme({
      presetId: template.id,
      name: template.name,
      description: template.description,
      isCustom: true,
      tokens: template.tokens,
      customTemplates,
    });
    toast.show({
      title: `Applied Custom Template "${template.name}"`,
      message: 'Preview updated. Click "Save & Publish" to push changes live.',
      type: 'info',
    });
  };

  // Action: Open Modal to Create Fresh Template
  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setBaseTokensForModal(theme.tokens);
    setIsModalOpen(true);
  };

  // Action: Open Modal to Duplicate any Template
  const handleDuplicateTemplate = (
    source: ThemeConfig | CustomThemeTemplate,
  ) => {
    setEditingTemplate({
      id: '',
      name: `${source.name} (Copy)`,
      description: `Custom template based on ${source.name}`,
      category: source.category || 'custom',
      tokens: JSON.parse(JSON.stringify(source.tokens)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setBaseTokensForModal(source.tokens);
    setIsModalOpen(true);
  };

  // Action: Open Modal to Edit Custom Template
  const handleEditCustomTemplate = (template: CustomThemeTemplate) => {
    setEditingTemplate(template);
    setBaseTokensForModal(template.tokens);
    setIsModalOpen(true);
  };

  // Action: Save Custom Template from Modal
  const handleSaveCustomTemplate = async (
    template: CustomThemeTemplate,
    applyLive: boolean,
  ) => {
    try {
      const updatedList = customTemplates.some((t) => t.id === template.id)
        ? customTemplates.map((t) => (t.id === template.id ? template : t))
        : [...customTemplates, template];

      setCustomTemplates(updatedList);

      const targetTheme: ThemeConfig = applyLive
        ? {
            presetId: template.id,
            name: template.name,
            description: template.description,
            isCustom: true,
            tokens: template.tokens,
            customTemplates: updatedList,
          }
        : {
            ...theme,
            customTemplates: updatedList,
          };

      if (applyLive) {
        setTheme(targetTheme);
      }

      await themeApi.saveCustomTemplate(
        siteId,
        existingThemeEntry,
        template,
        targetTheme,
      );
      queryClient.invalidateQueries({
        queryKey: ['site-preview-entries', siteId],
      });

      toast.show({
        title: applyLive
          ? 'Template Saved & Applied!'
          : 'Template Saved to Library',
        message: `"${template.name}" is now available in your custom templates.`,
        type: 'success',
      });
    } catch {
      toast.show({
        title: 'Error Saving Template',
        message: 'Could not persist template. Please try again.',
        type: 'error',
      });
    }
  };

  // Action: Delete Custom Template
  const handleDeleteCustomTemplate = async (
    templateId: string,
    templateName: string,
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete template "${templateName}"?`,
      )
    ) {
      return;
    }

    try {
      const updatedList = customTemplates.filter((t) => t.id !== templateId);
      setCustomTemplates(updatedList);

      let targetTheme = theme;
      if (theme.presetId === templateId) {
        targetTheme = {
          ...THEME_PRESETS.minimal,
          customTemplates: updatedList,
        };
        setTheme(targetTheme);
      }

      await themeApi.deleteCustomTemplate(
        siteId,
        existingThemeEntry,
        templateId,
        targetTheme,
      );
      queryClient.invalidateQueries({
        queryKey: ['site-preview-entries', siteId],
      });

      toast.show({
        title: 'Template Deleted',
        message: `Removed "${templateName}" from your template library.`,
        type: 'info',
      });
    } catch {
      toast.show({
        title: 'Error Deleting Template',
        message: 'Could not delete template.',
        type: 'error',
      });
    }
  };

  // Action: Export Template as JSON
  const handleExport = (t: ThemeConfig | CustomThemeTemplate) => {
    exportTemplateAsJson(t);
    toast.show({
      title: 'Template Exported',
      message: `Downloaded ${t.name} JSON file.`,
      type: 'success',
    });
  };

  // Action: Import Template from JSON File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const imported = importTemplateFromJson(text);

        await handleSaveCustomTemplate(imported, true);
        toast.show({
          title: 'Template Imported Successfully!',
          message: `Imported "${imported.name}" and applied live.`,
          type: 'success',
        });
      } catch (err) {
        toast.show({
          title: 'Import Failed',
          message:
            err instanceof Error ? err.message : 'Invalid JSON file format.',
          type: 'error',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Temporary Live Preview from Modal
  const handleTempPreview = (tokens: ThemeTokens) => {
    setTheme((prev) => ({
      ...prev,
      tokens,
    }));
  };

  // Color / Typography / Layout Updaters
  const updateColor = (key: keyof ThemeTokens['colors'], val: string) => {
    setTheme((prev) => ({
      ...prev,
      presetId: 'custom',
      tokens: {
        ...prev.tokens,
        colors: {
          ...prev.tokens.colors,
          [key]: val,
        },
      },
    }));
  };

  const updateTypography = (
    key: keyof ThemeTokens['typography'],
    val: string,
  ) => {
    setTheme((prev) => ({
      ...prev,
      presetId: 'custom',
      tokens: {
        ...prev.tokens,
        typography: {
          ...prev.tokens.typography,
          [key]: val,
        },
      },
    }));
  };

  const updateLayout = (key: keyof ThemeTokens['layout'], val: string) => {
    setTheme((prev) => ({
      ...prev,
      presetId: 'custom',
      tokens: {
        ...prev.tokens,
        layout: {
          ...prev.tokens.layout,
          [key]: val,
        },
      },
    }));
  };

  // Filter curated and custom templates
  const filteredCurated = useMemo(() => {
    return Object.values(THEME_PRESETS)
      .filter((p) => p.presetId !== 'custom')
      .filter((p) => {
        if (selectedFilter === 'my-templates') return false;
        if (selectedFilter !== 'all' && selectedFilter !== 'curated') {
          if (p.category !== selectedFilter) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          );
        }
        return true;
      });
  }, [selectedFilter, searchQuery]);

  const filteredCustom = useMemo(() => {
    return customTemplates.filter((t) => {
      if (selectedFilter === 'curated') return false;
      if (selectedFilter !== 'all' && selectedFilter !== 'my-templates') {
        if (t.category !== selectedFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customTemplates, selectedFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* Hidden File Input for Importing Theme JSON */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Top Header */}
      <header className="px-8 py-3.5 border-b border-border bg-card/60 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
            <Link to="/" className="hover:text-foreground transition-colors">
              Websites
            </Link>
            <span>/</span>
            <span className="capitalize">{siteId}</span>
            <span>/</span>
            <span className="text-foreground font-medium">Theme & Styling</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-400" />
            Theme & Appearance Customizer
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCreateNewTemplate}
            className="px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Create your own custom theme template"
          >
            <Plus size={13} />
            <span>Create Template</span>
          </button>

          <button
            type="button"
            onClick={() => selectPreset('minimal')}
            className={CMS_THEME_CLASSES.buttons.secondary}
            title="Reset to default minimal theme"
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !canManage}
            className={`${CMS_THEME_CLASSES.buttons.primary} shadow-sm`}
          >
            {saveMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>Save & Publish Theme</span>
          </button>
        </div>
      </header>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Column (420px for comfortable template cards) */}
        <div className="w-[420px] shrink-0 border-r border-border bg-card/30 flex flex-col h-full overflow-hidden">
          {/* Section Navigation Tabs */}
          <div className="flex items-center border-b border-border bg-card/50 px-3 py-2 gap-1 overflow-x-auto text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'presets'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Sparkles size={13} />
              <span>
                Templates (
                {Object.keys(THEME_PRESETS).length - 1 + customTemplates.length}
                )
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('colors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'colors'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Palette size={13} />
              <span>Colors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'typography'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Type size={13} />
              <span>Typography</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'layout'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Maximize2 size={13} />
              <span>Layout</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('css')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'css'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Code2 size={13} />
              <span>CSS</span>
            </button>
          </div>

          {/* Control Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* TAB 1: TEMPLATES & PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                {/* Search & Actions Bar */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates & styles..."
                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                      title="Import Theme JSON"
                    >
                      <Upload size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateNewTemplate}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 shadow-xs"
                      title="Create Custom Template"
                    >
                      <Plus size={13} />
                      <span>New</span>
                    </button>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
                    {[
                      { id: 'all', label: 'All Styles' },
                      {
                        id: 'my-templates',
                        label: `My Custom (${customTemplates.length})`,
                      },
                      { id: 'curated', label: 'Curated' },
                      { id: 'minimal', label: 'Minimal' },
                      { id: 'editorial', label: 'Editorial' },
                      { id: 'dark', label: 'Dark Mode' },
                      { id: 'vibrant', label: 'Vibrant' },
                      { id: 'corporate', label: 'Corporate' },
                      { id: 'luxury', label: 'Luxury' },
                      { id: 'creative', label: 'Brutalist' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg shrink-0 transition-all font-medium ${
                          selectedFilter === f.id
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold'
                            : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. MY CUSTOM TEMPLATES SECTION */}
                {(selectedFilter === 'all' ||
                  selectedFilter === 'my-templates') && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Bookmark size={13} className="text-amber-400" />
                        <span>
                          My Custom Templates ({filteredCustom.length})
                        </span>
                      </h3>
                      {filteredCustom.length > 0 && (
                        <button
                          type="button"
                          onClick={handleCreateNewTemplate}
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Plus size={11} /> Create More
                        </button>
                      )}
                    </div>

                    {filteredCustom.length === 0 ? (
                      selectedFilter === 'my-templates' ? (
                        <div className="p-6 rounded-2xl border border-dashed border-border bg-card/40 text-center space-y-3">
                          <Palette
                            size={24}
                            className="mx-auto text-muted-foreground/60"
                          />
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              No custom templates yet
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Build your own template with customized colors,
                              fonts, and container widths.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCreateNewTemplate}
                            className={`${CMS_THEME_CLASSES.buttons.primary} text-xs mx-auto`}
                          >
                            <Plus size={13} />
                            <span>Create Your First Template</span>
                          </button>
                        </div>
                      ) : null
                    ) : (
                      <div className="space-y-2.5">
                        {filteredCustom.map((template) => {
                          const isSelected = theme.presetId === template.id;
                          return (
                            <div
                              key={template.id}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500 shadow-xs'
                                  : 'border-border bg-card/60 hover:border-zinc-500'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground truncate">
                                      {template.name}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      Custom
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {template.description || 'Custom template'}
                                  </p>
                                </div>

                                {isSelected && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-semibold shrink-0">
                                    <Check size={10} /> Active
                                  </span>
                                )}
                              </div>

                              {/* Swatches & Tags */}
                              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-4 w-4 rounded-full border border-black/20"
                                    style={{
                                      backgroundColor:
                                        template.tokens.colors.primary,
                                    }}
                                    title="Primary"
                                  />
                                  <span
                                    className="h-4 w-4 rounded-full border border-black/20"
                                    style={{
                                      backgroundColor:
                                        template.tokens.colors.accent,
                                    }}
                                    title="Accent"
                                  />
                                  <span
                                    className="h-4 w-4 rounded-full border border-black/20"
                                    style={{
                                      backgroundColor:
                                        template.tokens.colors.background,
                                    }}
                                    title="Background"
                                  />
                                  <span
                                    className="h-4 w-4 rounded-full border border-black/20"
                                    style={{
                                      backgroundColor:
                                        template.tokens.colors.surface,
                                    }}
                                    title="Surface"
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                  {!isSelected ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        selectCustomTemplate(template)
                                      }
                                      className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition-all"
                                    >
                                      Apply
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-medium text-indigo-400 px-1.5">
                                      Current
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditCustomTemplate(template)
                                    }
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                    title="Edit Template"
                                  >
                                    <Edit2 size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDuplicateTemplate(template)
                                    }
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                    title="Duplicate Template"
                                  >
                                    <Copy size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExport(template)}
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                    title="Export JSON"
                                  >
                                    <Download size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteCustomTemplate(
                                        template.id,
                                        template.name,
                                      )
                                    }
                                    className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    title="Delete Template"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CURATED SYSTEM TEMPLATES SECTION */}
                {selectedFilter !== 'my-templates' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Sparkles size={13} className="text-indigo-400" />
                        <span>
                          Curated Templates ({filteredCurated.length})
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(null);
                          setBaseTokensForModal(theme.tokens);
                          setIsModalOpen(true);
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Sliders size={11} /> Save Current as New
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {filteredCurated.map((preset) => {
                        const isSelected = theme.presetId === preset.presetId;
                        return (
                          <div
                            key={preset.presetId}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500 shadow-xs'
                                : 'border-border bg-card/60 hover:border-zinc-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-foreground">
                                    {preset.name}
                                  </span>
                                  {preset.category && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-zinc-800 text-zinc-300 capitalize">
                                      {preset.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                                  {preset.description}
                                </p>
                              </div>

                              {isSelected && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-semibold shrink-0">
                                  <Check size={10} /> Active
                                </span>
                              )}
                            </div>

                            {/* Color Palette Preview Swatches and Actions */}
                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-4 w-4 rounded-full border border-black/20"
                                  style={{
                                    backgroundColor:
                                      preset.tokens.colors.primary,
                                  }}
                                  title="Primary"
                                />
                                <span
                                  className="h-4 w-4 rounded-full border border-black/20"
                                  style={{
                                    backgroundColor:
                                      preset.tokens.colors.accent,
                                  }}
                                  title="Accent"
                                />
                                <span
                                  className="h-4 w-4 rounded-full border border-black/20"
                                  style={{
                                    backgroundColor:
                                      preset.tokens.colors.background,
                                  }}
                                  title="Background"
                                />
                                <span
                                  className="h-4 w-4 rounded-full border border-black/20"
                                  style={{
                                    backgroundColor:
                                      preset.tokens.colors.surface,
                                  }}
                                  title="Surface"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                {!isSelected ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      selectPreset(preset.presetId)
                                    }
                                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition-all"
                                  >
                                    Apply
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-medium text-indigo-400 px-1.5">
                                    Current
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDuplicateTemplate(preset)
                                  }
                                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                  title="Duplicate / Customize as New Template"
                                >
                                  <Copy size={12} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleExport(preset)}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                  title="Export JSON"
                                >
                                  <Download size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: COLORS */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block">
                      Active: {theme.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Changes apply immediately to preview.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setBaseTokensForModal(theme.tokens);
                      setIsModalOpen(true);
                    }}
                    className="text-[11px] text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Bookmark size={11} /> Save as Template
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'primary' as const,
                      label: 'Primary Brand Color',
                      desc: 'Main buttons and key accents',
                    },
                    {
                      key: 'accent' as const,
                      label: 'Secondary Accent',
                      desc: 'Links, highlights, and badges',
                    },
                    {
                      key: 'background' as const,
                      label: 'Page Background',
                      desc: 'Base canvas and body tone',
                    },
                    {
                      key: 'surface' as const,
                      label: 'Card & Header Surface',
                      desc: 'Cards, navbars, and headers',
                    },
                    {
                      key: 'text' as const,
                      label: 'Primary Text',
                      desc: 'Headings and high-contrast text',
                    },
                    {
                      key: 'muted' as const,
                      label: 'Muted Text',
                      desc: 'Subtitles, dates, and captions',
                    },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-foreground block">
                          {label}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="color"
                          value={theme.tokens.colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="h-7 w-9 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <span className="text-[11px] font-mono text-foreground uppercase">
                          {theme.tokens.colors[key]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TYPOGRAPHY */}
            {activeTab === 'typography' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block">
                      Active: {theme.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Custom font pairings & sizing.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setBaseTokensForModal(theme.tokens);
                      setIsModalOpen(true);
                    }}
                    className="text-[11px] text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Bookmark size={11} /> Save as Template
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">
                      Headings Font Family
                    </label>
                    <select
                      value={theme.tokens.typography.fontHeading}
                      onChange={(e) =>
                        updateTypography('fontHeading', e.target.value)
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
                        Modern Sans (Inter / System)
                      </option>
                      <option value="'Merriweather', Georgia, serif">
                        Literary Serif (Merriweather)
                      </option>
                      <option value="'Playfair Display', Georgia, serif">
                        Display Serif (Playfair)
                      </option>
                      <option value="'JetBrains Mono', monospace">
                        Monospace (Developer / Tech)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">
                      Body Font Family
                    </label>
                    <select
                      value={theme.tokens.typography.fontBody}
                      onChange={(e) =>
                        updateTypography('fontBody', e.target.value)
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
                        System Sans-Serif
                      </option>
                      <option value="'Source Serif 4', Georgia, serif">
                        Editorial Serif
                      </option>
                      <option value="'Roboto', sans-serif">Roboto Clean</option>
                      <option value="'Inter', system-ui, sans-serif">
                        Inter Sans
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">
                      Base Font Size
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['14px', '16px', '18px'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateTypography('baseFontSize', sz)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            theme.tokens.typography.baseFontSize === sz
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LAYOUT */}
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Layout & Dimensions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Adjust border roundness and page container max width.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">
                      Corner Rounding (Border Radius)
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { val: '0px', label: 'None' },
                        { val: '4px', label: 'Small' },
                        { val: '8px', label: 'Medium' },
                        { val: '12px', label: 'Large' },
                        { val: '9999px', label: 'Full' },
                      ].map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            updateLayout(
                              'borderRadius',
                              val as ThemeTokens['layout']['borderRadius'],
                            )
                          }
                          className={`py-2 rounded-lg border text-[11px] font-medium transition-all ${
                            theme.tokens.layout.borderRadius === val
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">
                      Max Container Width
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: '1024px', label: 'Narrow (1024px)' },
                        { val: '1200px', label: 'Standard (1200px)' },
                        { val: '1440px', label: 'Wide (1440px)' },
                      ].map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            updateLayout(
                              'containerWidth',
                              val as ThemeTokens['layout']['containerWidth'],
                            )
                          }
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            theme.tokens.layout.containerWidth === val
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CUSTOM CSS */}
            {activeTab === 'css' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Custom CSS Overrides
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add custom CSS rules injected into the site header.
                  </p>
                </div>

                <textarea
                  value={theme.tokens.customCss || ''}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      tokens: { ...prev.tokens, customCss: e.target.value },
                    }))
                  }
                  rows={10}
                  placeholder="/* Custom CSS */&#10;.hero-badge {&#10;  box-shadow: 0 4px 12px rgba(0,0,0,0.1);&#10;}"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Column (Flex-1) */}
        <div className="flex-1 bg-zinc-950 p-4 flex flex-col overflow-hidden">
          {/* Preview Navigation & Device Switcher Bar */}
          <div className="flex items-center justify-between mb-3 text-xs text-zinc-400 shrink-0 gap-3">
            {/* Real Page Selector & History Controls */}
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Back / Forward / Home Browser Controls */}
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={historyIndex <= 0}
                  title="Back to previous page"
                  className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleForward}
                  disabled={historyIndex >= history.length - 1}
                  title="Forward to next page"
                  className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => go('/')}
                  title="Return to Homepage (/)"
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <Home size={13} />
                </button>
              </div>

              {/* Page Dropdown */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Globe size={14} className="text-indigo-400 shrink-0" />
                <select
                  value={previewPath}
                  onChange={(e) => go(e.target.value)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[220px] truncate"
                >
                  {reactiveModel.pages.map((p) => {
                    const title = p.title || p.slug;
                    return (
                      <option key={p.id} value={p.slug}>
                        {title} ({p.slug})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Active Route Badge */}
              <span className="font-mono text-[10px] bg-zinc-900/80 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 shrink-0 hidden sm:inline">
                {previewPath}
              </span>

              {/* Current Active Theme Badge */}
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full text-indigo-400 font-medium shrink-0 hidden md:inline flex items-center gap-1">
                <Sparkles size={10} /> {theme.name}
              </span>
            </div>

            {/* Device Viewport Selector */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                title="Desktop View (100%)"
                className={`p-1.5 rounded-md transition-all ${
                  device === 'desktop'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDevice('tablet')}
                title="Tablet View (768px)"
                className={`p-1.5 rounded-md transition-all ${
                  device === 'tablet'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tablet size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                title="Mobile View (390px)"
                className={`p-1.5 rounded-md transition-all ${
                  device === 'mobile'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone size={14} />
              </button>
            </div>
          </div>

          {/* Real Preview Canvas */}
          <div className="flex-1 min-h-0 flex justify-center items-center overflow-auto">
            {entriesQuery.isLoading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
                <span>Loading real website layout...</span>
              </div>
            ) : !resolved || !srcDoc ? (
              <div className="text-center p-8 text-zinc-400 text-xs">
                <Layers size={24} className="mx-auto mb-2 opacity-50" />
                <p>No rendered pages found for this website.</p>
              </div>
            ) : (
              <div
                className="h-full bg-white flex flex-col rounded-xl border border-zinc-800 shadow-2xl overflow-hidden transition-all duration-200"
                style={{
                  width: PREVIEW_DEVICE_WIDTH[device],
                  maxWidth: '100%',
                }}
              >
                <iframe
                  ref={frameRef}
                  title="Real Website Theme Live Preview"
                  srcDoc={srcDoc}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Custom Theme Template Builder Modal */}
      <CustomThemeTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTemplate={editingTemplate}
        baseTokens={baseTokensForModal}
        onSave={handleSaveCustomTemplate}
        onPreviewTemp={handleTempPreview}
      />
    </div>
  );
};
