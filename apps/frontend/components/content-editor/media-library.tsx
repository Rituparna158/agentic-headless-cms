'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon, CheckIcon, UploadIcon } from 'lucide-react';

import { listMedia, mediaFileUrl } from '@/lib/api/media';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { MediaAsset } from '@repo/types';
import type { MediaLibraryProps } from '@/types/component.types';

export function MediaLibrary({ selectedId, onSelect }: MediaLibraryProps) {
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['media', 'picker-list'],
    queryFn: () => listMedia({ pageSize: 100 }),
  });

  const assets: MediaAsset[] = data?.data ?? [];

  const filtered = search
    ? assets.filter((a) =>
        a.filename.toLowerCase().includes(search.toLowerCase()),
      )
    : assets;

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Asset grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-12 text-center">
          <UploadIcon className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {search ? 'No assets match your search' : 'No media assets yet'}
          </p>
          <p className="text-xs text-muted-foreground">
            Upload files from the Media section first.
          </p>
        </div>
      ) : (
        <div className="grid max-h-[420px] grid-cols-4 gap-3 overflow-y-auto pr-1">
          {filtered.map((asset) => {
            const isSelected = asset.id === selectedId;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelect(asset)}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-lg border-2 text-left transition-all',
                  'hover:border-primary/60 hover:shadow-sm',
                  isSelected
                    ? 'border-primary shadow-md'
                    : 'border-border bg-muted/30',
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  <img
                    src={mediaFileUrl(asset)}
                    alt={asset.altText ?? asset.filename}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />

                  {/* Selected overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                        <CheckIcon className="size-3.5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Filename */}
                <p className="truncate px-2 py-1.5 text-xs font-medium">
                  {asset.filename}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-right text-xs text-muted-foreground">
        {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
