import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
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
import { OptimizedImage } from '@/components/ui/OptimizedImage/OptimizedImage';

export function PagePreviewPage() {
  const { schemaSlug, slug } = useParams<{
    schemaSlug: string;
    slug?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramEntryId = searchParams.get('entryId');
  const returnTo = searchParams.get('returnTo');

  const [device, setDevice] = useState<PreviewDeviceType>('desktop');

  // Fetch all entries for this collection for instant page & post switching
  const entriesQuery = useQuery({
    queryKey: ['collection-preview-entries', schemaSlug],
    queryFn: ({ signal }) =>
      collectionsApi.listPages(schemaSlug!, { pageSize: 50 }, { signal }),
    enabled: !!schemaSlug,
  });

  const allEntries: PageEntry[] = useMemo(
    () => entriesQuery.data?.data || [],
    [entriesQuery.data?.data],
  );
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
    queryFn: async ({ signal }) => {
      if (!schemaSlug || !slug) return null;
      try {
        return await collectionsApi.getPageBySlug(schemaSlug, slug, { signal });
      } catch {
        if (paramEntryId) {
          try {
            return await collectionsApi.getPage(schemaSlug, paramEntryId, {
              signal,
            });
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

  // Unified list of all content items across top-level collection entries and multi-entry schemas
  const allContentItems = useMemo<PageEntry[]>(() => {
    const items: PageEntry[] = [];
    const seenIds = new Set<string>();

    // 1. Extract multi-entry schema items from all pages in this collection
    for (const entry of allEntries) {
      const entryData = (entry.data as Record<string, unknown>) || entry || {};
      const rawSchemas = Array.isArray(entryData._schemas)
        ? entryData._schemas
        : [];
      for (const s of rawSchemas as Array<{
        slug?: string;
        entryType?: string;
        items?: Array<Record<string, unknown>>;
        values?: Record<string, unknown>;
      }>) {
        if (s && s.entryType === 'multi' && Array.isArray(s.items)) {
          s.items.forEach((item, idx) => {
            const itemId = (item.id as string) || `item_${idx + 1}`;
            const itemSlug = (item.slug as string) || `item-${idx + 1}`;
            if (!seenIds.has(itemId)) {
              seenIds.add(itemId);
              items.push({
                id: itemId,
                schemaId: schemaSlug || '',
                status: 'published',
                createdAt:
                  (item.data as string) ||
                  (item.createdAt as string) ||
                  entry.createdAt,
                updatedAt:
                  (item.data as string) ||
                  (item.updatedAt as string) ||
                  entry.updatedAt,
                data: {
                  ...item,
                  title: (item.title ||
                    item.name ||
                    `Article ${idx + 1}`) as string,
                  slug: itemSlug,
                  author: item.author || 'Author',
                  excerpt: item.excerpt || '',
                  body:
                    typeof item.content === 'string'
                      ? { html: item.content, builder: 'grapesjs' }
                      : (item.body as Record<string, unknown>) ||
                        (item.content ? { html: String(item.content) } : {}),
                  content: item.content,
                  image: item.cover_image_url || item.image,
                  cover_image_url: item.cover_image_url || item.image,
                  _schemas: [{ ...s, items: [item], values: item }],
                },
              } as unknown as PageEntry);
            }
          });
        }
      }
    }

    // 2. Include collection entries
    for (const entry of allEntries) {
      if (!seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        items.push(entry);
      }
    }

    return items;
  }, [allEntries, schemaSlug]);

  // Active entry ID for dynamic slot hydration
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    paramEntryId || '',
  );

  useEffect(() => {
    if (paramEntryId) {
      setSelectedEntryId(paramEntryId);
    } else if (allContentItems.length > 0) {
      const matchingContent = currentUrlEntry?.id
        ? allContentItems.find((e) => e.id === currentUrlEntry.id)
        : null;
      setSelectedEntryId(matchingContent?.id || allContentItems[0]?.id || '');
    }
  }, [slug, paramEntryId, allContentItems, currentUrlEntry]);

  // Active post/entry for dynamic slot hydration
  const activeEntry: PageEntry | null =
    allContentItems.find((e) => e.id === selectedEntryId) ||
    allContentItems.find((e) => e.data?.slug === selectedEntryId) ||
    (paramEntryId
      ? allContentItems.find(
          (e) =>
            e.id === paramEntryId ||
            e.data?.slug === paramEntryId ||
            e.data?.slug === `/${paramEntryId}`,
        )
      : null) ||
    allContentItems[0] ||
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

  // Listen to messages from isolated preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CMS_ENTRY_SELECT' && event.data.entryId) {
        setSelectedEntryId(event.data.entryId);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('entryId', event.data.entryId);
          return next;
        });
      } else if (event.data?.type === 'CMS_VIEW_POST') {
        const { entryId, slug: itemSlug, href } = event.data;
        let rawHref = (href || '').replace(/^\/+/, '');
        if (rawHref.startsWith(`collections/${schemaSlug}/preview/`)) {
          rawHref = rawHref.replace(`collections/${schemaSlug}/preview/`, '');
        }
        const hrefParts = rawHref.split('/');
        const candidateSlug = hrefParts[hrefParts.length - 1];

        // 1. Direct layout page navigation (e.g. Back to Index link)
        const targetLayoutPage = selectablePages.find(
          (p) =>
            (p.data?.slug &&
              p.data.slug.replace(/^\/+/, '') === candidateSlug) ||
            p.id === candidateSlug,
        );

        if (targetLayoutPage && !entryId && !itemSlug) {
          const pageSlug = (
            targetLayoutPage.data?.slug || targetLayoutPage.id
          ).replace(/^\/+/, '');
          if (pageSlug !== cleanSlug) {
            navigate(`/collections/${schemaSlug}/preview/${pageSlug}`);
          }
          return;
        }

        // 2. Resolve content post entry from allContentItems
        const found =
          allContentItems.find(
            (e) =>
              (entryId && e.id === entryId) ||
              (itemSlug &&
                (e.id === itemSlug ||
                  e.data?.slug === itemSlug ||
                  e.data?.slug === `/${itemSlug}` ||
                  e.data?.slug?.replace(/^\/+/, '') === itemSlug)) ||
              (candidateSlug &&
                candidateSlug !== '{{slug}}' &&
                (e.id === candidateSlug ||
                  e.data?.slug === candidateSlug ||
                  e.data?.slug === `/${candidateSlug}` ||
                  e.data?.slug?.replace(/^\/+/, '') === candidateSlug)),
          ) ||
          (event.data?.itemIndex !== null &&
            event.data?.itemIndex !== undefined &&
            allContentItems[Number(event.data.itemIndex)]) ||
          (allContentItems.length > 0 ? allContentItems[0] : null);

        if (found) {
          // Look for an article/detail layout page in the collection (e.g. blog-content-page)
          const detailLayout =
            selectablePages.find((p) => {
              const pSlug = (p.data?.slug || p.id || '').toLowerCase();
              return (
                p.id !== activePageEntry?.id &&
                (pSlug.includes('content') ||
                  pSlug.includes('detail') ||
                  pSlug.includes('post') ||
                  pSlug.includes('article') ||
                  pSlug.includes('single') ||
                  pSlug.includes('reader'))
              );
            }) || selectablePages.find((p) => p.id !== activePageEntry?.id);

          if (detailLayout) {
            const targetPageSlug = (
              detailLayout.data?.slug || detailLayout.id
            ).replace(/^\/+/, '');
            navigate(
              `/collections/${schemaSlug}/preview/${targetPageSlug}?entryId=${found.id}&returnTo=${cleanSlug || 'index-page'}`,
            );
          } else {
            setSelectedEntryId(found.id);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('entryId', found.id);
              return next;
            });
          }
        }
      } else if (event.data?.type === 'CMS_NAVIGATE' && event.data.href) {
        const href = event.data.href as string;
        let targetSlug = '';
        if (href.startsWith(`/collections/${schemaSlug}/preview/`)) {
          targetSlug = href
            .replace(`/collections/${schemaSlug}/preview/`, '')
            .replace(/^\/+/, '');
        } else if (href.startsWith('/')) {
          targetSlug = href.replace(/^\/+/, '');
        }

        // Check if targetSlug is an entry
        const found = allContentItems.find(
          (e) =>
            e.id === targetSlug ||
            e.data?.slug === targetSlug ||
            e.data?.slug === `/${targetSlug}` ||
            e.data?.slug?.replace(/^\/+/, '') === targetSlug,
        );

        if (found) {
          const detailLayout =
            selectablePages.find((p) => {
              const pSlug = (p.data?.slug || p.id || '').toLowerCase();
              return (
                p.id !== activePageEntry?.id &&
                (pSlug.includes('content') ||
                  pSlug.includes('detail') ||
                  pSlug.includes('post') ||
                  pSlug.includes('article') ||
                  pSlug.includes('single') ||
                  pSlug.includes('reader'))
              );
            }) || selectablePages.find((p) => p.id !== activePageEntry?.id);

          if (detailLayout) {
            const targetPageSlug = (
              detailLayout.data?.slug || detailLayout.id
            ).replace(/^\/+/, '');
            navigate(
              `/collections/${schemaSlug}/preview/${targetPageSlug}?entryId=${found.id}&returnTo=${cleanSlug || 'index-page'}`,
            );
            return;
          }
        }

        if (targetSlug && targetSlug !== cleanSlug) {
          navigate(`/collections/${schemaSlug}/preview/${targetSlug}`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    schemaSlug,
    cleanSlug,
    navigate,
    setSearchParams,
    allContentItems,
    selectablePages,
    activePageEntry,
  ]);

  // Safely generate isolated document for sandboxed preview iframe
  const previewSrcDoc = useMemo(() => {
    if (!hasGrapesJs || !bodyData?.html) return '';
    const sanitizedCss = DOMPurify.sanitize(bodyData.css || '');
    const hydratedHtml = hydrateHtmlTemplate(
      DOMPurify.sanitize(bodyData.html, {
        ADD_ATTR: [
          'data-cms-slot',
          'data-cms-section',
          'data-cms-repeat',
          'data-cms-collection',
          'data-cms-dropdown',
          'data-entry-id',
          'data-entry-slug',
          'data-cms-action',
          'data-cms-schema',
          'data-object-fit',
          'data-aspect-ratio',
          'data-max-height',
          'data-border-radius',
          'data-image-width',
          'data-object-position',
          'data-image-align',
        ],
      }),
      activeEntry as unknown as Record<string, unknown>,
      allContentItems as unknown as Array<Record<string, unknown>>,
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      overflow-x: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    img, video, iframe {
      max-width: 100% !important;
      height: auto;
    }
    img[data-object-fit="cover"],
    [data-cms-slot="cover_image_url"],
    [data-cms-slot="image"],
    .cms-post-card img,
    .hero-clean img {
      object-fit: cover;
    }
    /* Prevent images from breaking or stretching vertically on large screens */
    @media (min-width: 1200px) {
      img:not([style*="max-height"]) {
        max-height: 600px;
      }
      img[data-object-fit="cover"]:not([style*="max-height"]) {
        max-height: 550px;
      }
    }
    /* Ensure containers adapt to smaller viewports without overflowing */
    section, main, header, footer, [class*="container"] {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    /* Responsive grid wrapping guarantee for tablet and mobile frames */
    @media (max-width: 768px) {
      .cms-dynamic-feed, [data-cms-repeat="true"] {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
        gap: 20px !important;
      }
      .gjs-row {
        flex-wrap: wrap !important;
      }
      .gjs-cell {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
    @media (max-width: 480px) {
      .cms-dynamic-feed, [data-cms-repeat="true"] {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }
      section {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      h1 {
        font-size: 26px !important;
        line-height: 1.25 !important;
      }
      h2 {
        font-size: 22px !important;
        line-height: 1.3 !important;
      }
    }
    ${sanitizedCss}
  </style>
</head>
<body style="margin: 0; padding: 0;">
  ${hydratedHtml}
  <script>
    document.addEventListener('click', function(e) {
      var actionTarget = e.target.closest('[data-cms-action="view-post"], a, button');
      var entryEl = e.target.closest('[data-entry-id], .cms-post-card, article');
      var clickedId = entryEl ? entryEl.getAttribute('data-entry-id') : null;
      var clickedSlug = entryEl ? entryEl.getAttribute('data-entry-slug') : null;
      var clickedIndex = entryEl ? entryEl.getAttribute('data-item-index') : null;

      if (actionTarget) {
        var href = actionTarget.getAttribute('href');
        var action = actionTarget.getAttribute('data-cms-action');
        var actionSlug = actionTarget.getAttribute('data-entry-slug');

        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'CMS_VIEW_POST',
          entryId: clickedId,
          slug: actionSlug || clickedSlug,
          itemIndex: clickedIndex,
          href: href
        }, '*');
        return;
      }

      if (entryEl && (clickedId || clickedIndex !== null)) {
        window.parent.postMessage({
          type: 'CMS_VIEW_POST',
          entryId: clickedId,
          slug: clickedSlug,
          itemIndex: clickedIndex,
          href: ''
        }, '*');
      }
    });

    document.addEventListener('change', function(e) {
      var target = e.target;
      if (target && target.matches('select[data-cms-dropdown], [data-cms-selector]')) {
        if (target.value) {
          window.parent.postMessage({ type: 'CMS_ENTRY_SELECT', entryId: target.value }, '*');
        }
      }
    });

    document.querySelectorAll('[contenteditable]').forEach(function(el) {
      el.removeAttribute('contenteditable');
    });
  </script>
</body>
</html>`;
  }, [
    hasGrapesJs,
    bodyData?.html,
    bodyData?.css,
    activeEntry,
    allContentItems,
  ]);

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

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
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
      );
    }

    if (hasGrapesJs) {
      return (
        <iframe
          id="preview-iframe"
          title="Page Template Preview"
          className={
            device === 'desktop'
              ? 'w-full min-h-screen border-0 bg-white block'
              : 'w-full h-full border-0 bg-white block'
          }
          sandbox="allow-scripts allow-same-origin"
          srcDoc={previewSrcDoc}
        />
      );
    }

    if (hasCustomBuilder) {
      return (
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
      );
    }

    /* Universal reader article layout for standard posts */
    return (
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
              <OptimizedImage
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                width={1200}
                height={675}
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
              Want to customize the layout of this page with custom blocks?
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
    );
  };

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

          {returnTo && (
            <button
              onClick={() => {
                navigate(`/collections/${schemaSlug}/preview/${returnTo}`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
              title={`Return to ${returnTo}`}
            >
              <ArrowLeft className="size-3.5" />
              Back to {returnTo}
            </button>
          )}

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
          {allContentItems.length > 0 && (
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
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('entryId', newId);
                    return next;
                  });
                }}
                className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {allContentItems.map((e) => (
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

      {/* Main Canvas Area with Authentic Device Framing */}
      <div className="flex-1 flex justify-center bg-[#09090b] overflow-auto p-4 md:p-8 custom-scrollbar min-h-0">
        {device === 'mobile' ? (
          <div className="w-[410px] h-[844px] max-h-[calc(100vh-100px)] rounded-[48px] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl ring-1 ring-zinc-800/80 flex flex-col relative shrink-0 overflow-hidden my-auto transition-all duration-300">
            {/* Realistic iPhone Top Status Bar */}
            <div className="h-7 w-full bg-zinc-900 text-white flex items-center justify-between px-7 text-[11px] font-semibold shrink-0 select-none z-20">
              <span className="font-mono text-zinc-300">9:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-24 h-4 bg-zinc-950 rounded-full flex items-center justify-end pr-2.5 border border-zinc-800/60 shadow-inner">
                <div className="size-2 rounded-full bg-zinc-900 border border-zinc-800" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                <span className="font-bold text-[9px]">5G</span>
                <div className="w-4 h-2.5 border border-zinc-400 rounded-xs p-0.5 flex items-center">
                  <div className="h-full w-2.5 bg-zinc-300 rounded-2xs" />
                </div>
              </div>
            </div>
            {/* Mobile Viewport Screen (Exact 390px width) */}
            <div className="flex-1 w-full min-h-0 overflow-y-auto bg-white relative">
              {renderPreviewContent()}
            </div>
            {/* Home Indicator Bar */}
            <div className="h-4 w-full bg-zinc-900 flex items-center justify-center shrink-0 z-20">
              <div className="w-32 h-1 bg-zinc-500/70 rounded-full" />
            </div>
          </div>
        ) : device === 'tablet' ? (
          <div className="w-[792px] h-[1024px] max-h-[calc(100vh-100px)] rounded-[36px] border-[12px] border-zinc-900 bg-zinc-900 shadow-2xl ring-1 ring-zinc-800/80 flex flex-col relative shrink-0 overflow-hidden my-auto transition-all duration-300">
            {/* Tablet Camera Bezel Dot */}
            <div className="h-4 w-full bg-zinc-900 flex items-center justify-center shrink-0 select-none z-20">
              <div className="size-2 bg-zinc-950 rounded-full ring-1 ring-zinc-800" />
            </div>
            {/* Tablet Viewport Screen (Exact 768px width) */}
            <div className="flex-1 w-full min-h-0 overflow-y-auto bg-white relative">
              {renderPreviewContent()}
            </div>
            <div className="h-2 w-full bg-zinc-900 shrink-0" />
          </div>
        ) : (
          <div className="w-full min-h-full bg-white text-zinc-900 flex flex-col shadow-none border-0 rounded-none transition-all duration-300">
            {renderPreviewContent()}
          </div>
        )}
      </div>
    </div>
  );
}
