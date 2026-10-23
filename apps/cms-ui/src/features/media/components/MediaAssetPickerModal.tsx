import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Upload,
  Folder,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { useInfiniteMedia, useMediaFolders } from '../hooks/useMediaQueries';
import type {
  MediaAsset,
  MediaAssetPickerModalProps,
} from '../types/media.types';
import { MediaGrid } from './MediaGrid';
import { MediaUploadZone } from './MediaUploadZone';

export const MediaAssetPickerModal: React.FC<MediaAssetPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Visual Asset',
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  // Queries
  const { data: foldersData } = useMediaFolders();
  const folders = foldersData || [];

  const {
    data: mediaData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMedia({
    folderId: selectedFolderId,
    pageSize: 24,
  });

  const allAssets = useMemo(() => {
    if (!mediaData?.pages) return [];
    return mediaData.pages.flatMap((page) => page.data);
  }, [mediaData]);

  // Client-side search filter
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

  const selectedAssetIds = useMemo(() => {
    return new Set(selectedAsset ? [selectedAsset.id] : []);
  }, [selectedAsset]);

  if (!isOpen) return null;

  const handleSelectAndInsert = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  const handleUploadComplete = (newAsset: MediaAsset) => {
    setSelectedAsset(newAsset);
    setActiveTab('library');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl text-card-foreground">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ImageIcon className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">
                Choose an asset from your central library or upload a new one
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Selector & Controls */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex bg-muted p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'library'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Media Library
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload className="size-3.5" />
                Upload New
              </button>
            </div>
          </div>

          {activeTab === 'library' && (
            <div className="flex items-center gap-3 flex-1 justify-end max-w-md">
              {/* Folder Selector */}
              <div className="relative flex items-center">
                <Folder className="size-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
                <select
                  value={selectedFolderId || ''}
                  onChange={(e) =>
                    setSelectedFolderId(e.target.value || undefined)
                  }
                  className="pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Folders</option>
                  <option value="root">Root / Uncategorized</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
          {activeTab === 'library' ? (
            <MediaGrid
              assets={filteredAssets}
              totalCount={totalCount}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onFetchNextPage={fetchNextPage}
              selectedAssetIds={selectedAssetIds}
              onToggleSelect={(asset) => setSelectedAsset(asset)}
              onViewDetails={(asset) => setSelectedAsset(asset)}
              onSelect={(asset) => {
                setSelectedAsset(asset);
                onSelect(asset);
                onClose();
              }}
              onOpenUpload={() => setActiveTab('upload')}
              isPickerMode
            />
          ) : (
            <div className="max-w-xl mx-auto py-6">
              <MediaUploadZone
                currentFolderId={selectedFolderId}
                folders={folders}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {selectedAsset ? (
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Check className="size-4 text-primary" />
                Selected: {selectedAsset.filename}
              </span>
            ) : (
              <span>Click any asset above to select it</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSelectAndInsert}
              disabled={!selectedAsset}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
            >
              Select & Insert Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
