import { NON_PAGE_KIND_PARAM, isPageEntry } from '@/lib/entryKinds';
import React, { useState, useMemo, useEffect } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCan } from '@/hooks/useCan';
import {
  Files,
  Plus,
  Search,
  ExternalLink,
  Settings,
  Edit,
  Layout,
  Trash2,
  Clock,
  Globe,
  Loader2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi, extractArrayPayload } from '../../posts/api/posts.api';
import { collectionsApi } from '../../collections/api/collections.api';
import type {
  PageEntry,
  ContentCollectionMeta,
  PageCustomSchema,
} from '@/types/content.types';
import { useCmsToast } from '@/hooks/useCmsToast';
import { slugify } from '@/utils/slugify.util';
import { MediaAssetPickerModal } from '@/features/media/components/MediaAssetPickerModal';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import type {
  PagesFilterStatus,
  NewPageTemplateKind,
  PageToDeleteTarget,
} from '../types/pagesHierarchy.types';

export const PagesHierarchyPage: React.FC = () => {
  const { siteId = '' } = useParams<{ siteId: string }>();
  const canPublish = useCan(siteId)('publish_content');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useCmsToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PagesFilterStatus>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pageToConfigure, setPageToConfigure] = useState<PageEntry | null>(
    null,
  );
  const [pageToDelete, setPageToDelete] = useState<PageToDeleteTarget | null>(
    null,
  );

  // Form states for Create Page Modal
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTemplate, setNewPageTemplate] =
    useState<NewPageTemplateKind>('blank');
  const [inheritPageId, setInheritPageId] = useState<string>('');

  // Form states for Page Configuration Modal
  const [configTitle, setConfigTitle] = useState('');
  const [configSlug, setConfigSlug] = useState('');
  const [configStatus, setConfigStatus] = useState<'draft' | 'published'>(
    'draft',
  );
  const [configDescription, setConfigDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoImage, setSeoImage] = useState('');
  const [seoNoindex, setSeoNoindex] = useState(false);
  const [pickingSeoImage, setPickingSeoImage] = useState(false);

  // Fetch active site collections
  const { data: rawCollections } = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
  });

  const collections = useMemo(
    () => extractArrayPayload<ContentCollectionMeta>(rawCollections),
    [rawCollections],
  );

  const activeSite = useMemo(() => {
    if (!collections.length || !siteId) return null;
    return (
      collections.find((c) => c.slug === siteId || c.id === siteId) || null
    );
  }, [collections, siteId]);

  const currentSlug = activeSite?.slug || siteId || '';

  // Server-side search, status filter and pagination
  const PAGE_SIZE = 10;
  const [pageNumber, setPageNumber] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);
  const statusParam =
    filter === 'published'
      ? 'published'
      : filter === 'drafts'
        ? 'draft'
        : 'all';

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, filter, currentSlug]);

  const {
    data: pagedResult,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      'collection-pages',
      currentSlug,
      'paged',
      pageNumber,
      debouncedSearch,
      statusParam,
    ],
    queryFn: () =>
      postsApi.listPagesPaged(currentSlug, {
        page: pageNumber,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status: statusParam,
        excludeKind: NON_PAGE_KIND_PARAM,
      }),
    enabled: Boolean(currentSlug),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });

  // Tab counts come from the server too (1-row requests, only the total is used)
  const useStatusCount = (status: 'all' | 'published' | 'draft') =>
    useQuery({
      queryKey: ['collection-pages', currentSlug, 'count', status],
      queryFn: () =>
        postsApi.listPagesPaged(currentSlug, {
          page: 1,
          pageSize: 1,
          status,
          excludeKind: NON_PAGE_KIND_PARAM,
        }),
      enabled: Boolean(currentSlug),
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    }).data?.total;
  const allCount = useStatusCount('all');
  const publishedCount = useStatusCount('published');
  const draftCount = useStatusCount('draft');

  // Articles live in the same collection; they are managed from Posts, not here
  const livePages = useMemo(
    () => (pagedResult?.items ?? []).filter(isPageEntry),
    [pagedResult],
  );
  const totalPages = Math.max(
    1,
    Math.ceil((pagedResult?.total ?? 0) / PAGE_SIZE),
  );

  // Map real API pages directly
  const displayPages = useMemo(() => {
    return livePages.map((p) => {
      const title = p.title || (p.data?.title as string) || 'Untitled Page';
      const rawSlug = p.slug || (p.data?.slug as string) || p.id;
      const cleanSlug = rawSlug
        ? rawSlug.startsWith('/')
          ? rawSlug
          : `/${rawSlug}`
        : '/';

      const pageSchemas: PageCustomSchema[] =
        (p.data?._schemas as PageCustomSchema[]) ||
        (p.schemas as unknown as PageCustomSchema[]) ||
        [];

      const schemaNames = pageSchemas
        .map((s) => s.name || s.slug)
        .filter(Boolean);

      const sectionsDescription =
        schemaNames.length > 0 ? schemaNames.join(', ') : 'Section Content';

      const lastUpdatedDate =
        p.updatedAt ||
        (p.data as { updatedAt?: string; createdAt?: string } | undefined)
          ?.updatedAt ||
        p.createdAt ||
        (p.data as { updatedAt?: string; createdAt?: string } | undefined)
          ?.createdAt;

      const lastUpdatedFormatted = lastUpdatedDate
        ? new Date(lastUpdatedDate).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'Recently';

      return {
        id: p.id,
        title,
        slug: cleanSlug,
        sectionsCount: pageSchemas.length > 0 ? pageSchemas.length : 1,
        sectionsDescription,
        status: p.status === 'published' ? 'published' : 'draft',
        lastUpdated: lastUpdatedFormatted,
        rawUpdatedDate: lastUpdatedDate,
        level: cleanSlug.split('/').filter(Boolean).length > 1 ? 1 : 0,
        rawPage: p,
      };
    });
  }, [livePages]);

  const filteredPages = displayPages;

  // Handle open config modal
  const handleOpenConfig = (page: PageEntry) => {
    setPageToConfigure(page);
    setConfigTitle(page.title || (page.data?.title as string) || '');
    const s = page.slug || (page.data?.slug as string) || page.id;
    setConfigSlug(s.replace(/^\/+/, ''));
    setConfigStatus(page.status === 'published' ? 'published' : 'draft');
    setConfigDescription(
      (page.data?.description as string) ||
        (page.data?.meta_description as string) ||
        '',
    );
    const seo = (page.data?.seo ?? {}) as Record<string, unknown>;
    setSeoTitle(typeof seo.title === 'string' ? seo.title : '');
    setSeoImage(typeof seo.image === 'string' ? seo.image : '');
    setSeoNoindex(seo.noindex === true);
  };

  // Save Page Configuration Mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!pageToConfigure || !currentSlug) return;
      const cleanSlug = configSlug.replace(/^\/+/, '');
      await collectionsApi.updatePage(currentSlug, pageToConfigure.id, {
        ...(pageToConfigure.data || {}),
        title: configTitle.trim(),
        slug: cleanSlug,
        status: configStatus,
        description: configDescription.trim(),
        seo: {
          ...((pageToConfigure.data?.seo as object) ?? {}),
          title: seoTitle.trim() || undefined,
          description: configDescription.trim() || undefined,
          image: seoImage || undefined,
          noindex: seoNoindex,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      toast.show({
        title: 'Configuration Saved',
        message: `Settings for "${configTitle}" updated successfully.`,
        type: 'success',
      });
      setPageToConfigure(null);
    },
    onError: (err: Error) => {
      toast.show({
        title: 'Save Failed',
        message: err?.message || 'Failed to update page settings.',
        type: 'error',
      });
    },
  });

  // Create Page Mutation
  const createPageMutation = useMutation({
    mutationFn: async () => {
      if (!currentSlug || !newPageTitle.trim()) return;
      const cleanSlug = (newPageSlug.trim() || slugify(newPageTitle)).replace(
        /^\/+/,
        '',
      );

      let initialSchemas: PageCustomSchema[] = [];
      let initialBody: Record<string, unknown> = {
        builder: 'grapesjs',
        html: '',
        css: '',
        projectData: null,
      };

      if (newPageTemplate === 'inherit' && inheritPageId) {
        const sourcePage = livePages.find((p) => p.id === inheritPageId);
        const sourceData = (sourcePage?.data || {}) as Record<string, unknown>;
        if (sourceData.body && typeof sourceData.body === 'object') {
          initialBody = { ...(sourceData.body as Record<string, unknown>) };
        }
        if (Array.isArray(sourceData._schemas)) {
          initialSchemas = [...(sourceData._schemas as PageCustomSchema[])];
        }
      } else if (newPageTemplate === 'standard') {
        initialSchemas = [
          {
            id: 'hero-section',
            name: 'Hero Banner',
            slug: 'hero-banner',
            entryType: 'single',
            fields: [
              {
                apiId: 'headline',
                displayName: 'Headline',
                dataType: 'text',
              },
              {
                apiId: 'subheading',
                displayName: 'Subheading',
                dataType: 'textarea',
              },
            ],
            values: {
              headline: newPageTitle.trim(),
              subheading: 'Welcome to this page.',
            },
          },
        ];
        initialBody = {
          builder: 'grapesjs',
          html: `<section style="padding: 64px 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
  <div style="max-width: 800px; margin: 0 auto;">
    <h1 style="font-size: 38px; font-weight: 800; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.02em;">${newPageTitle.trim()}</h1>
    <p style="font-size: 16px; color: #64748b; max-width: 600px; margin: 0 auto 24px;">Welcome to this page. You can customize this layout using the visual builder blocks.</p>
    <a href="#" style="display: inline-block; padding: 10px 24px; background-color: #6366f1; color: #ffffff; font-weight: 600; font-size: 14px; border-radius: 8px; text-decoration: none;">Get Started</a>
  </div>
</section>`,
          css: '',
          projectData: null,
        };
      }

      return await postsApi.createEntry(currentSlug, {
        title: newPageTitle.trim(),
        slug: cleanSlug,
        status: 'draft',
        data: {
          title: newPageTitle.trim(),
          slug: cleanSlug,
          body: initialBody,
          _schemas: initialSchemas,
        },
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      toast.show({
        title: 'Page Created',
        message: `Page "${newPageTitle}" created successfully.`,
        type: 'success',
      });
      setIsCreateModalOpen(false);
      setNewPageTitle('');
      setNewPageSlug('');
      setInheritPageId('');
      if (created?.id) {
        navigate(`/sites/${siteId}/pages/${created.id}`);
      }
    },
    onError: (err: Error) => {
      toast.show({
        title: 'Creation Failed',
        message: err?.message || 'Failed to create page.',
        type: 'error',
      });
    },
  });

  // Delete Page Mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      if (!currentSlug) return;
      await collectionsApi.deletePage(currentSlug, pageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      toast.show({
        title: 'Page Deleted',
        message: 'The page was permanently removed.',
        type: 'success',
      });
      setPageToDelete(null);
    },
    onError: (err: Error) => {
      toast.show({
        title: 'Delete Failed',
        message: err?.message || 'Failed to delete page.',
        type: 'error',
      });
    },
  });

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* Header */}
      <header className="px-8 py-5 border-b border-border bg-card/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">
              Websites
            </Link>
            <span>/</span>
            <span className="capitalize">{siteId}</span>
            <span>/</span>
            <span className="text-foreground font-medium">
              Pages & Hierarchy
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Files className="h-6 w-6 text-primary" />
            Pages & Site Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage page routes, sitemaps, and assigned visual templates for
            &ldquo;{activeSite?.name || siteId}&rdquo;.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewPageTitle('');
            setNewPageSlug('');
            setIsCreateModalOpen(true);
          }}
          className={CMS_THEME_CLASSES.buttons.primary}
        >
          <Plus size={14} />
          <span>Add New Page</span>
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="px-8 py-3 bg-muted/30 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Pages ({allCount ?? '…'})
          </button>
          <button
            type="button"
            onClick={() => setFilter('published')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'published'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Published ({publishedCount ?? '…'})
          </button>
          <button
            type="button"
            onClick={() => setFilter('drafts')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'drafts'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Drafts ({draftCount ?? '…'})
          </button>
        </div>

        <div className="relative w-72">
          <Search
            size={14}
            className="absolute left-3 top-2.5 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search pages by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-xs">Loading website pages...</span>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
            <Files className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-foreground">
              No pages found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {search
                ? 'No pages matched your search filter.'
                : 'This website does not have any pages yet. Click "Add New Page" to get started.'}
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className={CMS_THEME_CLASSES.buttons.primary}
            >
              <Plus size={14} />
              <span>Add New Page</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Page Name</th>
                  <th className="py-3 px-4">URL Path</th>
                  <th className="py-3 px-4">Attached Sections (Schemas)</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPages.map((page) => (
                  <tr
                    key={page.id}
                    onClick={() =>
                      navigate(`/sites/${siteId}/pages/${page.id}`)
                    }
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${page.level * 20}px` }}
                      >
                        {page.level > 0 && (
                          <span className="text-muted-foreground font-mono">
                            ↳
                          </span>
                        )}
                        <Files size={15} className="text-primary shrink-0" />
                        <span className="group-hover:text-primary transition-colors">
                          {page.title}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Globe size={11} className="text-muted-foreground/70" />
                        <span>{page.slug}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {page.sectionsCount}{' '}
                        {page.sectionsCount === 1 ? 'Section' : 'Sections'}
                      </span>{' '}
                      <span className="text-[11px] text-muted-foreground">
                        ({page.sectionsDescription})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Clock
                          size={12}
                          className="text-muted-foreground/70 shrink-0"
                        />
                        <span>{page.lastUpdated}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {page.status === 'published' ? (
                        <span className={CMS_THEME_CLASSES.badges.live}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                      ) : (
                        <span className={CMS_THEME_CLASSES.badges.draft}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div
                        role="presentation"
                        className="inline-flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Live preview (opens in a new tab) */}
                        <a
                          href={`/sites/${siteId}/preview${page.slug === '/' ? '' : page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={CMS_THEME_CLASSES.buttons.secondary}
                          title="Preview this page in a new tab"
                        >
                          <ExternalLink size={12} />
                          <span>Preview</span>
                        </a>

                        {/* 1. GrapesJS Page Builder Button */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/sites/${siteId}/pages/${page.id}`)
                          }
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="Open in GrapesJS Visual Page Builder"
                        >
                          <Layout size={12} className="shrink-0" />
                          <span>Visual Builder</span>
                        </button>

                        {/* 2. Page Content Studio Editor Button */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/sites/${siteId}/posts/editor/${page.id}`)
                          }
                          className={CMS_THEME_CLASSES.buttons.primary}
                          title="Edit page sections, headlines, and content"
                        >
                          <Edit size={12} />
                          <span>Edit Content</span>
                        </button>

                        {/* 3. Page Configuration Modal Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenConfig(page.rawPage)}
                          className={CMS_THEME_CLASSES.buttons.secondary}
                          title="Configure route, slug, status, and attached schemas"
                        >
                          <Settings size={12} />
                          <span>Config</span>
                        </button>

                        {/* 4. Delete Page Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setPageToDelete({ id: page.id, title: page.title })
                          }
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete page"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
              <span>
                {pagedResult?.total ?? 0} page
                {(pagedResult?.total ?? 0) === 1 ? '' : 's'} · Page {pageNumber}{' '}
                of {totalPages}
                {isFetching && (
                  <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((n) => Math.max(1, n - 1))}
                  className={`${CMS_THEME_CLASSES.buttons.secondary} disabled:opacity-40`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((n) => n + 1)}
                  className={`${CMS_THEME_CLASSES.buttons.secondary} disabled:opacity-40`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAGE CONFIGURATION MODAL */}
      {pageToConfigure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Page Configuration: &ldquo;{pageToConfigure.title || 'Page'}
                  &rdquo;
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPageToConfigure(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveConfigMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="config-page-title"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Page Title <span className="text-destructive">*</span>
                </label>
                <input
                  id="config-page-title"
                  type="text"
                  required
                  value={configTitle}
                  onChange={(e) => setConfigTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="config-page-slug"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  URL Route Path <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-muted border border-r-0 border-border rounded-l-xl text-xs font-mono text-muted-foreground">
                    /
                  </span>
                  <input
                    id="config-page-slug"
                    type="text"
                    required
                    value={configSlug}
                    onChange={(e) =>
                      setConfigSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-_]/g, '-'),
                      )
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-r-xl text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="config-page-status"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Publishing Status
                </label>
                <select
                  id="config-page-status"
                  value={configStatus}
                  onChange={(e) =>
                    setConfigStatus(e.target.value as 'draft' | 'published')
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="draft">
                    Draft (Private / Work in progress)
                  </option>
                  <option value="published" disabled={!canPublish}>
                    Published (Live to public)
                    {canPublish ? '' : ' - needs publishing rights'}
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="config-page-desc"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Page Description / SEO Meta
                </label>
                <textarea
                  id="config-page-desc"
                  rows={2}
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  placeholder="Optional brief description for search engine results..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-foreground">
                  Search &amp; sharing
                </p>
                <div>
                  <label
                    htmlFor="config-seo-title"
                    className="block text-[11px] text-muted-foreground mb-1"
                  >
                    Title shown in search results (optional)
                  </label>
                  <input
                    id="config-seo-title"
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={configTitle}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-20 rounded-md border border-border bg-background overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
                    {seoImage ? (
                      <img
                        src={getMediaFileUrl(seoImage)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      'No image'
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickingSeoImage(true)}
                    className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
                  >
                    Sharing image
                  </button>
                  {seoImage && (
                    <button
                      type="button"
                      onClick={() => setSeoImage('')}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={seoNoindex}
                    onChange={(e) => setSeoNoindex(e.target.checked)}
                  />
                  Hide this page from search engines
                </label>
                <div className="rounded-lg bg-background border border-border p-3">
                  <p className="text-[11px] text-muted-foreground mb-1">
                    How it may look in search results
                  </p>
                  <p className="text-sm text-blue-700 truncate">
                    {seoTitle || configTitle || 'Page title'}
                  </p>
                  <p className="text-[11px] text-emerald-700 truncate">
                    {configSlug ? `/${configSlug}` : '/'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {configDescription ||
                      'No description yet. Search engines will pick text from the page.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPageToConfigure(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    saveConfigMutation.isPending ||
                    !configTitle.trim() ||
                    !configSlug.trim()
                  }
                  className={CMS_THEME_CLASSES.buttons.primary}
                >
                  {saveConfigMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW PAGE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Add New Page to {activeSite?.name || siteId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPageMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="new-page-title-input"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Page Title <span className="text-destructive">*</span>
                </label>
                <input
                  id="new-page-title-input"
                  type="text"
                  required
                  placeholder="e.g. About Our Mission, Services, Contact"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    setNewPageSlug(slugify(e.target.value));
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="new-page-slug-input"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  URL Route Path <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-muted border border-r-0 border-border rounded-l-xl text-xs font-mono text-muted-foreground">
                    /
                  </span>
                  <input
                    id="new-page-slug-input"
                    type="text"
                    required
                    value={newPageSlug}
                    onChange={(e) =>
                      setNewPageSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-_]/g, '-'),
                      )
                    }
                    placeholder="about-our-mission"
                    className="w-full px-3 py-2 bg-background border border-border rounded-r-xl text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-foreground mb-1">
                  Starter Layout Template
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      newPageTemplate === 'blank'
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value="blank"
                      checked={newPageTemplate === 'blank'}
                      onChange={() => setNewPageTemplate('blank')}
                      className="sr-only"
                    />
                    <span className="font-bold block text-foreground">
                      Blank Canvas
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Empty visual template. Start from scratch.
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      newPageTemplate === 'inherit'
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value="inherit"
                      checked={newPageTemplate === 'inherit'}
                      onChange={() => setNewPageTemplate('inherit')}
                      className="sr-only"
                    />
                    <span className="font-bold block text-foreground">
                      Inherit from Page
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Clone layout & design from another page.
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      newPageTemplate === 'standard'
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value="standard"
                      checked={newPageTemplate === 'standard'}
                      onChange={() => setNewPageTemplate('standard')}
                      className="sr-only"
                    />
                    <span className="font-bold block text-foreground">
                      Standard Page
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Includes starter Hero banner section.
                    </span>
                  </label>
                </div>

                {newPageTemplate === 'inherit' && (
                  <div className="mt-3 p-3 bg-muted/40 border border-border rounded-xl space-y-1.5 animate-in fade-in duration-150">
                    <label
                      htmlFor="inherit-page-id-select"
                      className="block text-xs font-semibold text-foreground"
                    >
                      Choose Page to Inherit Design From
                    </label>
                    <select
                      id="inherit-page-id-select"
                      value={inheritPageId}
                      onChange={(e) => setInheritPageId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">-- Select an existing page --</option>
                      {displayPages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createPageMutation.isPending ||
                    !newPageTitle.trim() ||
                    !newPageSlug.trim() ||
                    (newPageTemplate === 'inherit' && !inheritPageId)
                  }
                  className={CMS_THEME_CLASSES.buttons.primary}
                >
                  {createPageMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  <span>Create Page</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center gap-2 mb-2 text-destructive font-bold">
              <AlertTriangle className="size-5 shrink-0" />
              <h3 className="text-base font-bold text-foreground">
                Delete Page
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Are you sure you want to permanently delete &ldquo;
              <span className="text-foreground font-semibold">
                {pageToDelete.title}
              </span>
              &rdquo;? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPageToDelete(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deletePageMutation.mutate(pageToDelete.id)}
                disabled={deletePageMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {deletePageMutation.isPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                <span>Delete Page</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {pickingSeoImage && (
        <MediaAssetPickerModal
          isOpen
          title="Choose a sharing image"
          onClose={() => setPickingSeoImage(false)}
          onSelect={(asset) => {
            setSeoImage(asset.url);
            setPickingSeoImage(false);
          }}
        />
      )}
    </div>
  );
};
