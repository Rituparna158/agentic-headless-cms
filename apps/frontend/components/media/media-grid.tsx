'use client';

import type { MediaAsset } from '@repo/types';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { FileIcon, Trash2, CheckSquare, Square, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback } from 'react';

import { useHasPermission } from '@/hooks/use-permissions';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@repo/shared-ui';
import { Card, CardContent } from '@repo/shared-ui';
import {
  bulkDeleteMedia,
  deleteMedia,
  listMedia,
  mediaFileUrl,
} from '@/lib/api/media';

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
        className="object-cover"
      />
    );
  }

  return (
    <div className="text-muted-foreground flex h-full items-center justify-center">
      <FileIcon className="size-8" />
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
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          No media yet. Upload a file to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {/* Bulk action toolbar */}
      {canDelete && (
        <div className="flex items-center gap-3 py-2 border-b">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => toggleSelectAll(assets)}
            aria-label={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4" />
            )}
            <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
          </button>

          {someSelected && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => setConfirmBulkDelete(true)}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="size-3.5" />
                {bulkDeleteMutation.isPending
                  ? 'Deleting…'
                  : `Delete ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}`}
              </Button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <XCircle className="size-4" />
              </button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {assets.map((asset, index) => {
          const isSelected = selectedIds.has(asset.id);
          return (
            <div key={asset.id} className="grid gap-1">
              <div
                className={`bg-muted relative aspect-square overflow-hidden rounded-md border transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1'
                    : 'hover:ring-1 hover:ring-muted-foreground/30'
                }`}
              >
                <AssetThumbnail asset={asset} priority={index < 8} />

                {/* Checkbox overlay (always visible for canDelete users) */}
                {canDelete && (
                  <button
                    type="button"
                    className="absolute top-1 left-1 z-10 rounded bg-background/70 p-0.5 hover:bg-background transition-colors"
                    aria-label={
                      isSelected
                        ? `Deselect ${asset.filename}`
                        : `Select ${asset.filename}`
                    }
                    onClick={() => toggleSelect(asset.id)}
                  >
                    {isSelected ? (
                      <CheckSquare className="size-4 text-primary" />
                    ) : (
                      <Square className="size-4 text-muted-foreground" />
                    )}
                  </button>
                )}

                {/* Single delete button (only visible when nothing is selected) */}
                {canDelete && !someSelected && (
                  <span
                    className="absolute top-1 right-1 size-7"
                    title={
                      !canDelete ? 'You do not have permission to delete.' : ''
                    }
                  >
                    <Button
                      type="button"
                      variant="danger"
                      size="icon"
                      className="size-full"
                      aria-label={`Delete ${asset.filename}`}
                      disabled={!canDelete || deleteMutation.isPending}
                      onClick={() => setPendingDelete(asset)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </span>
                )}
              </div>
              <p className="truncate text-xs" title={asset.filename}>
                {asset.filename}
              </p>
            </div>
          );
        })}
      </div>

      {pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <p>
              Page {pagination.page} of {pagination.pageCount} (
              {pagination.total} files)
            </p>
            <div className="flex items-center gap-2">
              <span>Per page:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* Single-delete confirmation */}
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

      {/* Bulk-delete confirmation */}
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
    </div>
  );
}
