'use client';

import type { MediaAsset } from '@repo/types';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  FileIcon,
  Trash2,
  CheckSquare,
  Square,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Eye,
  Calendar,
  HardDrive,
  Maximize2,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback, type MouseEvent } from 'react';

import { useHasPermission } from '@/hooks/use-permissions';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button, Card, CardContent, Modal } from '@repo/shared-ui';
import {
  bulkDeleteMedia,
  deleteMedia,
  listMedia,
  mediaFileUrl,
} from '@/lib/api/media';

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function AssetThumbnail({
  asset,
  priority = false,
}: {
  asset: MediaAsset;
  priority?: boolean;
}) {
  if (asset.mimeType.startsWith('image/')) {
    return (
      <Image
        src={mediaFileUrl(asset)}
        alt={asset.altText ?? asset.filename}
        fill
        unoptimized
        priority={priority}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="text-muted-foreground flex h-full items-center justify-center bg-muted/40 group-hover:bg-muted/60 transition-colors">
      <FileIcon className="size-8 opacity-70" />
    </div>
  );
}

export function MediaGrid({ folderId }: { folderId?: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [inspectingAsset, setInspectingAsset] = useState<MediaAsset | null>(
    null,
  );
  const [copiedUrl, setCopiedUrl] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['media', page, folderId],
    queryFn: () => listMedia({ page, pageSize, folderId }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setPendingDelete(null);
      if (inspectingAsset?.id === pendingDelete?.id) {
        setInspectingAsset(null);
      }
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteMedia(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
    },
  });

  const canDelete = useHasPermission('delete');

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (assets: MediaAsset[]) => {
      if (selectedIds.size === assets.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(assets.map((a) => a.id)));
      }
    },
    [selectedIds.size],
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleCopyUrl = useCallback((url: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  }, []);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading media…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Failed to load media.
      </p>
    );
  }

  const assets = data?.data ?? [];
  const pagination = data?.meta.pagination;
  const allSelected = assets.length > 0 && selectedIds.size === assets.length;
  const someSelected = selectedIds.size > 0;

  if (assets.length === 0) {
    return (
      <Card className="border border-border/70 shadow-xs">
        <CardContent className="text-muted-foreground py-12 text-center text-sm space-y-2">
          <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground/70 flex items-center justify-center mx-auto mb-2">
            <ImageIcon className="size-6" />
          </div>
          <p className="font-semibold text-foreground text-sm">
            No media files found.
          </p>
          <p className="text-xs text-muted-foreground">
            Upload an asset to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {/* Bulk action toolbar */}
      {canDelete && (
        <div className="flex items-center gap-3 py-2 border-b border-border/60">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => toggleSelectAll(assets)}
            aria-label={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4 text-muted-foreground" />
            )}
            <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
          </button>

          {someSelected && (
            <>
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => setConfirmBulkDelete(true)}
                className="flex items-center gap-1.5 text-xs h-7 px-2.5"
              >
                <Trash2 className="size-3.5" />
                {bulkDeleteMutation.isPending
                  ? 'Deleting…'
                  : `Delete ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}`}
              </Button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <XCircle className="size-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Media Assets Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {assets.map((asset, index) => {
          const isSelected = selectedIds.has(asset.id);
          const extension =
            asset.filename.split('.').pop()?.toUpperCase() || 'FILE';

          return (
            <div
              key={asset.id}
              className="group relative flex flex-col rounded-xl border border-border/70 bg-card overflow-hidden transition-all hover:border-border hover:shadow-xs"
            >
              <div
                className={`relative aspect-square w-full overflow-hidden bg-muted cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
                onClick={() => setInspectingAsset(asset)}
              >
                <AssetThumbnail asset={asset} priority={index < 8} />

                {/* File extension badge */}
                <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-xs text-[10px] font-mono font-medium text-foreground/90 border border-border/50">
                    {extension}
                  </span>
                </div>

                {/* File size badge */}
                {asset.sizeBytes ? (
                  <div className="absolute bottom-1.5 right-1.5 z-10 pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-xs text-[10px] font-mono text-muted-foreground border border-border/50">
                      {formatBytes(asset.sizeBytes)}
                    </span>
                  </div>
                ) : null}

                {/* Checkbox overlay */}
                {canDelete && (
                  <button
                    type="button"
                    className="absolute top-1.5 left-1.5 z-20 rounded bg-background/85 backdrop-blur-xs p-1 hover:bg-background transition-colors cursor-pointer"
                    aria-label={
                      isSelected
                        ? `Deselect ${asset.filename}`
                        : `Select ${asset.filename}`
                    }
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      toggleSelect(asset.id);
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare className="size-3.5 text-primary" />
                    ) : (
                      <Square className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                )}

                {/* Quick inspect overlay button */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="size-8 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow-md">
                    <Eye className="size-4" />
                  </div>
                </div>

                {/* Single delete button */}
                {canDelete && !someSelected && (
                  <span
                    className="absolute top-1.5 right-1.5 z-20 size-7"
                    title={
                      !canDelete ? 'You do not have permission to delete.' : ''
                    }
                  >
                    <Button
                      type="button"
                      variant="danger"
                      size="icon"
                      className="size-7 rounded-md shadow-xs bg-destructive text-white hover:bg-destructive/90"
                      aria-label={`Delete ${asset.filename}`}
                      disabled={!canDelete || deleteMutation.isPending}
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        setPendingDelete(asset);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </span>
                )}
              </div>

              {/* Filename caption */}
              <div
                className="p-2 cursor-pointer"
                onClick={() => setInspectingAsset(asset)}
              >
                <p
                  className="truncate text-xs font-medium text-foreground hover:text-primary transition-colors"
                  title={asset.filename}
                >
                  {asset.filename}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <p>
              Page {pagination.page} of {pagination.pageCount} (
              {pagination.total} files)
            </p>
            <div className="flex items-center gap-2">
              <span>Per page:</span>
              <select
                className="h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[12, 24, 48, 96].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {pagination.pageCount > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page >= pagination.pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* Single-delete confirmation dialog */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this file?"
        description={
          pendingDelete
            ? `"${pendingDelete.filename}" will be permanently deleted. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />

      {/* Bulk-delete confirmation dialog */}
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmBulkDelete(false);
        }}
        title={`Delete ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}?`}
        description={`${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''} will be permanently deleted. This can't be undone.`}
        confirmLabel={`Delete ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}`}
        destructive
        onConfirm={() => {
          bulkDeleteMutation.mutate([...selectedIds]);
        }}
      />

      {/* Asset Preview & Metadata Inspection Modal */}
      {inspectingAsset && (
        <Modal
          isOpen={!!inspectingAsset}
          onClose={() => setInspectingAsset(null)}
          title={inspectingAsset.filename}
          size="lg"
          showFooter={false}
        >
          <div className="space-y-4 pt-1">
            {/* Visual Canvas */}
            <div className="relative aspect-video w-full rounded-xl bg-muted/60 overflow-hidden flex items-center justify-center border border-border/70">
              {inspectingAsset.mimeType.startsWith('image/') ? (
                <Image
                  src={mediaFileUrl(inspectingAsset)}
                  alt={inspectingAsset.altText ?? inspectingAsset.filename}
                  fill
                  unoptimized
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileIcon className="size-16" />
                  <span className="text-xs font-mono uppercase">
                    {inspectingAsset.mimeType}
                  </span>
                </div>
              )}
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-1">
                  <HardDrive className="size-3.5" />
                  <span>File Size</span>
                </div>
                <div className="font-semibold text-xs text-foreground">
                  {formatBytes(inspectingAsset.sizeBytes)}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-1">
                  <Maximize2 className="size-3.5" />
                  <span>Dimensions</span>
                </div>
                <div className="font-semibold text-xs text-foreground">
                  {inspectingAsset.width && inspectingAsset.height
                    ? `${inspectingAsset.width} × ${inspectingAsset.height} px`
                    : 'N/A'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-1">
                  <Calendar className="size-3.5" />
                  <span>Uploaded</span>
                </div>
                <div className="font-semibold text-xs text-foreground">
                  {new Date(inspectingAsset.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-1">
                  <FileIcon className="size-3.5" />
                  <span>MIME Type</span>
                </div>
                <div
                  className="font-semibold text-xs text-foreground truncate"
                  title={inspectingAsset.mimeType}
                >
                  {inspectingAsset.mimeType}
                </div>
              </div>
            </div>

            {/* Public URL & Quick Actions */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-foreground">
                Public URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={mediaFileUrl(inspectingAsset)}
                  className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-border/80 bg-muted/30 font-mono text-muted-foreground select-all outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs shrink-0"
                  onClick={() => handleCopyUrl(mediaFileUrl(inspectingAsset))}
                >
                  {copiedUrl ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs shrink-0"
                >
                  <a
                    href={mediaFileUrl(inspectingAsset)}
                    target="_blank"
                    rel="noreferrer"
                    title="Open in new tab"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Footer action to delete from modal */}
            {canDelete && (
              <div className="pt-2 border-t border-border/60 flex justify-between items-center">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const toDelete = inspectingAsset;
                    setPendingDelete(toDelete);
                  }}
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete File</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setInspectingAsset(null)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
