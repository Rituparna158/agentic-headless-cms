'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { FileIcon, Trash2 } from 'lucide-react';

import {
  deleteMedia,
  listMedia,
  mediaFileUrl,
  type MediaAsset,
} from '@/lib/api/media';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PAGE_SIZE = 24;

function AssetThumbnail({ asset }: { asset: MediaAsset }) {
  if (asset.mimeType.startsWith('image/')) {
    return (
      <Image
        src={mediaFileUrl(asset)}
        alt={asset.altText ?? asset.filename}
        fill
        unoptimized
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

export function MediaGrid() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['media', page],
    queryFn: () => listMedia({ page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

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
        {assets.map((asset) => (
          <div key={asset.id} className="grid gap-1">
            <div className="bg-muted relative aspect-square overflow-hidden rounded-md border">
              <AssetThumbnail asset={asset} />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 size-7"
                aria-label={`Delete ${asset.filename}`}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(asset.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
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
    </div>
  );
}
