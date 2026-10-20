import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Boxes,
  LayoutTemplate,
  Loader2,
} from 'lucide-react';

import { collectionsApi, PageEntry } from '../api/collections.api';
import { hydrateHtmlTemplate } from '../utils/hydration.util';
import type { PreviewDeviceType } from '../types/collections.types';
import { DEFAULT_PRODUCT_FALLBACK_IMAGE } from '../constants/collections.constants';

const CustomBuilderPreview = lazy(
  () => import('../components/CustomBuilderPreview'),
);
import DOMPurify from 'dompurify';
import { usePageBuilderStore } from '../components/page-builder/stores/pageBuilderStore';

export function PagePreviewPage() {
  const { schemaSlug, slug } = useParams<{
    schemaSlug: string;
    slug?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramEntryId = searchParams.get('entryId');

  const [device, setDevice] = useState<PreviewDeviceType>('desktop');

  // Fetch all entries for this collection for instant page & post switching
  const entriesQuery = useQuery({
    queryKey: ['collection-preview-entries', schemaSlug],
    queryFn: () => collectionsApi.listPages(schemaSlug!, { pageSize: 50 }),
    enabled: !!schemaSlug,
  });

  const allEntries: PageEntry[] = entriesQuery.data?.data || [];
  const cleanSlug = (slug || '').replace(/^\/+/, '');

  // Instant local lookup from allEntries
  const entryFromAll = allEntries.find(
    (e) =>
      e.id === slug ||
      e.id === cleanSlug ||
      e.data?.slug === slug ||
      e.data?.slug === `/${cleanSlug}` ||
      e.data?.slug?.replace(/^\/+/, '') === cleanSlug,
  );

  // Fetch specific layout by slug if available (only if not already found in allEntries)
  const pageQuery = useQuery({
    queryKey: ['pageBySlug', schemaSlug, slug],
    queryFn: async () => {
      if (!schemaSlug || !slug) return null;
      try {
        return await collectionsApi.getPageBySlug(schemaSlug, slug);
      } catch {
        if (paramEntryId) {
          try {
            return await collectionsApi.getPage(schemaSlug, paramEntryId);
          } catch {
            return null;
          }
        }
        return null;
      }
    },
    enabled: !!schemaSlug && !!slug && !entryFromAll,
    retry: false,
  });

  const currentUrlEntry: PageEntry | null =
    entryFromAll || pageQuery.data || null;

  // Active entry ID for dynamic slot hydration
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    paramEntryId || '',
  );

  useEffect(() => {
    if (paramEntryId) {
      setSelectedEntryId(paramEntryId);
    } else if (!selectedEntryId && currentUrlEntry?.id) {
      setSelectedEntryId(currentUrlEntry.id);
    } else if (allEntries.length > 0 && !selectedEntryId && allEntries[0]?.id) {
      setSelectedEntryId(allEntries[0].id);
    }
  }, [paramEntryId, allEntries, selectedEntryId, currentUrlEntry]);

  // Active post/entry for dynamic slot hydration
  const activeEntry: PageEntry | null =
    allEntries.find((e) => e.id === selectedEntryId) ||
    (paramEntryId ? allEntries.find((e) => e.id === paramEntryId) : null) ||
    currentUrlEntry ||
    allEntries[0] ||
    null;

  // Filter distinct page layouts in collection
  const pageLayouts = allEntries.filter(
    (e) =>
      (e.data?.body as { builder?: string })?.builder === 'grapesjs' ||
      (Array.isArray(e.data?.body) && e.data.body.length > 0),
  );
  const selectablePages = pageLayouts.length > 0 ? pageLayouts : allEntries;
  const activePageEntry: PageEntry | null =
    currentUrlEntry || selectablePages[0] || allEntries[0] || null;

  (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__ = true;

  useEffect(() => {
    usePageBuilderStore.getState().resetStore();
    return () => {
      delete (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__;
    };
  }, [slug]);

  // Synchronously resolve layout body - eliminates stale state & eliminates loading flash
  const resolvedBody = (() => {
    // 1. Current URL entry GrapesJS body
    const urlBody = currentUrlEntry?.data?.body;
    if (
      urlBody &&
      typeof urlBody === 'object' &&
      (urlBody as { builder?: string }).builder === 'grapesjs'
    ) {
      return urlBody;
    }
    // 2. Query data GrapesJS body
    const queryBody = pageQuery.data?.data?.body;
    if (
      queryBody &&
      typeof queryBody === 'object' &&
      (queryBody as { builder?: string }).builder === 'grapesjs'
    ) {
      return queryBody;
    }
    // 3. Custom builder arrays
    if (Array.isArray(urlBody) && urlBody.length > 0) {
      return urlBody;
    }
    if (Array.isArray(queryBody) && queryBody.length > 0) {
      return queryBody;
    }
    // 4. Active post entry GrapesJS (if entry was created with GrapesJS)
    const activeBody = activeEntry?.data?.body;
    if (
      activeBody &&
      typeof activeBody === 'object' &&
      (activeBody as { builder?: string }).builder === 'grapesjs'
    ) {
      return activeBody;
    }
    // 5. Template layout from any page in the collection
    const templateWithGrapes = allEntries.find(
      (e) => (e.data?.body as { builder?: string })?.builder === 'grapesjs',
    );
    if (templateWithGrapes?.data?.body) {
      return templateWithGrapes.data.body;
    }
    return queryBody || urlBody || activeBody;
  })();

  const bodyData = resolvedBody as
    | {
        builder?: string;
        html?: string;
        css?: string;
      }
    | undefined;

  // Check if custom builder or GrapesJS is present
  const hasGrapesJs = bodyData?.builder === 'grapesjs' && !!bodyData.html;
  const hasCustomBuilder =
    Array.isArray(resolvedBody) && resolvedBody.length > 0;

  // Loading state: true if entries/pages are loading and we have no entry or body yet
  const isLoading =
    (entriesQuery.isLoading && allEntries.length === 0) ||
    (pageQuery.isLoading && !currentUrlEntry && !resolvedBody);

  useEffect(() => {
    const container = document.getElementById('preview-container');
    if (!container) return;

    const processElements = () => {
      const editableElements = container.querySelectorAll('[contenteditable]');
      editableElements.forEach((el) => {
        el.removeAttribute('contenteditable');
      });

      const links = container.querySelectorAll('a');
      links.forEach((a) => {
        const href = a.getAttribute('href');
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          !href.startsWith(`/collections/${schemaSlug}/preview/`)
        ) {
          const cleanTargetSlug = href.replace(/^\/+/, '');
          a.setAttribute('data-original-href', href);
          a.setAttribute(
            'href',
            `/collections/${schemaSlug}/preview/${cleanTargetSlug}`,
          );
        }
      });
    };

    processElements();
  }, [resolvedBody, schemaSlug, selectedEntryId]);

  const getDeviceWidthClass = () => {
    if (device === 'mobile')
      return 'max-w-[390px] shadow-2xl border-x border-zinc-700 my-4 rounded-3xl overflow-hidden bg-white text-zinc-900';
    if (device === 'tablet')
      return 'max-w-[768px] shadow-2xl border-x border-zinc-700 my-4 rounded-2xl overflow-hidden bg-white text-zinc-900';
    return 'w-full bg-white text-zinc-900 min-h-screen';
  };

  // Extract entry specs and attributes
  const entryData = (activeEntry?.data as Record<string, unknown>) || {};
  const bodyObj =
    typeof entryData.body === 'object' && entryData.body !== null
      ? (entryData.body as Record<string, unknown>)
      : {};

  const title = (entryData.title ||
    entryData.name ||
    activePageEntry?.data?.title ||
    'Universal Showcase Product') as string;
  const entrySlug = (entryData.slug || slug || 'item') as string;
  const descriptionHtml =
    typeof bodyObj.html === 'string'
      ? bodyObj.html
      : typeof bodyObj.description === 'string'
        ? `<p>${bodyObj.description}</p>`
        : typeof entryData.body_html === 'string'
          ? entryData.body_html
          : '';

  // Resolved cover image with fallback to standard showcase placeholder
  const imageUrl =
    (typeof bodyObj.image === 'string' && bodyObj.image) ||
    (Array.isArray(bodyObj.images) && bodyObj.images[0]) ||
    DEFAULT_PRODUCT_FALLBACK_IMAGE;

  const authorName = (entryData.author ||
    bodyObj.author ||
    (activeEntry?.updatedBy
      ? String(activeEntry.updatedBy).split('@')[0]
      : 'Author')) as string;
  const rawDate = activeEntry?.createdAt || entryData.createdAt;
  let formattedDate = 'Recent';
  if (rawDate) {
    try {
      formattedDate = new Date(rawDate as string).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      // Retain default formatted date if date parsing throws
    }
  }

  // Active page slug for the dropdown
  const currentActivePageSlug =
    cleanSlug ||
    (activePageEntry?.data?.slug || activePageEntry?.id || '').replace(
      /^\/+/,
      '',
    );

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100">
      {/* Top Preview Control Bar */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-[#121215]/95 backdrop-blur-md px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/posts')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Posts
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-200">
                {title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                /{schemaSlug}
                {slug ? `/${cleanSlug}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Device Viewport Controls */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded text-xs transition-colors ${
              device === 'desktop'
                ? 'bg-zinc-800 text-indigo-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Desktop View"
          >
            <Monitor className="size-4" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded text-xs transition-colors ${
              device === 'tablet'
                ? 'bg-zinc-800 text-indigo-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="size-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded text-xs transition-colors ${
              device === 'mobile'
                ? 'bg-zinc-800 text-indigo-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Mobile View (390px)"
          >
            <Smartphone className="size-4" />
          </button>
        </div>

        {/* Right: Page Switcher & Post Hydration Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Page Layout Switcher */}
          {selectablePages.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs shadow-inner">
              <LayoutTemplate className="size-3.5 text-indigo-400 shrink-0" />
              <span className="text-zinc-400 font-medium shrink-0">Page:</span>
              <select
                value={currentActivePageSlug}
                onChange={(e) => {
                  const targetSlug = e.target.value;
                  navigate(
                    `/collections/${schemaSlug}/preview/${targetSlug}${selectedEntryId ? `?entryId=${selectedEntryId}` : ''}`,
                  );
                }}
                className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {selectablePages.map((p) => {
                  const pSlug = (p.data.slug || p.id).replace(/^\/+/, '');
                  return (
                    <option
                      key={p.id}
                      value={pSlug}
                      className="bg-zinc-900 text-zinc-200"
                    >
                      {p.data.title || p.data.slug || 'Untitled Page'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* 2. Dynamic Post Entry Hydration Switcher */}
          {allEntries.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs shadow-inner">
              <Sparkles className="size-3.5 text-amber-400 shrink-0" />
              <span className="text-zinc-400 font-medium shrink-0">
                Hydrate:
              </span>
              <select
                value={selectedEntryId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedEntryId(newId);
                  setSearchParams({ entryId: newId });
                }}
                className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {allEntries.map((e) => (
                  <option
                    key={e.id}
                    value={e.id}
                    className="bg-zinc-900 text-zinc-200"
                  >
                    {e.data.title || e.data.slug || 'Untitled Entry'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeEntry && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-mono">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Linked
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex justify-center bg-[#09090b] overflow-x-hidden p-0 md:p-4">
        <div className={`transition-all duration-300 ${getDeviceWidthClass()}`}>
          {/* Skeleton view displayed while layout data loads */}
          {isLoading ? (
            <div className="w-full min-h-[700px] bg-[#0f0f13] text-zinc-400 p-8 flex flex-col gap-6 animate-pulse">
              {/* Header skeleton */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-zinc-800/80" />
                  <div className="h-5 w-32 rounded-lg bg-zinc-800/80" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-20 rounded bg-zinc-800/60" />
                  <div className="h-4 w-24 rounded bg-zinc-800/60" />
                </div>
              </div>

              {/* Hero Banner Skeleton */}
              <div className="w-full h-72 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-8 flex flex-col justify-center gap-4 relative overflow-hidden">
                <div className="h-8 w-2/3 rounded-xl bg-zinc-800/80" />
                <div className="h-4 w-1/2 rounded-lg bg-zinc-800/60" />
                <div className="h-4 w-1/3 rounded-lg bg-zinc-800/40" />
                <div className="flex gap-3 pt-4">
                  <div className="h-10 w-28 rounded-xl bg-indigo-600/30 border border-indigo-500/30" />
                  <div className="h-10 w-28 rounded-xl bg-zinc-800/60" />
                </div>
              </div>

              {/* 3 Column Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col gap-3"
                  >
                    <div className="aspect-video w-full rounded-xl bg-zinc-800/60" />
                    <div className="h-5 w-3/4 rounded bg-zinc-800/80" />
                    <div className="h-3 w-full rounded bg-zinc-800/40" />
                    <div className="h-3 w-2/3 rounded bg-zinc-800/40" />
                  </div>
                ))}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-2 pt-6 text-xs text-zinc-500">
                <Loader2 className="size-4 animate-spin text-indigo-400" />
                <span>Loading live preview layout...</span>
              </div>
            </div>
          ) : hasGrapesJs ? (
            // Renders dynamic GrapesJS HTML and hydrates slots/tokens
            <div
              id="preview-container"
              className="w-full min-h-screen bg-white text-zinc-900"
              onClick={(e) => {
                // 1. Check for card/entry click
                const target = (e.target as HTMLElement).closest(
                  '[data-entry-id]',
                );
                if (target) {
                  const clickedId = target.getAttribute('data-entry-id');
                  if (clickedId && clickedId !== selectedEntryId) {
                    setSelectedEntryId(clickedId);
                    setSearchParams({ entryId: clickedId });
                  }
                }

                // 2. Intercept internal page navigation links
                const linkTarget = (e.target as HTMLElement).closest('a');
                if (linkTarget) {
                  const href = linkTarget.getAttribute('href');
                  const targetAttr = linkTarget.getAttribute('target');

                  if (targetAttr === '_blank') {
                    if (href) {
                      e.preventDefault();
                      window.open(href, '_blank', 'noopener,noreferrer');
                    }
                    return;
                  }

                  if (
                    href &&
                    href.startsWith(`/collections/${schemaSlug}/preview/`)
                  ) {
                    e.preventDefault();
                    const targetSlug = href
                      .replace(`/collections/${schemaSlug}/preview/`, '')
                      .replace(/^\/+/, '');
                    if (targetSlug && targetSlug !== cleanSlug) {
                      navigate(
                        `/collections/${schemaSlug}/preview/${targetSlug}`,
                      );
                    }
                  }
                }
              }}
              onChange={(e) => {
                const target = e.target as HTMLSelectElement;
                if (
                  target &&
                  target.matches(
                    'select[data-cms-dropdown], [data-cms-selector]',
                  )
                ) {
                  const selectedId = target.value;
                  if (selectedId && selectedId !== selectedEntryId) {
                    setSelectedEntryId(selectedId);
                    setSearchParams({ entryId: selectedId });
                  }
                }
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(bodyData?.css || ''),
                }}
              />
              <div
                dangerouslySetInnerHTML={{
                  __html: hydrateHtmlTemplate(
                    DOMPurify.sanitize(bodyData?.html || '', {
                      ADD_ATTR: [
                        'data-cms-slot',
                        'data-cms-section',
                        'data-cms-repeat',
                        'data-cms-collection',
                        'data-cms-dropdown',
                        'data-entry-id',
                        'data-cms-action',
                      ],
                    }),
                    activeEntry as unknown as Record<string, unknown>,
                    allEntries as unknown as Array<Record<string, unknown>>,
                  ),
                }}
              />
            </div>
          ) : hasCustomBuilder ? (
            /* Custom reactive component layout preview */
            <div
              id="preview-container"
              className="flex-1 overflow-x-hidden min-h-screen bg-background text-foreground"
            >
              <Suspense
                fallback={
                  <div className="p-8 text-center text-zinc-500">
                    Loading custom layout...
                  </div>
                }
              >
                <CustomBuilderPreview
                  slug={slug || 'home'}
                  initialDesign={resolvedBody}
                  title={title}
                />
              </Suspense>
            </div>
          ) : (
            /* Universal reader article layout for standard posts */
            <div
              id="preview-container"
              className="w-full bg-white text-zinc-900 font-sans min-h-screen pb-16"
            >
              <article className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8 border-b border-zinc-200 pb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                      /{schemaSlug}/{entrySlug}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                      {String(activeEntry?.status || 'Published')}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight mb-4">
                    {title}
                  </h1>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                    <span>By {authorName}</span>
                    <span>•</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Featured Cover Image */}
                {imageUrl && (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 border border-zinc-200 bg-zinc-100 shadow-sm">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Body Content */}
                <div className="prose prose-zinc max-w-none text-zinc-800 leading-relaxed text-base">
                  {descriptionHtml ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(descriptionHtml),
                      }}
                    />
                  ) : (
                    <p className="text-zinc-500 italic">
                      No content body provided for this post.
                    </p>
                  )}
                </div>

                {/* Builder CTA */}
                <div className="mt-12 pt-6 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-zinc-500">
                    Want to customize the layout of this page with custom
                    blocks?
                  </div>
                  <button
                    onClick={() => navigate(`/collections/${schemaSlug}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    <Boxes className="size-3.5" />
                    Customize in Page Builder
                  </button>
                </div>
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
