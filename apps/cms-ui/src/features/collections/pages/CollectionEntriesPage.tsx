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
  Palette,
  Boxes,
} from 'lucide-react';
import {
  collectionsApi,
  type PageEntry,
  type PaginatedResponse,
} from '../api/collections.api';
import { PageSideDrawer } from '@/components/PageSideDrawer';
import type {
  DynamicFieldDefinition,
  ContentCollectionMeta,
} from '@/types/content.types';
import { CreatePageDialog } from '../components/CreatePageDialog';
import { useToast, AdvancedTable } from '@repo/shared-ui';
import { useAuthStore } from '../../auth/store/auth.store';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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
  COLLECTION_ENTRIES_TABLE_COLUMNS,
} from '../constants/collections.constants';
import { CollectionEntriesStatsCards } from '../components/CollectionEntriesStatsCards';
import { CollectionEntriesGridView } from '../components/CollectionEntriesGridView';
import { DeletePageModal } from '../components/modals/DeletePageModal';
import { InlineErrorAlert } from '@/components/ui/InlineErrorAlert';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

export function CollectionEntriesPage() {
  const { schemaSlug } = useParams<{ schemaSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useAuthStore((state) => state.user);

  const schemaQuery = useQuery({
    queryKey: ['schema', schemaSlug],
    queryFn: ({ signal }) =>
      collectionsApi.getSchemaBySlug(schemaSlug!, { signal }),
    enabled: !!schemaSlug,
  });

  const activeCollection: ContentCollectionMeta | null = useMemo(() => {
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
  }, [schemaQuery.data]);

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
    onMutate: async ({ pageId, data, publishImmediately }) => {
      await queryClient.cancelQueries({ queryKey: ['pages', schemaSlug] });
      const queryKey = [
        'pages',
        schemaSlug,
        { ...tableState, search: debouncedSearch },
      ];
      const previousPagesQuery =
        queryClient.getQueryData<PaginatedResponse<PageEntry>>(queryKey);

      queryClient.setQueryData<PaginatedResponse<PageEntry>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((p) => {
              if (p.id !== pageId) return p;
              return {
                ...p,
                status: publishImmediately ? 'published' : p.status,
                data: {
                  ...p.data,
                  title:
                    typeof data.title === 'string' ? data.title : p.data.title,
                  slug: typeof data.slug === 'string' ? data.slug : p.data.slug,
                  ...data,
                },
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        },
      );

      return { previousPagesQuery, queryKey };
    },
    onSuccess: ({ updated, publishImmediately }) => {
      if (updated) {
        setDrawerPage(updated);
      }
      toast.success(
        publishImmediately
          ? 'Page published live!'
          : 'Page draft saved successfully!',
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPagesQuery && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousPagesQuery);
      }
      toast.error('Failed to save page data.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', schemaSlug] });
      queryClient.invalidateQueries({ queryKey: ['pagesStats', schemaSlug] });
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

  const pagesQuery = useQuery({
    queryKey: ['pages', schemaSlug, { ...tableState, search: debouncedSearch }],
    queryFn: ({ signal }) =>
      collectionsApi.listPages(
        schemaSlug!,
        {
          page: tableState.page,
          pageSize: tableState.pageSize,
          search: debouncedSearch,
          sortBy: tableState.sortBy,
          sortOrder: tableState.sortOrder,
        },
        { signal },
      ),
    placeholderData: keepPreviousData,
    enabled: !!schemaSlug,
  });

  const statsQuery = useQuery({
    queryKey: ['pagesStats', schemaSlug],
    queryFn: ({ signal }) =>
      collectionsApi.listPages(
        schemaSlug!,
        {
          page: DEFAULT_COLLECTION_PAGE,
          pageSize: DEFAULT_STATS_PAGE_SIZE,
        },
        { signal },
      ),
    enabled: !!schemaSlug,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collectionsApi.deletePage(schemaSlug!, id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['pages', schemaSlug] });
      const queryKey = [
        'pages',
        schemaSlug,
        { ...tableState, search: debouncedSearch },
      ];
      const previousPagesQuery =
        queryClient.getQueryData<PaginatedResponse<PageEntry>>(queryKey);

      queryClient.setQueryData<PaginatedResponse<PageEntry>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((p) => p.id !== id),
            meta: {
              ...old.meta,
              pagination: {
                ...old.meta.pagination,
                total: Math.max(0, old.meta.pagination.total - 1),
              },
            },
          };
        },
      );

      return { previousPagesQuery, queryKey };
    },
    onSuccess: () => {
      setPageToDelete(null);
      toast.success('Page deleted successfully');
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPagesQuery && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousPagesQuery);
      }
      toast.error('Failed to delete page. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', schemaSlug] });
      queryClient.invalidateQueries({ queryKey: ['pagesStats', schemaSlug] });
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
    const pagesWithSchemasCount = statPages.filter(
      (p) => Array.isArray(p.data?._schemas) && p.data._schemas.length > 0,
    ).length;

    return { total, published, drafts, publishRate, pagesWithSchemasCount };
  }, [statPages, statsQuery.data]);

  if (!schemaSlug) return null;

  const collectionDisplayName = schemaSlug.replace(/-/g, ' ');

  const tableColumns = COLLECTION_ENTRIES_TABLE_COLUMNS;

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
            type="button"
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
              type="button"
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
              type="button"
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
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create New Page
          </button>
        </div>
      </div>

      {!pagesQuery.isLoading && <CollectionEntriesStatsCards stats={stats} />}

      {pagesQuery.isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {schemaQuery.isError && (
        <InlineErrorAlert
          title="Failed to load collection schema"
          message={schemaQuery.error}
          onRetry={() => schemaQuery.refetch()}
          isRetrying={schemaQuery.isFetching}
          onBack={() => navigate('/collections')}
          backText="Back to Collections"
          className="my-6"
        />
      )}

      {pagesQuery.isError && (
        <InlineErrorAlert
          title="Failed to load pages"
          message={pagesQuery.error}
          onRetry={() => pagesQuery.refetch()}
          isRetrying={pagesQuery.isFetching}
          className="my-6"
        />
      )}

      {!pagesQuery.isLoading &&
        !pagesQuery.isError &&
        pages.length === 0 &&
        !tableState.search && (
          <EmptyStateCard
            icon={Files}
            title="No pages in this collection yet"
            description="Create your first page to start designing rich layouts with the visual page builder."
            actionLabel="Create your first page"
            onAction={() => setIsCreateOpen(true)}
            tip="Supports custom components, dynamic form blocks, and live SEO previews"
            className="my-6"
          />
        )}

      {!pagesQuery.isLoading &&
        !pagesQuery.isError &&
        pages.length === 0 &&
        tableState.search && (
          <EmptyStateCard
            icon={Files}
            title="No matching pages"
            description={`No pages found matching "${tableState.search}". Try refining your search query.`}
            actionLabel="Clear Search"
            onAction={() => setTableState((s) => ({ ...s, search: '' }))}
            className="my-6"
          />
        )}

      {!pagesQuery.isLoading &&
        viewMode === 'grid' &&
        (pages.length > 0 || tableState.search) && (
          <CollectionEntriesGridView
            pages={pages}
            schemaSlug={schemaSlug}
            search={tableState.search}
            onSearchChange={(search) =>
              setTableState((s) => ({ ...s, search, page: 1 }))
            }
            page={tableState.page}
            pageSize={tableState.pageSize}
            totalCount={totalCount}
            pageCount={pageCount}
            onPageChange={(page) => setTableState((s) => ({ ...s, page }))}
            currentUser={currentUser}
            pageAuthorMap={pageAuthorMap}
            onOpenDrawer={(page) => {
              setDrawerPage(page);
              setIsDrawerOpen(true);
            }}
            onDeletePage={setPageToDelete}
          />
        )}

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

      <DeletePageModal
        page={pageToDelete}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
        isError={deleteMutation.isError}
      />

      <PageSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerPage(null);
        }}
        collection={activeCollection}
        page={drawerPage}
        collectionPages={pagesQuery.data?.data}
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
