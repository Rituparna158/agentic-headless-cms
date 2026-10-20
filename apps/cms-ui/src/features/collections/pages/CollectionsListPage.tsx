import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { Plus, Files, Trash2, Edit2, LayoutGrid, List } from 'lucide-react';
import {
  collectionsApi,
  type SchemaEntry,
  type PaginatedResponse,
} from '../api/collections.api';
import { useToast, AdvancedTable } from '@repo/shared-ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuthStore } from '../../auth/store/auth.store';
import { normalizeCollaborator } from '../utils/collaborator.util';
import {
  ViewMode,
  DeleteMode,
  CollectionToDelete,
  CollectionToEdit,
  CollectionsTableState,
} from '../types/collections.types';
import {
  COLLECTIONS_VIEW_MODE_STORAGE_KEY,
  DEFAULT_COLLECTION_PAGE,
  DEFAULT_PAGE_SIZE,
  COLLECTIONS_LIST_TABLE_COLUMNS,
} from '../constants/collections.constants';
import { CollectionsStatsCards } from '../components/CollectionsStatsCards';
import { CollectionsGridView } from '../components/CollectionsGridView';
import { CreateCollectionModal } from '../components/modals/CreateCollectionModal';
import { EditCollectionModal } from '../components/modals/EditCollectionModal';
import { DeleteCollectionModal } from '../components/modals/DeleteCollectionModal';
import { InlineErrorAlert } from '@/components/ui/InlineErrorAlert';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

export function CollectionsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionSlug, setNewCollectionSlug] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(
    () =>
      (localStorage.getItem(COLLECTIONS_VIEW_MODE_STORAGE_KEY) as ViewMode) ||
      'list',
  );

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(COLLECTIONS_VIEW_MODE_STORAGE_KEY, mode);
  };

  const [collectionToDelete, setCollectionToDelete] =
    useState<CollectionToDelete | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('normal');
  const [forceDeleteConfirmName, setForceDeleteConfirmName] = useState('');
  const [collectionToEdit, setCollectionToEdit] =
    useState<CollectionToEdit | null>(null);

  const [tableState, setTableState] = useState<CollectionsTableState>({
    page: DEFAULT_COLLECTION_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const toast = useToast();
  const debouncedSearch = useDebouncedValue(tableState.search);

  const collectionsQuery = useQuery({
    queryKey: ['collections', { ...tableState, search: debouncedSearch }],
    queryFn: ({ signal }) =>
      collectionsApi.listSchemas(
        { ...tableState, search: debouncedSearch },
        { signal },
      ),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description?: string }) =>
      collectionsApi.createSchema(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });
      const queryKey = [
        'collections',
        { ...tableState, search: debouncedSearch },
      ];
      const previousCollections =
        queryClient.getQueryData<PaginatedResponse<SchemaEntry>>(queryKey);

      queryClient.setQueryData<PaginatedResponse<SchemaEntry>>(
        queryKey,
        (old) => {
          if (!old) return old;
          const optimisticEntry: SchemaEntry = {
            id: `temp-${Date.now()}`,
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            type: 'collection',
            fields: [],
            entryCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            ...old,
            data: [optimisticEntry, ...old.data],
            meta: {
              ...old.meta,
              pagination: {
                ...old.meta.pagination,
                total: old.meta.pagination.total + 1,
              },
            },
          };
        },
      );

      return { previousCollections, queryKey };
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setNewCollectionName('');
      setNewCollectionSlug('');
      setNewCollectionDescription('');
      toast.success('Collection created successfully');
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCollections && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousCollections);
      }
      toast.error('Failed to create collection. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; description?: string }) =>
      collectionsApi.updateSchema(data.id, {
        name: data.name,
        description: data.description,
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });
      const queryKey = [
        'collections',
        { ...tableState, search: debouncedSearch },
      ];
      const previousCollections =
        queryClient.getQueryData<PaginatedResponse<SchemaEntry>>(queryKey);

      queryClient.setQueryData<PaginatedResponse<SchemaEntry>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((c) => {
              if (c.id !== data.id) return c;
              return {
                ...c,
                name: data.name,
                description: data.description || null,
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        },
      );

      return { previousCollections, queryKey };
    },
    onSuccess: () => {
      setCollectionToEdit(null);
      toast.success('Collection updated successfully');
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCollections && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousCollections);
      }
      toast.error('Failed to update collection. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (params: { id: string; force: boolean }) =>
      collectionsApi.deleteSchema(params.id, params.force),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });
      const queryKey = [
        'collections',
        { ...tableState, search: debouncedSearch },
      ];
      const previousCollections =
        queryClient.getQueryData<PaginatedResponse<SchemaEntry>>(queryKey);

      queryClient.setQueryData<PaginatedResponse<SchemaEntry>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((c) => c.id !== params.id),
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

      return { previousCollections, queryKey };
    },
    onSuccess: () => {
      closeDeleteDialog();
      toast.success('Collection deleted successfully');
    },
    onError: (error: Error & { status?: number }, _variables, context) => {
      if (context?.previousCollections && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousCollections);
      }
      if (error?.status === 409) {
        setDeleteMode('conflict');
      } else {
        toast.error('Failed to delete collection. Please try again.');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName || !newCollectionSlug) return;
    createMutation.mutate({
      name: newCollectionName,
      slug: newCollectionSlug,
      description: newCollectionDescription || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionToEdit || !collectionToEdit.name) return;
    updateMutation.mutate({
      id: collectionToEdit.id,
      name: collectionToEdit.name,
      description: collectionToEdit.description || undefined,
    });
  };

  const handleDeleteConfirm = () => {
    if (collectionToDelete) {
      if (deleteMode === 'force') {
        if (forceDeleteConfirmName === collectionToDelete.name) {
          deleteMutation.mutate({ id: collectionToDelete.id, force: true });
        }
      } else {
        deleteMutation.mutate({ id: collectionToDelete.id, force: false });
      }
    }
  };

  const closeDeleteDialog = () => {
    setCollectionToDelete(null);
    setDeleteMode('normal');
    setForceDeleteConfirmName('');
    deleteMutation.reset();
  };

  const currentUser = useAuthStore((state) => state.user);

  const collections = useMemo(
    () =>
      collectionsQuery.data?.data?.filter((c) => c.type === 'collection') ?? [],
    [collectionsQuery.data?.data],
  );
  const totalCount = collectionsQuery.data?.meta?.pagination?.total ?? 0;
  const pageCount = collectionsQuery.data?.meta?.pagination?.pageCount ?? 1;

  const stats = useMemo(() => {
    const total = collections.length;
    const totalEntries = collections.reduce(
      (acc, c) => acc + (c.entryCount || 0),
      0,
    );
    const published = collections.filter(
      (c) => c.status === 'published',
    ).length;
    const drafts = total - published;
    const publishRate = total > 0 ? Math.round((published / total) * 100) : 0;

    const collabMap = new Map<
      string,
      { id: string; name: string; initials: string }
    >();

    for (const c of collections) {
      if (c.lastUpdatedBy) {
        const norm = normalizeCollaborator(c.lastUpdatedBy, currentUser);
        if (!collabMap.has(norm.key)) {
          collabMap.set(norm.key, {
            id: norm.key,
            name: norm.displayName,
            initials: norm.initials,
          });
        }
      }
    }

    if (collabMap.size === 0 && currentUser?.email) {
      const norm = normalizeCollaborator(currentUser.email, currentUser);
      collabMap.set(norm.key, {
        id: norm.key,
        name: norm.displayName,
        initials: norm.initials,
      });
    }

    const recentUpdated = collections.reduce<string | null>(
      (latest, current) => {
        if (!current.updatedAt) return latest;
        if (!latest) return current.updatedAt;
        return new Date(current.updatedAt) > new Date(latest)
          ? current.updatedAt
          : latest;
      },
      null,
    );

    const latestCollection = [...collections].sort((a, b) => {
      const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return db - da;
    })[0];

    const rawActor =
      latestCollection?.lastUpdatedBy ||
      currentUser?.firstName ||
      currentUser?.email ||
      'Admin';
    const latestActor = normalizeCollaborator(
      rawActor,
      currentUser,
    ).displayName;

    return {
      total,
      totalEntries,
      published,
      drafts,
      publishRate,
      collaborators: Array.from(collabMap.values()),
      recentUpdated,
      latestActor,
    };
  }, [collections, currentUser]);

  const tableColumns = COLLECTIONS_LIST_TABLE_COLUMNS;

  const tableRows = collections.map((collection) => ({
    id: collection.id,
    name: (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <span className="text-sm font-bold">
            {collection.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <Link
            to={`/collections/${collection.slug}`}
            className="font-bold text-foreground hover:text-primary transition-colors truncate"
          >
            {collection.name}
          </Link>
          <span className="font-mono text-[11px] text-muted-foreground truncate">
            /{collection.slug}
          </span>
        </div>
      </div>
    ),
    description: (
      <span
        className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]"
        title={collection.description || ''}
      >
        {collection.description || (
          <span className="italic opacity-60">None</span>
        )}
      </span>
    ),
    status: (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#fbf3d0] text-[#8e6c1d] border border-[#f3e3a8] flex-shrink-0 uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a83b]" />
        {collection.status === 'published' ? 'Published' : 'Draft'}
      </span>
    ),
    fields: <span className="text-sm">{collection.fields?.length || 0}</span>,
    entries: <span className="text-sm">{collection.entryCount || 0}</span>,
    updatedAt: (
      <span className="text-xs text-muted-foreground">
        {collection.updatedAt
          ? new Date(collection.updatedAt).toLocaleDateString()
          : 'N/A'}
      </span>
    ),
    updatedBy: (
      <span className="text-xs text-muted-foreground">
        {
          normalizeCollaborator(collection.lastUpdatedBy, currentUser)
            .displayName
        }
      </span>
    ),
    actions: (
      <div className="flex items-center justify-end gap-2">
        <Link
          to={`/collections/${collection.slug}`}
          className="px-3 py-1.5 bg-[#4273b8] hover:bg-[#345c93] text-white rounded text-xs font-semibold transition-colors"
        >
          Manage
        </Link>
        <button
          type="button"
          onClick={() =>
            setCollectionToEdit({
              id: collection.id,
              name: collection.name,
              slug: collection.slug,
              description: collection.description,
            })
          }
          className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
          title="Edit Collection"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            setCollectionToDelete({ id: collection.id, name: collection.name })
          }
          className="p-1.5 rounded border border-border hover:bg-destructive/10 text-destructive transition-colors"
          title="Delete Collection"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
  }));

  return (
    <div className="p-6 w-full relative">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Collections
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Manage your content collections and sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/40">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>
      </div>

      {!collectionsQuery.isLoading && <CollectionsStatsCards stats={stats} />}

      {collectionsQuery.isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {collectionsQuery.isError && (
        <InlineErrorAlert
          title="Failed to load collections"
          message={collectionsQuery.error}
          onRetry={() => collectionsQuery.refetch()}
          isRetrying={collectionsQuery.isFetching}
          className="my-6"
        />
      )}

      {!collectionsQuery.isLoading &&
        !collectionsQuery.isError &&
        collections.length === 0 && (
          <EmptyStateCard
            icon={Files}
            title="No collections yet"
            description="Create your first collection to start managing structured content schemas, page layouts, and dynamic slots."
            actionLabel="Create Collection"
            onAction={() => setIsCreateOpen(true)}
            tip="Collections organize content schemas, dynamic blocks, and revision histories"
            className="my-6"
          />
        )}

      {!collectionsQuery.isLoading &&
        collections.length > 0 &&
        viewMode === 'grid' && (
          <CollectionsGridView
            collections={collections}
            currentUser={currentUser}
            onEdit={(item) => setCollectionToEdit(item)}
            onDelete={(item) => setCollectionToDelete(item)}
          />
        )}

      {!collectionsQuery.isLoading && viewMode === 'list' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <AdvancedTable
            rows={tableRows}
            columns={tableColumns}
            enablePagination={true}
            initialRowsPerPage={10}
            enableFiltering={true}
            filterPlaceholder="Search collections..."
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

      <CreateCollectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        name={newCollectionName}
        onNameChange={setNewCollectionName}
        slug={newCollectionSlug}
        onSlugChange={setNewCollectionSlug}
        description={newCollectionDescription}
        onDescriptionChange={setNewCollectionDescription}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending}
        isError={createMutation.isError}
      />

      <EditCollectionModal
        collection={collectionToEdit}
        onClose={() => setCollectionToEdit(null)}
        onCollectionChange={setCollectionToEdit}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
        isError={updateMutation.isError}
      />

      <DeleteCollectionModal
        collection={collectionToDelete}
        deleteMode={deleteMode}
        forceDeleteConfirmName={forceDeleteConfirmName}
        onForceDeleteConfirmNameChange={setForceDeleteConfirmName}
        onEnterForceMode={() => setDeleteMode('force')}
        onConfirmDelete={handleDeleteConfirm}
        onClose={closeDeleteDialog}
        isPending={deleteMutation.isPending}
        isError={deleteMutation.isError}
      />
    </div>
  );
}
