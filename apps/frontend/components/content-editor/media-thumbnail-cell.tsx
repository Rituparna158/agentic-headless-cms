'use client';

import { useQuery } from '@tanstack/react-query';
import { getMediaAsset, mediaFileUrl } from '@/lib/api/media';

export function MediaThumbnailCell({
  assetId,
  alt,
}: {
  assetId: string;
  alt: string;
}) {
  const { data } = useQuery({
    queryKey: ['media', 'asset', assetId],
    queryFn: () => getMediaAsset(assetId),
    staleTime: 60_000,
  });

  if (!data?.data) {
    return (
      <span className="text-muted-foreground text-xs italic">Loading…</span>
    );
  }

  return (
    <img
      src={mediaFileUrl(data.data)}
      alt={alt}
      className="size-10 rounded object-cover"
    />
  );
}
