import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Pencil,
  Download,
  XCircle,
} from 'lucide-react';
import { renderView } from './renderView';
import { useSiteInfo } from './useSiteInfo';
import { buildStaticSite, zipFiles } from './exportSite';
import { buildPreviewDocument } from './previewDocument';
import {
  buildSiteModel,
  fetchAllSiteEntries,
  resolvePath,
  type SitePage,
} from './siteModel';
import type {
  RenderDiagnostic,
  RenderMode,
  DeviceType as Device,
} from './types';
import { PREVIEW_DEVICE_WIDTH as DEVICE_WIDTH } from './constants';

const CustomBuilderPreview = lazy(
  () => import('@/features/collections/components/CustomBuilderPreview'),
);

const pageBase = (page: SitePage) => (page.slug === '/' ? '' : page.slug);

const LEVEL_STYLE: Record<
  RenderDiagnostic['level'],
  { icon: React.ReactNode; cls: string }
> = {
  error: { icon: <XCircle size={14} />, cls: 'text-rose-600' },
  warning: { icon: <AlertTriangle size={14} />, cls: 'text-amber-600' },
  info: { icon: <Info size={14} />, cls: 'text-sky-600' },
};

export const SitePreviewPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();

  const siteSlug = params.siteId ?? params.schemaSlug ?? '';
  const base = params.siteId
    ? `/sites/${siteSlug}/preview`
    : `/collections/${siteSlug}/preview`;
  const path = `/${params['*'] ?? ''}`;

  const mode: RenderMode = search.get('mode') === 'live' ? 'live' : 'draft';
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [showHealth, setShowHealth] = useState(false);

  const entriesQuery = useQuery({
    queryKey: ['site-preview-entries', siteSlug],
    queryFn: () => fetchAllSiteEntries(siteSlug),
    enabled: Boolean(siteSlug),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const model = useMemo(() => buildSiteModel(entries, mode), [entries, mode]);
  const resolved = useMemo(() => resolvePath(model, path), [model, path]);

  // If the page is missing in Live mode, check whether it exists as a draft
  const existsAsDraft = useMemo(() => {
    if (resolved || mode === 'draft') return false;
    return resolvePath(buildSiteModel(entries, 'draft'), path) !== null;
  }, [resolved, mode, entries, path]);

  const page = resolved?.page ?? null;

  // Check if current page has newer draft changes than the published version
  const hasUnpublishedDraftChanges = useMemo(() => {
    if (mode !== 'live' || !page) return false;
    const raw = page.raw;
    if (!raw) return false;
    if (raw.status === 'draft') return true;
    if (raw.publishedData && raw.data) {
      try {
        const pubJson = JSON.stringify(raw.publishedData);
        const curJson = JSON.stringify(raw.data);
        return pubJson !== curJson;
      } catch {
        return false;
      }
    }
    return false;
  }, [mode, page]);
  const site = useSiteInfo(siteSlug);
  const view = useMemo(
    () =>
      resolved
        ? renderView(model, resolved, {
            site,
            url: (p) => `${base}${p === '/' ? '' : p}`,
          })
        : null,
    [resolved, model, site, base],
  );
  const borrowedFrom = view?.borrowedFrom ?? null;
  const layout = view ? { html: view.html, css: view.css } : null;
  const item = view?.item ?? null;
  const rendered = view;
  const srcDoc = useMemo(
    () => (view ? buildPreviewDocument(view.html, view.css, view.head) : ''),
    [view],
  );

  const exportSite = useCallback(() => {
    // Always exports what visitors see: published pages and posts only
    const { files, skipped } = buildStaticSite(
      buildSiteModel(entries, 'live'),
      site,
    );
    if (files.length === 0) {
      window.alert(
        'Nothing to export yet. Publish at least one page that has a design.',
      );
      return;
    }
    const blob = new Blob([zipFiles(files) as BlobPart], {
      type: 'application/zip',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${siteSlug || 'site'}-export.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (skipped.length > 0) {
      window.alert(
        `Exported ${files.length} files. Left out: ${skipped.map((s) => `${s.title} (${s.reason})`).join(', ')}`,
      );
    }
  }, [entries, siteSlug, site]);

  const go = useCallback(
    (target: string) => {
      const q = mode === 'live' ? '?mode=live' : '';
      navigate(`${base}${target === '/' ? '' : target}${q}`);
    },
    [navigate, base, mode],
  );

  // Messages from the preview frame (link clicks, dropdown switches)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        href?: string;
        action?: string;
        slug?: string;
      };
      if (!data || !page) return;
      // Only the preview frame may drive navigation
      if (event.source !== frameRef.current?.contentWindow) return;
      if (data.type === 'CMS_PREVIEW_SELECT' && data.slug) {
        go(`${pageBase(page)}/${data.slug}`);
        return;
      }
      if (data.type === 'CMS_FORM_SUBMIT') {
        // Forms only send from the public website, never from the preview
        (event.source as Window | null)?.postMessage(
          {
            type: 'CMS_FORM_RESULT',
            ok: false,
            message:
              'Forms only send on the public website, not in the preview.',
          },
          '*',
        );
        return;
      }
      if (data.type !== 'CMS_PREVIEW_NAVIGATE') return;
      if (data.action === 'view-post' && data.slug)
        return go(`${pageBase(page)}/${data.slug}`);
      if (data.action === 'back-to-list') return go(page.slug);
      const href = data.href ?? '';
      if (/^(https?:)?\/\//.test(href)) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else if (href.startsWith('/')) {
        go(href.startsWith(base) ? href.slice(base.length) || '/' : href);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [page, go, base]);

  const setMode = (next: RenderMode) =>
    setSearch((prev) => {
      const n = new URLSearchParams(prev);
      if (next === 'live') n.set('mode', 'live');
      else n.delete('mode');
      return n;
    });

  const backHref = params.siteId ? `/sites/${siteSlug}/pages` : '/';
  const diagnostics = rendered?.diagnostics ?? [];
  const problemCount = diagnostics.filter((d) => d.level !== 'info').length;

  const modeBtn = (value: RenderMode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      aria-pressed={mode === value}
      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
        mode === value
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  const message = (title: string, body: React.ReactNode) => (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="text-sm text-muted-foreground mt-2 space-y-3">
          {body}
        </div>
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (entriesQuery.isLoading) {
    content = (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading preview…</span>
      </div>
    );
  } else if (entriesQuery.isError) {
    content = message(
      'The preview could not be loaded',
      <p>Check your connection and try Refresh.</p>,
    );
  } else if (!page) {
    content = existsAsDraft
      ? message(
          'This page is not published yet',
          <>
            <p>
              Visitors cannot see it. Switch to Draft to preview your latest
              changes.
            </p>
            <button
              type="button"
              onClick={() => setMode('draft')}
              className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold"
            >
              Preview draft
            </button>
          </>,
        )
      : message(
          'No page lives at this address',
          model.pages.length > 0 ? (
            <ul className="text-left space-y-1">
              {model.pages.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => go(p.slug)}
                    className="text-primary hover:underline"
                  >
                    {p.title}{' '}
                    <span className="text-muted-foreground font-mono text-xs">
                      {p.slug}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              This website has no {mode === 'live' ? 'published ' : ''}pages
              yet.
            </p>
          ),
        );
  } else if (layout) {
    content = (
      <iframe
        ref={frameRef}
        title="Page preview"
        sandbox="allow-scripts allow-forms"
        srcDoc={srcDoc}
        className="w-full h-full border-0 bg-white block"
      />
    );
  } else if (page.customDesign) {
    content = (
      <div className="h-full overflow-auto bg-background">
        <Suspense
          fallback={
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading layout…
            </div>
          }
        >
          <CustomBuilderPreview
            slug={page.slug}
            initialDesign={page.customDesign}
            title={page.title}
          />
        </Suspense>
      </div>
    );
  } else {
    content = message(
      'This page has no layout yet',
      <>
        <p>Design it in the visual builder and it will appear here.</p>
        {params.siteId && (
          <Link
            to={`/sites/${siteSlug}/pages/${page.id}`}
            className="inline-flex px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold"
          >
            Open visual builder
          </Link>
        )}
      </>,
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/30 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={backHref}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">
              {page?.title ?? 'Preview'}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground truncate">
              {page
                ? `${pageBase(page) || '/'}${item && resolved?.post ? `/${String(item.slug)}` : ''}`
                : path}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1 p-0.5 rounded-lg bg-muted"
          role="group"
          aria-label="Preview version"
        >
          {modeBtn('draft', 'Draft')}
          {modeBtn('live', 'Live')}
        </div>

        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Device size"
        >
          {(
            [
              ['desktop', Monitor, 'Desktop'],
              ['tablet', Tablet, 'Tablet'],
              ['mobile', Smartphone, 'Mobile'],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              aria-label={label}
              aria-pressed={device === id}
              className={`p-1.5 rounded-md ${device === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {model.pages.length > 0 && (
            <select
              aria-label="Page"
              value={page?.slug ?? ''}
              onChange={(e) => go(e.target.value)}
              className="max-w-[160px] bg-card border border-border rounded-md px-2 py-1"
            >
              {!page && <option value="">Choose page…</option>}
              {model.pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
          {page &&
            (page.raw?.data as Record<string, unknown> | undefined)
              ?.isBlogPage === true &&
            page.posts.length > 0 && (
              <select
                aria-label="Post"
                value={resolved?.post ? String(resolved.post.slug) : ''}
                onChange={(e) =>
                  go(
                    e.target.value
                      ? `${pageBase(page)}/${e.target.value}`
                      : page.slug,
                  )
                }
                className="max-w-[160px] bg-card border border-border rounded-md px-2 py-1"
              >
                <option value="">All posts</option>
                {page.posts.map((p) => (
                  <option key={String(p.id)} value={String(p.slug)}>
                    {String(p.title ?? p.slug)}
                  </option>
                ))}
              </select>
            )}
          <button
            type="button"
            onClick={() => setShowHealth((v) => !v)}
            aria-expanded={showHealth}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${
              problemCount > 0
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Template health
            {diagnostics.length > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-[10px]">
                {diagnostics.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => entriesQuery.refetch()}
            aria-label="Refresh preview"
            title="Reload the latest content"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <RefreshCw
              size={14}
              className={entriesQuery.isFetching ? 'animate-spin' : ''}
            />
          </button>
          <button
            type="button"
            onClick={exportSite}
            title="Download the live site as plain HTML files"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Download size={12} /> Export
          </button>
          {page && params.siteId && (
            <Link
              to={`/sites/${siteSlug}/pages/${page.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-semibold"
            >
              <Pencil size={12} /> Edit
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 py-1 text-[11px] text-muted-foreground border-b border-border bg-card/60 shrink-0">
        {mode === 'live'
          ? 'Showing what visitors see: published pages and posts only.'
          : 'Showing your latest changes, including drafts that are not live yet.'}
      </div>

      {mode === 'live' && hasUnpublishedDraftChanges && (
        <div className="px-4 py-1.5 text-xs bg-amber-500/10 text-amber-800 dark:text-amber-200 border-b border-amber-500/20 shrink-0 flex items-center justify-between">
          <span>
            <strong>Note:</strong> You have unpublished draft changes for this
            page that visitors cannot see yet.
          </span>
          <button
            type="button"
            onClick={() => setMode('draft')}
            className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100 ml-2 cursor-pointer"
          >
            Switch to Draft to preview edits →
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 flex justify-center overflow-auto p-0 md:p-4">
          <div
            className={`h-full bg-white flex flex-col ${device === 'desktop' ? 'w-full' : 'rounded-xl border border-border shadow-lg overflow-hidden'}`}
            style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}
          >
            {borrowedFrom && (
              <p className="px-3 py-1.5 text-[11px] bg-muted text-muted-foreground border-b border-border shrink-0">
                This page has no design of its own, so it is shown with the
                layout of &ldquo;{borrowedFrom.title}&rdquo;.
              </p>
            )}
            <div className="flex-1 min-h-0">{content}</div>
          </div>
        </div>

        {showHealth && (
          <aside
            className="w-80 shrink-0 border-l border-border bg-card overflow-y-auto p-4"
            aria-label="Template health"
          >
            <h2 className="text-sm font-semibold">Template health</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
              Shows anything in this page&apos;s layout that could not be
              connected to your content.
            </p>
            {diagnostics.length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                Everything in this layout is connected.
              </p>
            ) : (
              <ul className="space-y-2">
                {diagnostics.map((d, i) => (
                  <li
                    key={`${d.code}-${d.key}-${i}`}
                    className="flex gap-2 text-xs border border-border rounded-lg p-2.5"
                  >
                    <span
                      className={`mt-0.5 shrink-0 ${LEVEL_STYLE[d.level].cls}`}
                    >
                      {LEVEL_STYLE[d.level].icon}
                    </span>
                    <span className="text-foreground">{d.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
