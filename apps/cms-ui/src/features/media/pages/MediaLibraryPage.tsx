import React, { useState, useMemo } from 'react';
import {
  Upload,
  Search,
  LayoutGrid,
  List,
  Trash2,
  X,
  Loader2,
  CheckSquare,
} from 'lucide-react';
import {
  useInfiniteMedia,
  useMediaFolders,
  useDeleteMedia,
  useDeleteBulkMedia,
} from '../hooks/useMediaQueries';
import type { MediaAsset, MediaViewMode } from '../types/media.types';
import { MediaFoldersSidebar } from '../components/MediaFoldersSidebar';
import { MediaGrid } from '../components/MediaGrid';
import { MediaUploadZone } from '../components/MediaUploadZone';
import { MediaAssetDetailModal } from '../components/MediaAssetDetailModal';
import { useToast } from '@repo/shared-ui';

export const MediaLibraryPage: React.FC = () => {
  const toast = useToast();
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<MediaViewMode>('grid');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] =
    useState<MediaAsset | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(),
  );
  const [assetToDelete, setAssetToDelete] = useState<MediaAsset | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Queries & Mutations
  const { data: foldersData, isLoading: isLoadingFolders } = useMediaFolders();
  const folders = useMemo(() => foldersData || [], [foldersData]);

  const {
    data: mediaData,
    isLoading: isLoadingMedia,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMedia({
    folderId: selectedFolderId,
    pageSize: 24,
  });

  const deleteMediaMutation = useDeleteMedia();
  const deleteBulkMutation = useDeleteBulkMedia();

  const allAssets = useMemo(() => {
    if (!mediaData?.pages) return [];
    return mediaData.pages.flatMap((page) => page.data);
  }, [mediaData]);

  // Client search filter
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return allAssets;
    const q = searchQuery.toLowerCase();
    return allAssets.filter(
      (a) =>
        a.filename.toLowerCase().includes(q) ||
        (a.altText && a.altText.toLowerCase().includes(q)),
    );
  }, [allAssets, searchQuery]);

  const totalCount =
    mediaData?.pages?.[0]?.meta?.pagination?.total ?? filteredAssets.length;

  const currentFolder = useMemo(() => {
    if (!selectedFolderId) return { name: 'All Assets', id: undefined };
    if (selectedFolderId === 'root')
      return { name: 'Root / Uncategorized', id: 'root' };
    const found = folders.find((f) => f.id === selectedFolderId);
    return found
      ? { name: found.name, id: found.id }
      : { name: 'Folder', id: selectedFolderId };
  }, [selectedFolderId, folders]);

  const handleToggleSelect = (asset: MediaAsset) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(asset.id)) {
        next.delete(asset.id);
      } else {
        next.add(asset.id);
      }
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    if (selectedAssetIds.size === filteredAssets.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(filteredAssets.map((a) => a.id)));
    }
  };

  const handleDeleteSingle = async (asset: MediaAsset) => {
    try {
      await deleteMediaMutation.mutateAsync(asset.id);
      toast.success(`Deleted ${asset.filename}`);
      setAssetToDelete(null);
      if (selectedAssetForDetail?.id === asset.id) {
        setSelectedAssetForDetail(null);
      }
      setSelectedAssetIds((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedAssetIds);
    if (ids.length === 0) return;

    try {
      setIsBulkDeleting(true);
      await deleteBulkMutation.mutateAsync(ids);
      toast.success(`Deleted ${ids.length} assets`);
      setSelectedAssetIds(new Set());
    } catch {
      toast.error('Failed to delete selected assets');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-sans">
      {/* Groupify Folders Sidebar */}
      <MediaFoldersSidebar
        folders={folders}
        isLoading={isLoadingFolders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={(id) => {
          setSelectedFolderId(id);
          setSelectedAssetIds(new Set());
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Top Header */}
        <header className="px-6 py-5 border-b border-border bg-card/40 backdrop-blur-sm flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                  {currentFolder.name}
                  <span className="text-xs font-semibold text-muted-foreground font-mono px-2.5 py-0.5 rounded-full bg-muted border border-border">
                    {totalCount} items
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Centralized visual asset storage for pages, schemas, and editor
                designs
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-background shadow-xs text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-background shadow-xs text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="List View"
                >
                  <List className="size-4" />
                </button>
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => setShowUploadZone((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                  showUploadZone
                    ? 'border border-border bg-background hover:bg-muted text-foreground'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                <Upload className="size-4" />
                {showUploadZone ? 'Hide Upload Zone' : 'Upload Assets'}
              </button>
            </div>
          </div>
        </header>

        {/* Sub Toolbar: Search, Filters, Bulk Actions */}
        <div className="px-6 py-3 border-b border-border bg-muted/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-sm">
            <div className="relative w-full">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assets by filename or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Select All on Page Button */}
            {filteredAssets.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllOnPage}
                className="px-3 py-1.5 rounded-xl bg-background border border-border hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                title="Select or deselect all visible assets"
              >
                <CheckSquare className="size-3.5 text-primary" />
                <span>
                  {selectedAssetIds.size === filteredAssets.length
                    ? 'Deselect All'
                    : 'Select All'}
                </span>
              </button>
            )}

            {/* Bulk Delete Button when items selected */}
            {selectedAssetIds.size > 0 && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 px-3 py-1 rounded-xl">
                <span className="text-xs text-destructive font-semibold">
                  {selectedAssetIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="p-1 rounded text-destructive hover:bg-destructive/20 flex items-center gap-1 text-xs font-semibold transition-colors"
                  title="Delete selected assets"
                >
                  {isBulkDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Upload Zone */}
        {showUploadZone && (
          <div className="p-6 bg-muted/20 border-b border-border animate-in slide-in-from-top-3 duration-200">
            <div className="max-w-2xl mx-auto">
              <MediaUploadZone
                currentFolderId={selectedFolderId}
                folders={folders}
                onUploadComplete={() => {}}
              />
            </div>
          </div>
        )}

        {/* Assets Infinite Scrolling Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar flex flex-col">
          <MediaGrid
            assets={filteredAssets}
            totalCount={totalCount}
            isLoading={isLoadingMedia}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onFetchNextPage={fetchNextPage}
            viewMode={viewMode}
            selectedAssetIds={selectedAssetIds}
            onToggleSelect={handleToggleSelect}
            onViewDetails={(asset) => setSelectedAssetForDetail(asset)}
            onDelete={(asset) => setAssetToDelete(asset)}
            onOpenUpload={() => setShowUploadZone(true)}
          />
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAssetForDetail && (
        <MediaAssetDetailModal
          asset={selectedAssetForDetail}
          folders={folders}
          onClose={() => setSelectedAssetForDetail(null)}
          onDelete={(asset) => handleDeleteSingle(asset)}
        />
      )}

      {/* Single Delete Confirmation Dialog */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-card-foreground">
            <h3 className="text-base font-bold text-foreground mb-2">
              Delete Visual Asset
            </h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="text-foreground font-semibold">
                &ldquo;{assetToDelete.filename}&rdquo;
              </span>
              ? Pages or components linking to this image will no longer be able
              to display it.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingle(assetToDelete)}
                disabled={deleteMediaMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {deleteMediaMutation.isPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
