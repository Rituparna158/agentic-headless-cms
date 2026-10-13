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
  Users,
  Search,
} from 'lucide-react';
import {
  collectionsApi,
  type PageEntry,
  type PaginatedResponse,
} from '../api/collections.api';
import { CreatePageDialog } from '../components/CreatePageDialog';
import { useToast, AdvancedTable } from '@repo/shared-ui';
import { useAuthStore } from '../../auth/store/auth.store';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { normalizeCollaborator } from '../utils/collaborator.util';

export function CollectionEntriesPage() {
  const { schemaSlug } = useParams<{ schemaSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useAuthStore((state) => state.user);

  const [isCreateOpen, setIsCreateOpen] = useState(
    () => searchParams.get('create') === 'true',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (
      (localStorage.getItem('cms:entries:viewMode') as 'grid' | 'list') ||
      'grid'
    );
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('cms:entries:viewMode', mode);
  };

  const [pageToDelete, setPageToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get('create') === 'true' && schemaSlug) {
      setIsCreateOpen(true);
      navigate(`/collections/${schemaSlug}`, { replace: true });
    }
  }, [searchParams, navigate, schemaSlug]);

  const [tableState, setTableState] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc' as 'asc' | 'desc',
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
      collectionsApi.listPages(schemaSlug!, { page: 1, pageSize: 100 }),
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

  const pages =
    (pagesQuery.data as PaginatedResponse<PageEntry> | undefined)?.data ?? [];
  const totalCount = pagesQuery.data?.meta?.pagination?.total ?? 0;
  const pageCount = pagesQuery.data?.meta?.pagination?.pageCount ?? 1;

  const statPages =
    (statsQuery.data as PaginatedResponse<PageEntry> | undefined)?.data ??
    pages;

  // Discover collaborators and actors directly from the database columns on pages
  const { pageAuthorMap, collaborators, latestActivity } = useMemo(() => {
    // Map each pageId to its most recent actor
    const authorMap = new Map<
      string,
      { name: string; email: string; time: string; action: string }
    >();

    const collabMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        initials: string;
        lastSeen: string;
      }
    >();

    // 1. First populate directly from the database columns on pages
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

      let parsedCollabs: string[] = [];
      if (page.collaborators) {
        try {
          parsedCollabs =
            typeof page.collaborators === 'string'
              ? JSON.parse(page.collaborators)
              : page.collaborators;
        } catch {
          parsedCollabs = [page.collaborators];
        }
      }
      if (page.updatedBy) {
        parsedCollabs.push(page.updatedBy);
      }

      for (const actor of parsedCollabs) {
        if (!actor) continue;
        const norm = normalizeCollaborator(actor, currentUser);
        if (!collabMap.has(norm.key)) {
          collabMap.set(norm.key, {
            id: norm.key,
            name: norm.displayName,
            email: norm.email,
            initials: norm.initials,
            lastSeen: page.updatedAt || new Date().toISOString(),
          });
        }
      }
    }

    // Fallback to current authenticated user ONLY if no collaborator found yet
    if (collabMap.size === 0 && currentUser?.email) {
      const norm = normalizeCollaborator(currentUser.email, currentUser);
      collabMap.set(norm.key, {
        id: norm.key,
        name: norm.displayName,
        email: norm.email,
        initials: norm.initials,
        lastSeen: new Date().toISOString(),
      });
    }

    // Find latest activity from newest updatedAt
    let latestActivityItem: { name: string; time: string } | null = null;
    if (statPages.length > 0) {
      const sorted = [...statPages].sort((a, b) => {
        const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return db - da;
      });
      if (sorted[0]?.updatedAt) {
        const rawActor =
          sorted[0].updatedBy ||
          currentUser?.firstName ||
          currentUser?.email ||
          'Admin';
        const norm = normalizeCollaborator(rawActor, currentUser);
        latestActivityItem = {
          name: norm.displayName,
          time: sorted[0].updatedAt,
        };
      }
    }

    return {
      pageAuthorMap: authorMap,
      collaborators: Array.from(collabMap.values()),
      latestActivity: latestActivityItem,
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
    { key: 'name', label: 'Name', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'updatedAt', label: 'Last Updated', sortable: true },
    { key: 'updatedBy', label: 'Updated By', sortable: false },
    { key: 'createdAt', label: 'Created At', sortable: true },
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
          <Link
            to={`/collections/${schemaSlug}/${page.id}`}
            className="font-bold text-foreground hover:text-primary transition-colors"
          >
            {title}
          </Link>
        </div>
      ),
      slug: (
        <span className="font-mono text-xs text-muted-foreground">{slug}</span>
      ),
      status: (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border flex-shrink-0 uppercase tracking-wide ${
            page.status === 'published'
              ? 'bg-[#d8f3dc] text-[#1b4332] border-[#b7e4c7]'
              : 'bg-[#fbf3d0] text-[#8e6c1d] border-[#f3e3a8]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              page.status === 'published' ? 'bg-[#2d6a4f]' : 'bg-[#d4a83b]'
            }`}
          />
          {page.status === 'published' ? 'Published' : 'Draft'}
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
          <Link
            to={`/collections/${schemaSlug}/${page.id}`}
            className="px-3 py-1.5 bg-[#4273b8] hover:bg-[#345c93] text-white rounded text-xs font-semibold transition-colors"
          >
            Edit
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
          <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
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
          <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Published
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-[#2d6a4f] dark:text-emerald-400">
                  {stats.published}
                </p>
                {stats.total > 0 && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[#d8f3dc] text-[#1b4332] dark:bg-emerald-950/60 dark:text-emerald-400">
                    {stats.publishRate}%
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Drafts */}
          <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Drafts
              </p>
              <p className="text-2xl font-bold text-[#8e6c1d] dark:text-amber-400">
                {stats.drafts}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* People Working on this Collection */}
          <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contributors
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {collaborators.length}
                </p>
                {/* Avatars Stack */}
                <div className="flex -space-x-1.5 overflow-hidden">
                  {collaborators.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary shadow-xs"
                      title={c.name}
                    >
                      {c.initials}
                    </div>
                  ))}
                  {collaborators.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      +{collaborators.length - 3}
                    </div>
                  )}
                </div>
              </div>
              {latestActivity && (
                <p
                  className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[130px]"
                  title={`Last edit by ${latestActivity.name}`}
                >
                  Latest by {latestActivity.name}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
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
        <div className="text-center py-16 border-2 border-dashed border-border rounded-[5px] bg-card/50">
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
                  className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs"
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
              <div className="text-center py-12 border border-border rounded-[5px] bg-card/40">
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

                  return (
                    <div
                      key={page.id}
                      className="group flex flex-col bg-card rounded-[5px] border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 p-5"
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
                            <h3
                              className="text-lg font-bold text-foreground truncate tracking-tight"
                              title={title}
                            >
                              {title}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border flex-shrink-0 uppercase tracking-wide ${
                                page.status === 'published'
                                  ? 'bg-[#d8f3dc] text-[#1b4332] border-[#b7e4c7]'
                                  : 'bg-[#fbf3d0] text-[#8e6c1d] border-[#f3e3a8]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  page.status === 'published'
                                    ? 'bg-[#2d6a4f]'
                                    : 'bg-[#d4a83b]'
                                }`}
                              />
                              {page.status === 'published'
                                ? 'Published'
                                : 'Draft'}
                            </span>
                          </div>
                          <p className="text-sm font-mono text-muted-foreground truncate">
                            {slug}
                          </p>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="bg-muted/30 rounded-lg p-3 mb-5 border border-border/40 space-y-2">
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
                        <Link
                          to={`/collections/${schemaSlug}/${page.id}`}
                          className="flex-1 flex justify-center items-center px-4 py-2.5 bg-[#4273b8] hover:bg-[#345c93] text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                        >
                          Edit Page
                        </Link>
                        <Link
                          to={`/collections/${schemaSlug}/preview/${cleanSlug || page.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
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
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-destructive/10 text-destructive transition-colors"
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
    </div>
  );
}
