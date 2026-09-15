import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Edit2,
  AlertTriangle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { collectionsApi } from '../api/collections.api';
import { useToast, AdvancedTable } from '@repo/shared-ui';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export function CollectionsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionSlug, setNewCollectionSlug] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () =>
      (localStorage.getItem('cms:collections:viewMode') as 'grid' | 'list') ||
      'grid',
  );

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('cms:collections:viewMode', mode);
  };

  const [collectionToDelete, setCollectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteMode, setDeleteMode] = useState<'normal' | 'conflict' | 'force'>(
    'normal',
  );
  const [forceDeleteConfirmName, setForceDeleteConfirmName] = useState('');
  const [collectionToEdit, setCollectionToEdit] = useState<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  } | null>(null);

  const [tableState, setTableState] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  const toast = useToast();

  const debouncedSearch = useDebouncedValue(tableState.search);

  const collectionsQuery = useQuery({
    queryKey: ['collections', { ...tableState, search: debouncedSearch }],
    queryFn: () =>
      collectionsApi.listSchemas({ ...tableState, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description?: string }) =>
      collectionsApi.createSchema(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsCreateOpen(false);
      setNewCollectionName('');
      setNewCollectionSlug('');
      setNewCollectionDescription('');
      toast.success('Collection created successfully');
    },
    onError: () => {
      toast.error('Failed to create collection. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; description?: string }) =>
      collectionsApi.updateSchema(data.id, {
        name: data.name,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setCollectionToEdit(null);
      toast.success('Collection updated successfully');
    },
    onError: () => {
      toast.error('Failed to update collection. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (params: { id: string; force: boolean }) =>
      collectionsApi.deleteSchema(params.id, params.force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      closeDeleteDialog();
      toast.success('Collection deleted successfully');
    },
    onError: (error: Error & { status?: number }) => {
      if (error?.status === 409) {
        setDeleteMode('conflict');
      } else {
        toast.error('Failed to delete collection. Please try again.');
      }
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

  const collections =
    collectionsQuery.data?.data?.filter((c) => c.type === 'collection') ?? [];
  const totalCount = collectionsQuery.data?.meta?.pagination?.total ?? 0;
  const pageCount = collectionsQuery.data?.meta?.pagination?.pageCount ?? 1;

  const tableColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'entries', label: 'Entries', sortable: false },
    { key: 'updatedAt', label: 'Last Updated', sortable: true },
    { key: 'updatedBy', label: 'Updated By', sortable: false },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right' as const,
    },
  ];

  const tableRows = collections.map((collection) => ({
    id: collection.id,
    name: (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <span className="text-sm font-bold">
            {collection.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="font-bold">{collection.name}</span>
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
        {collection.lastUpdatedBy || 'N/A'}
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
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
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
            Create New Collection
          </button>
        </div>
      </div>

      {collectionsQuery.isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!collectionsQuery.isLoading && collections.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-card/50">
          <Files className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No collections yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Create your first collection to start managing structured content
            for your application.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create Collection
          </button>
        </div>
      )}

      {!collectionsQuery.isLoading &&
        collections.length > 0 &&
        viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 p-5"
              >
                {/* Header: Icon + Title + Status */}
                <div className="flex gap-4 items-start mb-3">
                  {/* Icon Container */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <span className="text-xl font-bold">
                      {collection.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Status */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground truncate tracking-tight">
                        {collection.name}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#fbf3d0] text-[#8e6c1d] border border-[#f3e3a8] flex-shrink-0 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a83b]" />
                        {collection.status === 'published'
                          ? 'Published'
                          : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-snug h-[40px]">
                      {collection?.description || (
                        <span className="italic opacity-60">
                          No description provided.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="bg-muted/30 rounded-lg p-3 mb-5 border border-border/40 space-y-2">
                  {collection.createdAt && (
                    <div className="flex justify-between items-center text-[12px] text-muted-foreground">
                      <span className="font-medium">Created:</span>
                      <span>
                        {new Date(collection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[12px] text-muted-foreground">
                    <span className="font-medium">Last Updated:</span>
                    <div className="flex items-center gap-1">
                      {collection.updatedAt && (
                        <span>
                          {new Date(collection.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                      {collection.lastUpdatedBy && (
                        <>
                          <span className="opacity-50">•</span>
                          <span>
                            by{' '}
                            <span className="font-medium text-foreground">
                              {collection.lastUpdatedBy}
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
                    to={`/collections/${collection.slug}`}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-[#4273b8] hover:bg-[#345c93] text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                  >
                    Manage Content
                  </Link>
                  <button
                    onClick={() =>
                      setCollectionToEdit({
                        id: collection.id,
                        name: collection.name,
                        slug: collection.slug,
                        description: collection.description,
                      })
                    }
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
                    title="Edit Collection"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCollectionToDelete({
                        id: collection.id,
                        name: collection.name,
                      })
                    }
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-destructive/10 text-destructive transition-colors"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Create Collection Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsCreateOpen(false)}
          />
          <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Create New Collection
              </h2>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Collection Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => {
                        setNewCollectionName(e.target.value);
                        if (
                          !newCollectionSlug ||
                          newCollectionSlug ===
                            newCollectionName
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)+/g, '')
                        ) {
                          setNewCollectionSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)+/g, ''),
                          );
                        }
                      }}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      placeholder="e.g. Portfolio Pages"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="slug"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      API Slug
                    </label>
                    <input
                      id="slug"
                      type="text"
                      value={newCollectionSlug}
                      onChange={(e) => setNewCollectionSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-mono text-sm"
                      placeholder="e.g. portfolio-pages"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will automatically generate a schema with title,
                      slug, and body fields.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Description{' '}
                      <span className="text-muted-foreground font-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id="description"
                      value={newCollectionDescription}
                      onChange={(e) =>
                        setNewCollectionDescription(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm min-h-[80px] resize-y"
                      placeholder="Briefly describe what this collection is for..."
                    />
                  </div>
                </div>

                {createMutation.isError && (
                  <p className="text-sm font-medium text-destructive mb-4">
                    Failed to create collection. Please check the slug.
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      !newCollectionName ||
                      !newCollectionSlug
                    }
                    className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {createMutation.isPending
                      ? 'Creating...'
                      : 'Create Collection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Collection Dialog */}
      {collectionToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setCollectionToEdit(null)}
          />
          <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Edit Collection
              </h2>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Collection Name
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={collectionToEdit.name}
                      onChange={(e) =>
                        setCollectionToEdit({
                          ...collectionToEdit,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      placeholder="e.g. Portfolio Pages"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1 opacity-70">
                      API Slug
                    </label>
                    <input
                      type="text"
                      value={collectionToEdit.slug}
                      disabled
                      className="w-full px-3 py-2 bg-muted border border-input rounded-md text-muted-foreground font-mono text-sm opacity-70 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The API slug cannot be changed after creation.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-description"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Description{' '}
                      <span className="text-muted-foreground font-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id="edit-description"
                      value={collectionToEdit.description || ''}
                      onChange={(e) =>
                        setCollectionToEdit({
                          ...collectionToEdit,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm min-h-[80px] resize-y"
                      placeholder="Briefly describe what this collection is for..."
                    />
                  </div>
                </div>

                {updateMutation.isError && (
                  <p className="text-sm font-medium text-destructive mb-4">
                    Failed to update collection. Please try again.
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectionToEdit(null)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      updateMutation.isPending || !collectionToEdit.name
                    }
                    className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Dialog */}
      {collectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={closeDeleteDialog}
          />
          <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              {/* NORMAL MODE */}
              {deleteMode === 'normal' && (
                <>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Delete Collection
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Are you sure you want to delete the{' '}
                    <span className="font-medium text-foreground">
                      &quot;{collectionToDelete.name}&quot;
                    </span>{' '}
                    collection? You can only do this if all associated pages
                    have been deleted.
                  </p>

                  {deleteMutation.isError && (
                    <p className="text-sm font-medium text-destructive mb-4">
                      Failed to delete collection. Please try again.
                    </p>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      onClick={closeDeleteDialog}
                      className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {deleteMutation.isPending
                        ? 'Deleting...'
                        : 'Delete Collection'}
                    </button>
                  </div>
                </>
              )}

              {/* CONFLICT MODE */}
              {deleteMode === 'conflict' && (
                <>
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">
                      Active Pages Found
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    The{' '}
                    <span className="font-medium text-foreground">
                      &quot;{collectionToDelete.name}&quot;
                    </span>{' '}
                    collection cannot be deleted because it still contains
                    active pages.
                    <br />
                    <br />
                    You can either cancel and delete those pages manually, or
                    you can force delete the collection to permanently destroy
                    all its contents.
                  </p>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      onClick={closeDeleteDialog}
                      className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setDeleteMode('force')}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      Enter Force Delete Mode
                    </button>
                  </div>
                </>
              )}

              {/* FORCE DELETE MODE */}
              {deleteMode === 'force' && (
                <>
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">
                      Force Delete Collection
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This action{' '}
                    <span className="font-bold">cannot be undone</span>. This
                    will permanently delete the collection and all of its
                    associated pages.
                  </p>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Please type{' '}
                      <span className="font-bold select-all bg-muted px-1.5 py-0.5 rounded text-destructive">
                        {collectionToDelete.name}
                      </span>{' '}
                      to confirm.
                    </label>
                    <input
                      type="text"
                      value={forceDeleteConfirmName}
                      onChange={(e) =>
                        setForceDeleteConfirmName(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-destructive/50 text-foreground"
                      placeholder="Type collection name here..."
                    />
                  </div>

                  {deleteMutation.isError && (
                    <p className="text-sm font-medium text-destructive mb-4">
                      Failed to force delete collection. Please try again.
                    </p>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      onClick={closeDeleteDialog}
                      className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={
                        deleteMutation.isPending ||
                        forceDeleteConfirmName !== collectionToDelete.name
                      }
                      className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {deleteMutation.isPending
                        ? 'Deleting...'
                        : 'Confirm Force Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
