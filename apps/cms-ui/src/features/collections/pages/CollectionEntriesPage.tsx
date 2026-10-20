import { useState, useEffect, useMemo } from 'react';
import {
  Link,
  useSearchParams,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  Plus,
  Files,
  Trash2,
  ArrowLeft,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  Clock,
  Search,
  Palette,
  Boxes,
} from 'lucide-react';
import {
  collectionsApi,
  type PageEntry,
  type PaginatedResponse,
} from '../api/collections.api';
import { postsApi } from '../../posts/api/posts.api';
import { PageSideDrawer } from '../../posts/components/PageSideDrawer';
import {
  DynamicFieldDefinition,
  ContentCollectionMeta,
} from '../../posts/types/posts.types';
import { CreatePageDialog } from '../components/CreatePageDialog';
import { useToast, AdvancedTable } from '@repo/shared-ui';
import { useAuthStore } from '../../auth/store/auth.store';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { normalizeCollaborator } from '../utils/collaborator.util';
import {
  ViewMode,
  PageToDelete,
  EntriesTableState,
} from '../types/collections.types';
import {
  ENTRIES_VIEW_MODE_STORAGE_KEY,
  DEFAULT_COLLECTION_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_STATS_PAGE_SIZE,
} from '../constants/collections.constants';

export function CollectionEntriesPage() {
  const { schemaSlug } = useParams<{ schemaSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useAuthStore((state) => state.user);

  const collectionsQuery = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
  });
  const collections = useMemo(
    () => collectionsQuery.data || [],
    [collectionsQuery.data],
  );

  const schemaQuery = useQuery({
    queryKey: ['schema', schemaSlug],
    queryFn: () => collectionsApi.getSchemaBySlug(schemaSlug!),
    enabled: !!schemaSlug,
  });

  const activeCollection: ContentCollectionMeta | null = useMemo(() => {
    const fromList = collections.find((c) => c.slug === schemaSlug);
    if (fromList) return fromList;
    if (schemaQuery.data) {
      const s = schemaQuery.data;
      const raw = s as unknown as Record<string, unknown>;
      const def = raw.definition as { fields?: unknown[] } | undefined;
      const fields = (
        Array.isArray(raw.fields)
          ? raw.fields
          : Array.isArray(def?.fields)
            ? def?.fields
            : []
      ) as DynamicFieldDefinition[];
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description || undefined,
        type: s.type || 'collection',
        entryCount: 0,
        linkedPagesCount: 0,
        fields,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    }
    return null;
  }, [collections, schemaSlug, schemaQuery.data]);

  const [drawerPage, setDrawerPage] = useState<PageEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const updatePageMutation = useMutation({
    mutationFn: async ({
      pageId,
      data,
      publishImmediately,
    }: {
      pageId: string;
      data: Record<string, unknown>;
      publishImmediately: boolean;
    }) => {
      let updated = await collectionsApi.updatePage(schemaSlug!, pageId, {
        title: typeof data.title === 'string' ? data.title : 'Untitled',
        slug: typeof data.slug === 'string' ? data.slug : 'page',
        ...data,
      });

      if (publishImmediately) {
        updated = await collectionsApi.publishPage(schemaSlug!, pageId);
      }

      return { updated, publishImmediately };
    },
    onSuccess: ({ updated, publishImmediately }) => {
      queryClient.invalidateQueries({ queryKey: ['pages', schemaSlug] });
      queryClient.invalidateQueries({ queryKey: ['pagesStats', schemaSlug] });
      if (updated) {
        setDrawerPage(updated);
      }
      toast.success(
        publishImmediately
          ? 'Page published live!'
          : 'Page draft saved successfully!',
      );
    },
    onError: () => {
      toast.error('Failed to save page data.');
    },
  });

  const [isCreateOpen, setIsCreateOpen] = useState(
    () => searchParams.get('create') === 'true',
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (
      (localStorage.getItem(ENTRIES_VIEW_MODE_STORAGE_KEY) as ViewMode) ||
      'list'
    );
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(ENTRIES_VIEW_MODE_STORAGE_KEY, mode);
  };

  const [pageToDelete, setPageToDelete] = useState<PageToDelete | null>(null);

  useEffect(() => {
    if (searchParams.get('create') === 'true' && schemaSlug) {
      setIsCreateOpen(true);
      navigate(`/collections/${schemaSlug}`, { replace: true });
    }
  }, [searchParams, navigate, schemaSlug]);

  const [tableState, setTableState] = useState<EntriesTableState>({
    page: DEFAULT_COLLECTION_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const debouncedSearch = useDebouncedValue(tableState.search);

  // Fetch entries with server-side pagination, search & sort
  const pagesQuery = useQuery({
    queryKey: ['pages', schemaSlug, { ...tableState, search: debouncedSearch }],
    queryFn: () =>
      collectionsApi.listPages(schemaSlug!, {
        page: tableState.page,
        pageSize: tableState.pageSize,
        search: debouncedSearch,
        sortBy: tableState.sortBy,
        sortOrder: tableState.sortOrder,
      }),
    placeholderData: keepPreviousData,
    enabled: !!schemaSlug,
  });

  // Query for overall collection stats (unpaginated summary for top 5 stat cards)
  const statsQuery = useQuery({
    queryKey: ['pagesStats', schemaSlug],
    queryFn: () =>
      collectionsApi.listPages(schemaSlug!, {
        page: DEFAULT_COLLECTION_PAGE,
        pageSize: DEFAULT_STATS_PAGE_SIZE,
      }),
    enabled: !!schemaSlug,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collectionsApi.deletePage(schemaSlug!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', schemaSlug] });
      queryClient.invalidateQueries({ queryKey: ['pagesStats', schemaSlug] });
      setPageToDelete(null);
      toast.success('Page deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete page. Please try again.');
    },
  });

  const handleDeleteConfirm = () => {
    if (pageToDelete) {
      deleteMutation.mutate(pageToDelete.id);
    }
  };

  const pages = useMemo(
    () =>
      (pagesQuery.data as PaginatedResponse<PageEntry> | undefined)?.data ?? [],
    [pagesQuery.data],
  );
  const totalCount = pagesQuery.data?.meta?.pagination?.total ?? 0;
  const pageCount = pagesQuery.data?.meta?.pagination?.pageCount ?? 1;

  const statPages =
    (statsQuery.data as PaginatedResponse<PageEntry> | undefined)?.data ??
    pages;

  // Keep drawerPage synchronized when pages list updates
  useEffect(() => {
    if (!drawerPage) return;
    const fresh = pages.find((p) => p.id === drawerPage.id);
    if (fresh && fresh !== drawerPage) {
      if (
        fresh.updatedAt !== drawerPage.updatedAt ||
        JSON.stringify(fresh.data) !== JSON.stringify(drawerPage.data)
      ) {
        setDrawerPage(fresh);
      }
    }
  }, [pages, drawerPage]);

  const { pageAuthorMap } = useMemo(() => {
    // Map each pageId to its most recent actor
    const authorMap = new Map<
      string,
      { name: string; email: string; time: string; action: string }
    >();

    for (const page of statPages) {
      if (page.updatedBy) {
        const norm = normalizeCollaborator(page.updatedBy, currentUser);
        authorMap.set(page.id, {
          name: norm.displayName,
          email: norm.email,
          time: page.updatedAt || '',
          action: page.status === 'published' ? 'publish' : 'update',
        });
      }
    }

    return {
      pageAuthorMap: authorMap,
    };
  }, [statPages, currentUser]);

  const stats = useMemo(() => {
    const total = statsQuery.data?.meta?.pagination?.total ?? statPages.length;
    const published = statPages.filter((p) => p.status === 'published').length;
    const drafts = total - published;
    const publishRate = total > 0 ? Math.round((published / total) * 100) : 0;
    const recentUpdated = statPages.reduce<string | null>((latest, current) => {
      if (!current.updatedAt) return latest;
      if (!latest) return current.updatedAt;
      return new Date(current.updatedAt) > new Date(latest)
        ? current.updatedAt
        : latest;
    }, null);

    return { total, published, drafts, publishRate, recentUpdated };
  }, [statPages, statsQuery.data]);

  if (!schemaSlug) return null;

  const collectionDisplayName = schemaSlug.replace(/-/g, ' ');

  const tableColumns = [
    { key: 'name', label: 'Page Title & Slug', sortable: true },
    { key: 'schema', label: 'Schema Slots', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'updatedAt', label: 'Last Updated', sortable: true },
    { key: 'updatedBy', label: 'Author', sortable: false },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right' as const,
    },
  ];

  const tableRows = pages.map((page) => {
    const title = page.data?.title || 'Untitled';
    const slug = page.data?.slug || '-';
    const cleanSlug = slug.replace(/^\//, '');
    const pageAuthor = pageAuthorMap.get(page.id);
    const rawAuthor =
      page.updatedBy ||
      pageAuthor?.name ||
      currentUser?.firstName ||
      currentUser?.email ||
      'Admin';
    const authorDisplayName = normalizeCollaborator(
      rawAuthor,
      currentUser,
    ).displayName;

    return {
      id: page.id,
      name: (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <span className="text-sm font-bold">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <button
              type="button"
              onClick={() => {
                setDrawerPage(page);
                setIsDrawerOpen(true);
              }}
              className="font-bold text-foreground hover:text-primary transition-colors text-left truncate max-w-sm"
            >
              {title}
            </button>
            <span className="font-mono text-[11px] text-muted-foreground truncate">
              /{cleanSlug}
            </span>
          </div>
        </div>
      ),
      schema: (() => {
        const pageSchemas = (
          Array.isArray(page.data?._schemas) ? page.data._schemas : []
        ) as Array<{
          id?: string;
          name?: string;
          slug?: string;
          fields?: unknown[];
        }>;
        if (pageSchemas.length > 0) {
          const names = pageSchemas
            .map((s) => s.name || s.slug)
            .filter(Boolean)
            .join(', ');
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-[11px] text-indigo-300 font-mono"
              title={names}
            >
              <Boxes className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="font-semibold">
                {pageSchemas.length}{' '}
                {pageSchemas.length === 1 ? 'Schema' : 'Schemas'}
              </span>
              <span className="text-zinc-500 max-w-[120px] truncate hidden md:inline">
                ({names})
              </span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-zinc-500 bg-zinc-900 border border-zinc-800">
            No Schemas
          </span>
        );
      })(),
      status: (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 tracking-wide ${
            page.status === 'published'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              page.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          {page.status === 'published' ? 'Live' : 'Draft'}
        </span>
      ),
      updatedAt: (
        <span className="text-xs text-muted-foreground">
          {page.updatedAt
            ? new Date(page.updatedAt).toLocaleDateString()
            : 'N/A'}
        </span>
      ),
      updatedBy: (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
            {authorDisplayName.charAt(0).toUpperCase()}
          </div>
          <span
            className="text-xs text-muted-foreground truncate max-w-[120px]"
            title={authorDisplayName}
          >
            {authorDisplayName}
          </span>
        </div>
      ),
      createdAt: (
        <span className="text-xs text-muted-foreground">
          {page.createdAt
            ? new Date(page.createdAt).toLocaleDateString()
            : 'N/A'}
        </span>
      ),
      actions: (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDrawerPage(page);
              setIsDrawerOpen(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all"
          >
            Edit
          </button>
          <Link
            to={`/collections/${schemaSlug}/${page.id}`}
            className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Visual Page Builder"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
          </Link>
          <Link
            to={`/collections/${schemaSlug}/preview/${cleanSlug || page.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
            title="Preview Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() =>
              setPageToDelete({
                id: page.id,
                title,
              })
            }
            className="p-1.5 rounded border border-border hover:bg-destructive/10 text-destructive transition-colors"
            title="Delete Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    };
  });

  return (
    <div className="p-6 w-full relative">
      <div className="mb-4">
        <Link
          to="/collections"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Collections
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight capitalize">
            {collectionDisplayName} Pages
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Manage your pages and entries for this collection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/40">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create New Page
          </button>
        </div>
      </div>

      {/* Analytics & Collaboration Stat Cards */}
      {!pagesQuery.isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Pages */}
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Pages
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Files className="w-5 h-5" />
            </div>
          </div>

          {/* Published */}
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Published
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-emerald-400">
                  {stats.published}
                </p>
                {stats.total > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {stats.publishRate}%
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Drafts */}
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Drafts
              </p>
              <p className="text-2xl font-bold text-amber-400">
                {stats.drafts}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Schemas Configured */}
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pages with Schemas
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-indigo-400">
                  {
                    statPages.filter(
                      (p) =>
                        Array.isArray(p.data?._schemas) &&
                        p.data._schemas.length > 0,
                    ).length
                  }
                </p>
                <span className="text-xs font-mono text-zinc-500">
                  / {stats.total}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {pagesQuery.isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!pagesQuery.isLoading && pages.length === 0 && !tableState.search && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-card/50">
          <Files className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No pages yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Create your first page to start designing and managing content for
            this collection.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create Page
          </button>
        </div>
      )}

      {/* Grid View Controls & Cards */}
      {!pagesQuery.isLoading &&
        viewMode === 'grid' &&
        (pages.length > 0 || tableState.search) && (
          <div>
            {/* Grid Search Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={tableState.search}
                  onChange={(e) =>
                    setTableState((s) => ({
                      ...s,
                      search: e.target.value,
                      page: 1,
                    }))
                  }
                  placeholder="Search pages..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs"
                />
              </div>
              {totalCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {(tableState.page - 1) * tableState.pageSize + 1} -{' '}
                  {Math.min(tableState.page * tableState.pageSize, totalCount)}{' '}
                  of {totalCount} pages
                </p>
              )}
            </div>

            {pages.length === 0 && tableState.search ? (
              <div className="text-center py-12 border border-border rounded-2xl bg-card/40">
                <p className="text-sm font-medium text-muted-foreground">
                  No pages matching &quot;{tableState.search}&quot;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pages.map((page) => {
                  const title = page.data?.title || 'Untitled';
                  const slug = page.data?.slug || '-';
                  const cleanSlug = slug.replace(/^\//, '');
                  const rawAuthor =
                    page.updatedBy ||
                    pageAuthorMap.get(page.id)?.name ||
                    currentUser?.firstName ||
                    currentUser?.email ||
                    'Admin';
                  const authorDisplayName = normalizeCollaborator(
                    rawAuthor,
                    currentUser,
                  ).displayName;

                  const pageSchemas = (
                    Array.isArray(page.data?._schemas) ? page.data._schemas : []
                  ) as Array<{ name?: string; slug?: string }>;

                  return (
                    <div
                      key={page.id}
                      className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 p-5"
                    >
                      {/* Header: Icon + Title + Status */}
                      <div className="flex gap-4 items-start mb-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <span className="text-xl font-bold">
                            {title.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerPage(page);
                                setIsDrawerOpen(true);
                              }}
                              className="text-lg font-bold text-foreground hover:text-primary transition-colors truncate tracking-tight text-left"
                              title={title}
                            >
                              {title}
                            </button>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 tracking-wide ${
                                page.status === 'published'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  page.status === 'published'
                                    ? 'bg-emerald-400'
                                    : 'bg-amber-400'
                                }`}
                              />
                              {page.status === 'published' ? 'Live' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-sm font-mono text-muted-foreground truncate">
                            /{cleanSlug}
                          </p>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="bg-muted/30 rounded-xl p-3 mb-5 border border-border/40 space-y-2">
                        {/* Custom Schemas indicator */}
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-medium text-muted-foreground">
                            Schemas:
                          </span>
                          {pageSchemas.length > 0 ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono"
                              title={pageSchemas
                                .map((s) => s.name || s.slug)
                                .join(', ')}
                            >
                              <Boxes className="w-3 h-3 text-indigo-400" />
                              {pageSchemas.length}{' '}
                              {pageSchemas.length === 1 ? 'Schema' : 'Schemas'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500 font-mono">
                              No Schemas
                            </span>
                          )}
                        </div>
                        {page.createdAt && (
                          <div className="flex justify-between items-center text-[12px] text-muted-foreground">
                            <span className="font-medium">Created:</span>
                            <span>
                              {new Date(page.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[12px] text-muted-foreground">
                          <span className="font-medium">Last Updated:</span>
                          <div className="flex items-center gap-1">
                            <span>
                              {page.updatedAt
                                ? new Date(page.updatedAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                            {authorDisplayName && (
                              <>
                                <span className="opacity-50">•</span>
                                <span>
                                  by{' '}
                                  <span className="font-medium text-foreground">
                                    {authorDisplayName}
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerPage(page);
                            setIsDrawerOpen(true);
                          }}
                          className="flex-1 flex justify-center items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-sm shadow-indigo-600/20"
                        >
                          Edit Details & Schema
                        </button>
                        <Link
                          to={`/collections/${schemaSlug}/${page.id}`}
                          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-indigo-400 transition-colors"
                          title="Visual Page Builder"
                        >
                          <Palette className="w-4 h-4 text-indigo-400" />
                        </Link>
                        <Link
                          to={`/collections/${schemaSlug}/preview/${cleanSlug || page.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
                          title="Preview Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() =>
                            setPageToDelete({
                              id: page.id,
                              title,
                            })
                          }
                          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-background hover:bg-destructive/10 text-destructive transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid Pagination */}
            {pageCount > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {tableState.page} of {pageCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setTableState((s) => ({
                        ...s,
                        page: Math.max(1, s.page - 1),
                      }))
                    }
                    disabled={tableState.page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setTableState((s) => ({
                        ...s,
                        page: Math.min(pageCount, s.page + 1),
                      }))
                    }
                    disabled={tableState.page >= pageCount}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {/* List View AdvancedTable with Server-Side Search, Sort & Pagination */}
      {!pagesQuery.isLoading && viewMode === 'list' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <AdvancedTable
            rows={tableRows}
            columns={tableColumns}
            enablePagination={true}
            initialRowsPerPage={10}
            enableFiltering={true}
            filterPlaceholder="Search pages..."
            manualPagination={true}
            manualFiltering={true}
            manualSorting={true}
            totalCount={totalCount}
            page={tableState.page}
            pageSize={tableState.pageSize}
            pageCount={pageCount}
            searchValue={tableState.search}
            defaultSortKey={tableState.sortBy}
            defaultSortDirection={tableState.sortOrder}
            onPageChange={(page) => setTableState((s) => ({ ...s, page }))}
            onPageSizeChange={(pageSize) =>
              setTableState((s) => ({ ...s, pageSize, page: 1 }))
            }
            onSearchChange={(search) =>
              setTableState((s) => ({ ...s, search, page: 1 }))
            }
            onSortChange={(sortBy, sortOrder) =>
              setTableState((s) => ({ ...s, sortBy, sortOrder }))
            }
          />
        </div>
      )}

      {schemaSlug && (
        <CreatePageDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          schemaSlug={schemaSlug}
        />
      )}

      {/* Delete Page Dialog matching main collections dialog */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setPageToDelete(null)}
          />
          <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Delete Page
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete the{' '}
                <span className="font-medium text-foreground">
                  &quot;{pageToDelete.title}&quot;
                </span>{' '}
                page? This action cannot be undone.
              </p>

              {deleteMutation.isError && (
                <p className="text-sm font-medium text-destructive mb-4">
                  Failed to delete page. Please try again.
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPageToDelete(null)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Page'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Side Drawer */}
      <PageSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerPage(null);
        }}
        collection={activeCollection}
        page={drawerPage}
        onSavePage={async (pageId, data, publishImmediately) => {
          const res = await updatePageMutation.mutateAsync({
            pageId,
            data,
            publishImmediately,
          });
          if (res?.updated) {
            setDrawerPage(res.updated);
          }
        }}
        isSaving={updatePageMutation.isPending}
      />
    </div>
  );
}
