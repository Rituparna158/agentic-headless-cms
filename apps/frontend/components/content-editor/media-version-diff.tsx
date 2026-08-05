'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightIcon } from 'lucide-react';
import { getMediaAsset, mediaFileUrl } from '@/lib/api/media';

/**
 * Shows two media thumbnails side-by-side: old version on the left, new on the right.
 */
export function MediaVersionDiff({
  oldId,
  newId,
}: {
  oldId: string;
  newId: string;
}) {
  const { data: oldData } = useQuery({
    queryKey: ['media', 'asset', oldId],
    queryFn: () => getMediaAsset(oldId),
    enabled: !!oldId,
    staleTime: 60_000,
  });
  const { data: newData } = useQuery({
    queryKey: ['media', 'asset', newId],
    queryFn: () => getMediaAsset(newId),
    enabled: !!newId,
    staleTime: 60_000,
  });

  const renderThumb = (
    asset: typeof oldData | typeof newData,
    label: string,
  ) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {asset?.data ? (
        <img
          src={mediaFileUrl(asset.data)}
          alt={asset.data.filename}
          className="border rounded-md object-cover size-24"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex items-center justify-center rounded-md border text-xs size-24">
          {oldId || newId ? 'Loading…' : 'None'}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      {renderThumb(oldData, 'Before')}
      <ArrowRightIcon className="text-muted-foreground shrink-0 size-4" />
      {renderThumb(newData, 'After')}
    </div>
  );
}
