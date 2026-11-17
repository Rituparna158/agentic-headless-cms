import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCan } from '@/hooks/useCan';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  Clock,
  GripVertical,
  Plus,
  Trash2,
  ChevronUp,
  Edit2,
  Loader2,
} from 'lucide-react';
import { postsApi, extractArrayPayload } from '../api/posts.api';
import type {
  PageEntry,
  PageCustomSchema,
  DynamicFieldDefinition,
  DynamicFieldDataType,
} from '@/types/content.types';
import { SchemaMediaField } from '@/components/PageSideDrawer/SchemaMediaField';
import { SchemaRichTextEditor } from '@/components/PageSideDrawer/SchemaRichTextEditor';
import { MediaAssetPickerModal } from '@/features/media/components/MediaAssetPickerModal';
import { VersionHistoryDrawer } from '@/features/collections/components/template/VersionHistoryDrawer';
import { useCmsToast } from '@/hooks/useCmsToast';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import {
  GENERAL_STARTER_PAGES,
  ECOMMERCE_STARTER_PAGES,
} from '@/features/collections/constants/starter-pages.constants';

/** Friendly label: use the display name, else turn `card_title` into `Card title`. */
const fieldLabel = (field: { displayName?: string; apiId: string }) => {
  if (field.displayName && field.displayName.trim()) return field.displayName;
  const spaced = field.apiId.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Form inputs need strings; objects are shown as JSON instead of "[object Object]". */
const toInputValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return '';
  }
};

/** Accepts the legacy 'rich_text' spelling that older schemas may have stored. */
const isRichTextField = (dataType: string) =>
  dataType === 'richtext' || dataType === 'rich_text';

export const PageContentEditorPage: React.FC = () => {
  const { siteId = '', pageId = '' } = useParams<{
    siteId: string;
    pageId: string;
  }>();
  const canPublish = useCan(siteId)('publish_content');
  const queryClient = useQueryClient();
  const toast = useCmsToast();

  const [activeMediaPickerField, setActiveMediaPickerField] = useState<{
    schemaId: string;
    fieldApiId: string;
    itemIndex?: number;
  } | null>(null);

  // Version history & rollback drawer state
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Expanded inline multi-entry cards state (schemaId -> set of item indices)
  const [expandedCards, setExpandedCards] = useState<
    Record<string, number | null>
  >({});

  // 1. Fetch real pages for this site to locate the active page
  const pagesQuery = useQuery({
    queryKey: ['collection-pages', siteId],
    queryFn: () => postsApi.listPagesForCollection(siteId),
    enabled: Boolean(siteId),
    staleTime: 5 * 60 * 1000,
  });

  const pages = useMemo(
    () => extractArrayPayload<PageEntry>(pagesQuery.data),
    [pagesQuery.data],
  );

  const activePage = useMemo(() => {
    return pages.find((p) => p.id === pageId) || null;
  }, [pages, pageId]);

  // Working state for page title and dynamic schemas
  const [pageTitle, setPageTitle] = useState('');
  const [schemas, setSchemas] = useState<PageCustomSchema[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Reset initialization when pageId changes
  useEffect(() => {
    setIsInitialized(false);
  }, [pageId]);

  // Sync state when page loads
  useEffect(() => {
    if (activePage && !isInitialized) {
      setPageTitle(
        activePage.title ||
          (activePage.data?.title as string) ||
          'Untitled Page',
      );

      const existingSchemas =
        (activePage.data?._schemas as PageCustomSchema[]) ||
        (activePage.schemas as unknown as PageCustomSchema[]) ||
        [];

      if (existingSchemas.length > 0) {
        setSchemas(existingSchemas);
      } else {
        // Initialize default structured sections if brand new page from API
        const starterSchemas: PageCustomSchema[] = [
          {
            id: 'hero-section',
            name: 'Hero Banner',
            slug: 'hero-banner',
            entryType: 'single',
            fields: [
              {
                apiId: 'headline',
                displayName: 'Main Headline',
                dataType: 'text',
              },
              {
                apiId: 'subheading',
                displayName: 'Subheading Copy',
                dataType: 'textarea',
              },
              {
                apiId: 'cover_image',
                displayName: 'Background Cover Visual',
                dataType: 'media',
              },
            ],
            values: {
              headline:
                activePage.title || 'Next-Gen Enterprise Headless Engine',
              subheading:
                'Scale publishing velocity across global edge regions.',
              cover_image: '',
            },
          },
          {
            id: 'feature-grid-section',
            name: 'Feature Cards Grid',
            slug: 'feature-cards-grid',
            entryType: 'multi',
            fields: [
              {
                apiId: 'card_title',
                displayName: 'Card Title',
                dataType: 'text',
              },
              {
                apiId: 'card_desc',
                displayName: 'Description',
                dataType: 'textarea',
              },
              {
                apiId: 'card_link',
                displayName: 'Action Link',
                dataType: 'url',
              },
            ],
            values: {
              section_title: 'Why Modern Teams Switch to Us',
            },
            items: [
              {
                card_title: 'Fast Deployment',
                card_desc:
                  'Push updates to global edge nodes with instant cache invalidation.',
                card_link: '/features/deployment',
              },
              {
                card_title: 'Hardware Security',
                card_desc:
                  'Zero-trust cryptographic key rotation and automated MFA policies.',
                card_link: '/features/security',
              },
            ],
          },
        ];
        setSchemas(starterSchemas);
      }
      setIsInitialized(true);
    }
  }, [activePage, isInitialized]);

  // Discover effective field definitions for multi-entry items
  const getEffectiveFields = (
    s: PageCustomSchema,
  ): DynamicFieldDefinition[] => {
    if (Array.isArray(s.fields) && s.fields.length > 0) {
      return s.fields;
    }
    if (Array.isArray(s.items) && s.items.length > 0) {
      const discoveredKeys = Array.from(
        new Set(
          s.items.flatMap((it) =>
            it && typeof it === 'object' ? Object.keys(it) : [],
          ),
        ),
      ).filter((k) => !['_id', 'id', 'created_at', 'updated_at'].includes(k));

      if (discoveredKeys.length > 0) {
        return discoveredKeys.map((k) => ({
          apiId: k,
          displayName:
            k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '),
          dataType: (k.includes('desc') ||
          k.includes('body') ||
          k.includes('content')
            ? 'textarea'
            : k.includes('image') ||
                k.includes('photo') ||
                k.includes('media') ||
                k.includes('cover')
              ? 'media'
              : k.includes('link') || k.includes('url')
                ? 'url'
                : 'text') as DynamicFieldDataType,
        }));
      }
    }
    return [
      {
        apiId: 'title',
        displayName: 'Card Title',
        dataType: 'text',
        isRequired: true,
      },
      {
        apiId: 'description',
        displayName: 'Description',
        dataType: 'textarea',
      },
      { apiId: 'link', displayName: 'Target Link', dataType: 'url' },
    ];
  };

  // Safe read from multi-entry card item
  const getCardFieldValue = (
    item: Record<string, unknown>,
    fieldId: string,
  ): unknown => {
    if (!item) return '';
    if (item[fieldId] !== undefined) return item[fieldId];
    if (fieldId === 'title') return item['card_title'] ?? item['name'] ?? '';
    if (fieldId === 'card_title') return item['title'] ?? item['name'] ?? '';
    if (fieldId === 'description')
      return item['card_desc'] ?? item['desc'] ?? item['content'] ?? '';
    if (fieldId === 'card_desc')
      return item['description'] ?? item['desc'] ?? '';
    if (fieldId === 'link') return item['card_link'] ?? item['url'] ?? '';
    if (fieldId === 'card_link') return item['link'] ?? item['url'] ?? '';
    return '';
  };

  // Handle single-entry field update
  const handleSingleFieldValueChange = (
    schemaId: string,
    fieldApiId: string,
    value: unknown,
  ) => {
    setSchemas((prev) =>
      prev.map((s) => {
        if (s.id !== schemaId) return s;
        return {
          ...s,
          values: {
            ...(s.values || {}),
            [fieldApiId]: value,
          },
        };
      }),
    );
  };

  // Handle section title change for multi-entry schema
  const handleSectionTitleChange = (schemaId: string, val: string) => {
    setSchemas((prev) =>
      prev.map((s) => {
        if (s.id !== schemaId) return s;
        return {
          ...s,
          name: val || s.name,
          values: {
            ...(s.values || {}),
            section_title: val,
            title: val,
          },
        };
      }),
    );
  };

  // Handle multi-entry item field update
  const handleMultiItemFieldChange = (
    schemaId: string,
    itemIndex: number,
    fieldApiId: string,
    value: unknown,
  ) => {
    setSchemas((prev) =>
      prev.map((s) => {
        if (s.id !== schemaId) return s;
        const currentItems = [...(s.items || [])];
        const current = { ...(currentItems[itemIndex] || {}) };
        current[fieldApiId] = value;

        // Synchronize common alias keys
        if (fieldApiId === 'title') current['card_title'] = value;
        if (fieldApiId === 'card_title') current['title'] = value;
        if (fieldApiId === 'description') current['card_desc'] = value;
        if (fieldApiId === 'card_desc') current['description'] = value;
        if (fieldApiId === 'link') current['card_link'] = value;
        if (fieldApiId === 'card_link') current['link'] = value;

        currentItems[itemIndex] = current;
        return {
          ...s,
          items: currentItems,
        };
      }),
    );
  };

  // Add new card to multi-entry section
  const handleAddCard = (schemaId: string) => {
    setSchemas((prev) =>
      prev.map((s) => {
        if (s.id !== schemaId) return s;
        const currentItems = [...(s.items || [])];
        const fields = getEffectiveFields(s);
        const newCard: Record<string, unknown> = {};
        for (const f of fields) {
          newCard[f.apiId] = f.dataType === 'boolean' ? false : '';
        }
        const nextNum = currentItems.length + 1;
        newCard.title = `Card #${nextNum}`;
        newCard.card_title = `Card #${nextNum}`;
        currentItems.push(newCard);
        setExpandedCards((exp) => ({
          ...exp,
          [schemaId]: currentItems.length - 1,
        }));
        return {
          ...s,
          items: currentItems,
        };
      }),
    );
  };

  // Delete card from multi-entry section
  const handleDeleteCard = (schemaId: string, itemIndex: number) => {
    setSchemas((prev) =>
      prev.map((s) => {
        if (s.id !== schemaId) return s;
        const currentItems = (s.items || []).filter(
          (_, idx) => idx !== itemIndex,
        );
        return {
          ...s,
          items: currentItems,
        };
      }),
    );
    setExpandedCards((exp) => ({ ...exp, [schemaId]: null }));
  };

  // Toggle inline card expansion
  const toggleCardExpansion = (schemaId: string, itemIndex: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [schemaId]: prev[schemaId] === itemIndex ? null : itemIndex,
    }));
  };

  // Save / Publish Mutation
  const saveMutation = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      const pageData = (activePage?.data as Record<string, unknown>) || {};
      const currentSlug = activePage?.slug || 'page';
      const normSlug = currentSlug.startsWith('/')
        ? currentSlug
        : `/${currentSlug}`;

      const allStarters = [
        ...GENERAL_STARTER_PAGES,
        ...ECOMMERCE_STARTER_PAGES,
      ];
      const starterMatch = allStarters.find(
        (sp) =>
          sp.slug === normSlug ||
          (normSlug === '/' &&
            (sp.key === 'home' || sp.key === 'store_home')) ||
          sp.key === currentSlug,
      );

      const existingBody = pageData.body;
      const resolvedBody =
        existingBody &&
        typeof existingBody === 'object' &&
        (existingBody as { html?: string }).html
          ? existingBody
          : starterMatch?.body || existingBody;

      const updatedData = {
        ...pageData,
        title: pageTitle,
        slug: currentSlug,
        _schemas: schemas,
        ...(resolvedBody ? { body: resolvedBody } : {}),
      };

      const res = await postsApi.updateEntry(siteId, pageId, updatedData);
      if (publish) {
        await postsApi.publishEntry(siteId, pageId);
      }
      return res;
    },
    onSuccess: (_, { publish }) => {
      queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pages', siteId] });
      queryClient.invalidateQueries({ queryKey: ['page', siteId, pageId] });
      queryClient.invalidateQueries({
        queryKey: ['site-preview-entries', siteId],
      });
      toast.show({
        title: publish ? 'Page Published Live!' : 'Changes Saved',
        message: publish
          ? `All section updates for "${pageTitle}" are now live.`
          : 'Content drafts saved successfully.',
        type: 'success',
      });
    },
    onError: () => {
      toast.show({
        title: 'Error',
        message: 'Failed to save section content updates.',
        type: 'error',
      });
    },
  });

  // Revert / Rollback Success Handler
  const handleRevertSuccess = (revertedData: Record<string, unknown>) => {
    const restoredPage = {
      data: revertedData,
      title: revertedData.title as string | undefined,
    } as Pick<PageEntry, 'data' | 'title'>;
    const restoredSchemas = Array.isArray(revertedData._schemas)
      ? (revertedData._schemas as PageCustomSchema[])
      : [];
    if (restoredSchemas.length > 0) {
      setSchemas(restoredSchemas);
    }
    const restoredTitle =
      restoredPage.title || (restoredPage.data?.title as string) || '';
    if (restoredTitle) {
      setPageTitle(restoredTitle);
    }
    queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
    toast.show({
      title: 'Version Restored',
      message: 'Successfully restored the selected version.',
      type: 'success',
    });
  };

  const pageSlug = activePage?.slug
    ? activePage.slug.startsWith('/')
      ? activePage.slug
      : `/${activePage.slug}`
    : '/';

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* SCREEN 6: TOP ACTION BAR */}
      <header className="px-6 py-3.5 border-b border-border bg-card/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to={`/sites/${siteId}/posts`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Posts</span>
          </Link>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Posting to:</span>
            <span className="text-xs font-bold text-foreground">
              {pageTitle}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {pageSlug}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Version History & Rollback Button */}
          <button
            type="button"
            onClick={() => setIsVersionHistoryOpen(true)}
            className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
            title="View snapshots and roll back to previous versions"
          >
            <Clock size={13} />
            <span>Version History</span>
          </button>

          <a
            href={`/sites/${siteId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
          >
            <Eye size={13} />
            <span>Live Preview ↗</span>
          </a>

          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({ publish: false })}
            className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
          >
            <span>Save Draft</span>
          </button>

          {canPublish && (
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate({ publish: true })}
              className={`${CMS_THEME_CLASSES.buttons.primary} text-xs shadow-xs`}
            >
              {saveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              <span>Publish Updates</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN SCREEN 6 SPLIT: LEFT OUTLINE RAIL & CENTER CANVAS */}
      <div className="flex-1 overflow-hidden flex">
        {/* LEFT RAIL: PAGE OUTLINE */}
        <aside className="w-64 shrink-0 border-r border-border bg-card/30 p-5 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Active Sections ({schemas.length})
            </h2>
            <div className="space-y-2">
              {schemas.map((sec, idx) => (
                <a
                  key={sec.id}
                  href={`#sec-${sec.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors group text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground">⠿</span>
                    <span className="font-medium text-foreground truncate">
                      {idx + 1}. {sec.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 font-mono">
                    {sec.entryType === 'multi'
                      ? `${sec.items?.length || 0} items`
                      : 'Single'}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className={CMS_THEME_CLASSES.badges.live}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>URL Route:</span>
              <span className="font-mono text-[11px] text-foreground">
                {pageSlug}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Layout Block:</span>
              <span className="text-foreground">Corporate Base</span>
            </div>
          </div>
        </aside>

        {/* CENTER: PAGE SECTIONS CANVAS (Warm Sand White #FDFBF7) */}
        <main
          className={`flex-1 min-w-0 overflow-y-auto p-10 ${CMS_THEME_CLASSES.canvas.warmSand}`}
        >
          <div className="max-w-5xl mx-auto space-y-8">
            {schemas.map((schema, secIdx) => {
              const isMulti = schema.entryType === 'multi';
              const cardFields = getEffectiveFields(schema);
              const sectionTitle =
                ((schema.values || {})['section_title'] as string) ||
                ((schema.values || {})['title'] as string) ||
                schema.name ||
                '';

              return (
                <section
                  key={schema.id}
                  id={`sec-${schema.id}`}
                  className="rounded-2xl border border-stone-300/80 bg-white shadow-sm overflow-hidden text-stone-900"
                >
                  {/* Section Title Banner */}
                  <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        ▼ SECTION {secIdx + 1}: {schema.name.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          isMulti
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isMulti ? 'Multi-Entry Schema' : 'Single-Entry Schema'}
                      </span>
                    </div>
                  </div>

                  {/* Section Fields Body */}
                  <div className="p-6 space-y-5">
                    {/* SINGLE ENTRY SCHEMA RENDERING */}
                    {!isMulti && (
                      <>
                        {cardFields.map((field) => {
                          const val = (schema.values || {})[field.apiId];

                          return (
                            <div key={field.apiId} className="space-y-1.5">
                              <label className="block text-xs font-semibold text-stone-700">
                                {fieldLabel(field)}
                              </label>

                              {field.dataType === 'textarea' ? (
                                <textarea
                                  rows={3}
                                  value={toInputValue(val)}
                                  onChange={(e) =>
                                    handleSingleFieldValueChange(
                                      schema.id,
                                      field.apiId,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-xs p-3 rounded-lg border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              ) : field.dataType === 'media' ? (
                                <SchemaMediaField
                                  tone="light"
                                  value={toInputValue(val)}
                                  fieldApiId={field.apiId}
                                  fieldDisplayName={fieldLabel(field)}
                                  onChange={(newUrl) =>
                                    handleSingleFieldValueChange(
                                      schema.id,
                                      field.apiId,
                                      newUrl,
                                    )
                                  }
                                  onOpenMediaPicker={() =>
                                    setActiveMediaPickerField({
                                      schemaId: schema.id,
                                      fieldApiId: field.apiId,
                                    })
                                  }
                                />
                              ) : isRichTextField(field.dataType) ? (
                                <SchemaRichTextEditor
                                  variant="field"
                                  value={toInputValue(val)}
                                  fieldApiId={field.apiId}
                                  fieldDisplayName={fieldLabel(field)}
                                  onChange={(newHtml) =>
                                    handleSingleFieldValueChange(
                                      schema.id,
                                      field.apiId,
                                      newHtml,
                                    )
                                  }
                                />
                              ) : (
                                <input
                                  type={
                                    field.dataType === 'number'
                                      ? 'number'
                                      : 'text'
                                  }
                                  value={toInputValue(val)}
                                  onChange={(e) =>
                                    handleSingleFieldValueChange(
                                      schema.id,
                                      field.apiId,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* MULTI ENTRY SCHEMA RENDERING */}
                    {isMulti && (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor={`section-title-${schema.id}`}
                            className="block text-xs font-semibold text-stone-700 mb-1"
                          >
                            Section Title
                          </label>
                          <input
                            id={`section-title-${schema.id}`}
                            type="text"
                            value={sectionTitle}
                            onChange={(e) =>
                              handleSectionTitleChange(
                                schema.id,
                                e.target.value,
                              )
                            }
                            placeholder="Enter headline for this section..."
                            className="w-full text-xs px-3 py-2.5 rounded-lg border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-stone-700 mb-2">
                            Cards in this Section: (Drag ⠿ to reorder)
                          </p>

                          <div className="space-y-3">
                            {(schema.items || []).map((cardItem, cardIdx) => {
                              const isCardExpanded =
                                expandedCards[schema.id] === cardIdx;
                              const cardTitle =
                                (cardItem['title'] as string) ||
                                (cardItem['card_title'] as string) ||
                                (cardItem['name'] as string) ||
                                `Card #${cardIdx + 1}`;

                              return (
                                <div
                                  key={cardIdx}
                                  className="rounded-xl border border-stone-300 bg-stone-50/40 overflow-hidden shadow-xs transition-all"
                                >
                                  {/* Card Row Header */}
                                  <div className="flex items-center justify-between p-3 bg-stone-100/70 border-b border-stone-200">
                                    <div className="flex items-center gap-2.5">
                                      <GripVertical
                                        size={15}
                                        className="text-stone-400 cursor-grab"
                                      />
                                      <span className="text-xs font-bold text-stone-800">
                                        Card {cardIdx + 1}: &ldquo;{cardTitle}
                                        &rdquo;
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleCardExpansion(
                                            schema.id,
                                            cardIdx,
                                          )
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-700 hover:bg-stone-200 transition-colors"
                                      >
                                        {isCardExpanded ? (
                                          <>
                                            <ChevronUp size={13} />
                                            <span>Collapse Card</span>
                                          </>
                                        ) : (
                                          <>
                                            <Edit2 size={13} />
                                            <span>Edit Card</span>
                                          </>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteCard(schema.id, cardIdx)
                                        }
                                        className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        title="Delete card"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Expanded Card Sub-Form with Dynamic Field Definitions */}
                                  {isCardExpanded && (
                                    <div className="p-4 bg-white space-y-3.5 animate-in fade-in duration-150">
                                      {cardFields.map((field) => {
                                        const val = getCardFieldValue(
                                          cardItem,
                                          field.apiId,
                                        );

                                        return (
                                          <div key={field.apiId}>
                                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                              {fieldLabel(field)}
                                            </label>

                                            {field.dataType === 'textarea' ? (
                                              <textarea
                                                rows={2}
                                                value={toInputValue(val)}
                                                onChange={(e) =>
                                                  handleMultiItemFieldChange(
                                                    schema.id,
                                                    cardIdx,
                                                    field.apiId,
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full text-xs p-2.5 rounded-md border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              />
                                            ) : field.dataType === 'media' ? (
                                              <SchemaMediaField
                                                tone="light"
                                                value={toInputValue(val)}
                                                fieldApiId={field.apiId}
                                                fieldDisplayName={fieldLabel(
                                                  field,
                                                )}
                                                onChange={(url) =>
                                                  handleMultiItemFieldChange(
                                                    schema.id,
                                                    cardIdx,
                                                    field.apiId,
                                                    url,
                                                  )
                                                }
                                                onOpenMediaPicker={() =>
                                                  setActiveMediaPickerField({
                                                    schemaId: schema.id,
                                                    fieldApiId: field.apiId,
                                                    itemIndex: cardIdx,
                                                  })
                                                }
                                              />
                                            ) : isRichTextField(
                                                field.dataType,
                                              ) ? (
                                              <SchemaRichTextEditor
                                                variant="field"
                                                value={toInputValue(val)}
                                                fieldApiId={field.apiId}
                                                fieldDisplayName={fieldLabel(
                                                  field,
                                                )}
                                                onChange={(newHtml) =>
                                                  handleMultiItemFieldChange(
                                                    schema.id,
                                                    cardIdx,
                                                    field.apiId,
                                                    newHtml,
                                                  )
                                                }
                                              />
                                            ) : field.dataType === 'boolean' ? (
                                              <div className="flex items-center gap-2 pt-1">
                                                <input
                                                  type="checkbox"
                                                  checked={Boolean(val)}
                                                  onChange={(e) =>
                                                    handleMultiItemFieldChange(
                                                      schema.id,
                                                      cardIdx,
                                                      field.apiId,
                                                      e.target.checked,
                                                    )
                                                  }
                                                  className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-xs text-stone-600 font-medium">
                                                  Enabled
                                                </span>
                                              </div>
                                            ) : (
                                              <input
                                                type={
                                                  field.dataType === 'number'
                                                    ? 'number'
                                                    : 'text'
                                                }
                                                value={toInputValue(val)}
                                                onChange={(e) =>
                                                  handleMultiItemFieldChange(
                                                    schema.id,
                                                    cardIdx,
                                                    field.apiId,
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full text-xs px-3 py-2 rounded-md border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddCard(schema.id)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors"
                          >
                            <Plus size={13} />
                            <span>+ Add New Card to Grid</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>

      {/* Version History & Rollback Drawer */}
      {isVersionHistoryOpen && siteId && pageId && (
        <VersionHistoryDrawer
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          schemaSlug={siteId}
          pageId={pageId}
          currentPageData={{
            ...((activePage?.data as Record<string, unknown>) || {}),
            title: pageTitle,
            slug: activePage?.slug || 'page',
            _schemas: schemas,
          }}
          onRevertSuccess={handleRevertSuccess}
        />
      )}

      {/* Central Media Asset Picker Modal */}
      {activeMediaPickerField && (
        <MediaAssetPickerModal
          isOpen={Boolean(activeMediaPickerField)}
          onClose={() => setActiveMediaPickerField(null)}
          onSelect={(asset) => {
            if (activeMediaPickerField) {
              const { schemaId, fieldApiId, itemIndex } =
                activeMediaPickerField;
              if (typeof itemIndex === 'number') {
                handleMultiItemFieldChange(
                  schemaId,
                  itemIndex,
                  fieldApiId,
                  asset.url,
                );
              } else {
                handleSingleFieldValueChange(schemaId, fieldApiId, asset.url);
              }
              setActiveMediaPickerField(null);
            }
          }}
        />
      )}
    </div>
  );
};
