import { activateOnKey } from '@/utils/a11y.util';
import React, { useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon, Upload, Tag } from 'lucide-react';
import type { MediaGridProps } from '../types/media.types';
import { MediaAssetCard } from './MediaAssetCard';
import {
  formatBytes,
  formatDate,
  getFileExtension,
  getMediaFileUrl,
} from '../utils/media.util';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

export const MediaGrid: React.FC<MediaGridProps> = ({
  assets,
  totalCount,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onFetchNextPage,
  viewMode = 'grid',
  selectedAssetIds,
  onToggleSelect,
  onViewDetails,
  onDelete,
  onSelect,
  onOpenUpload,
  isPickerMode = false,
  className = '',
  getAssetSites,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll trigger via Intersection Observer
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first &&
          first.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          onFetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  if (isLoading && assets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground min-h-[300px]">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-medium text-muted-foreground">
          Loading visual assets...
        </p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[360px]">
        <EmptyStateCard
          icon={ImageIcon}
          title="No visual assets in this section"
          description="Upload images, graphics, and visual media to store and manage them centrally for your sites, pages, and components."
          actionLabel={onOpenUpload ? 'Upload Visual Asset' : undefined}
          onAction={onOpenUpload}
          actionIcon={Upload}
          tip="Supports SVG, PNG, JPG, WebP, GIF, or Video up to 10MB"
          className="max-w-lg w-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar ${className}`}
    >
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-1">
          {assets.map((asset) => (
            <MediaAssetCard
              key={asset.id}
              asset={asset}
              isSelected={selectedAssetIds.has(asset.id)}
              onToggleSelect={onToggleSelect}
              onViewDetails={onViewDetails}
              onDelete={onDelete}
              onSelect={onSelect}
              isPickerMode={isPickerMode}
              usedInSites={getAssetSites ? getAssetSites(asset) : []}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2 p-1">
          {assets.map((asset) => {
            const isSelected = selectedAssetIds.has(asset.id);
            const fullUrl = getMediaFileUrl(asset.url);
            return (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- card holds its own controls, so it cannot be role=button
              <div
                key={asset.id}
                role="group"
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above
                tabIndex={0}
                aria-label={asset.filename}
                onClick={() =>
                  onSelect ? onSelect(asset) : onViewDetails(asset)
                }
                onKeyDown={activateOnKey(() =>
                  onSelect ? onSelect(asset) : onViewDetails(asset),
                )}
                className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/30'
                    : 'bg-card border-border hover:bg-muted/40 text-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(asset)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-border text-primary focus:ring-primary"
                />

                <div className="size-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={fullUrl}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {asset.filename}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {getFileExtension(asset.filename)} &bull;{' '}
                    {formatBytes(asset.sizeBytes)}
                    {asset.width &&
                      asset.height &&
                      ` &bull; ${asset.width}×${asset.height}px`}
                  </p>
                </div>

                {/* Usage Badge in List View */}
                {(() => {
                  const sites = getAssetSites ? getAssetSites(asset) : [];
                  return sites.length > 0 ? (
                    <span
                      className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 max-w-[150px] truncate"
                      title={`Used on: ${sites.join(', ')}`}
                    >
                      <Tag className="size-2.5 shrink-0" />
                      <span className="truncate">{sites.join(', ')}</span>
                    </span>
                  ) : (
                    <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/60">
                      <Tag className="size-2.5 shrink-0" />
                      <span>Unused</span>
                    </span>
                  );
                })()}

                <div className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                  {formatDate(asset.createdAt)}
                </div>

                {isPickerMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelect) onSelect(asset);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs"
                  >
                    Select
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div
        ref={sentinelRef}
        className="py-8 flex flex-col items-center justify-center text-xs text-muted-foreground"
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Loading more visual assets...</span>
          </div>
        ) : hasNextPage ? (
          <button
            type="button"
            onClick={onFetchNextPage}
            className="text-primary hover:underline font-semibold"
          >
            Load more assets ({assets.length} of {totalCount})
          </button>
        ) : (
          <span className="text-muted-foreground font-medium">
            Showing all {totalCount} assets &bull; Infinite scroll complete
          </span>
        )}
      </div>
    </div>
  );
};
