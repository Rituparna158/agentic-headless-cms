'use client';

import type { MediaAsset } from '@repo/types';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { FileIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { useHasPermission } from '@/hooks/use-permissions';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@repo/shared-ui';
import { Card, CardContent } from '@repo/shared-ui';
import { deleteMedia, listMedia, mediaFileUrl } from '@/lib/api/media';

const PAGE_SIZE = 24;

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
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['media', page, folderId],
    queryFn: () => listMedia({ page, pageSize: PAGE_SIZE, folderId }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setPendingDelete(null);
    },
  });

  const canDelete = useHasPermission('delete');

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {assets.map((asset, index) => (
          <div key={asset.id} className="grid gap-1">
            <div className="bg-muted relative aspect-square overflow-hidden rounded-md border">
              <AssetThumbnail asset={asset} priority={index < 8} />
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
            </div>
            <p className="truncate text-xs" title={asset.filename}>
              {asset.filename}
            </p>
          </div>
        ))}
      </div>

      {pagination && pagination.pageCount > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {pagination.page} of {pagination.pageCount} ({pagination.total}{' '}
            files)
          </p>
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
        </div>
      ) : null}

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
    </div>
  );
}
