'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon, Trash2Icon, PencilIcon } from 'lucide-react';

import { getMediaAsset, mediaFileUrl } from '@/lib/api/media';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import type { MediaPickerFieldProps } from '@/types/component.types';
import type { MediaAsset } from '@repo/types';
import { MediaLibrary } from './media-library';

//Media Picker Field

export function MediaPickerField({
  value,
  onChange,
  disabled,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: MediaPickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const { data: selectedData } = useQuery({
    queryKey: ['media', 'asset', value],
    queryFn: () => getMediaAsset(value),
    enabled: !!value,
    staleTime: 60_000,
  });

  const selected: MediaAsset | null = selectedData?.data ?? null;

  function handleSelect(asset: MediaAsset) {
    onChange(asset.id);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
  }

  return (
    <Dialog open={open} onOpenChange={disabled ? undefined : setOpen}>
      <div
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      >
        {selected ? (
          /*Selected state: thumbnail card */
          <div
            className={cn(
              'group relative flex items-center gap-4 rounded-lg border bg-muted/30 p-3',
              ariaInvalid && 'border-destructive',
              disabled && 'opacity-50',
            )}
          >
            {/* Thumbnail */}
            <div className="size-16 shrink-0 relative overflow-hidden rounded-md bg-muted">
              <Image
                unoptimized
                fill
                src={mediaFileUrl(selected)}
                alt={selected.altText ?? selected.filename}
                className="object-cover"
              />
            </div>

            {/* File info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {selected.filename}
              </p>
              {selected.mimeType && (
                <p className="text-xs text-muted-foreground">
                  {selected.mimeType}
                </p>
              )}
            </div>

            {/* Actions */}
            {!disabled && (
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    title="Change asset"
                  >
                    <PencilIcon className="size-3.5" />
                    <span className="sr-only">Change</span>
                  </Button>
                </DialogTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  title="Remove asset"
                  onClick={handleClear}
                >
                  <Trash2Icon className="size-3.5" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          /*Empty state: dashed Add button */
          <DialogTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-muted-foreground transition-colors',
                'hover:border-primary/50 hover:bg-muted/30 hover:text-foreground',
                'disabled:cursor-not-allowed disabled:opacity-50',
                ariaInvalid && 'border-destructive',
              )}
            >
              <ImageIcon className="size-8" />
              <span className="text-sm font-medium">Add asset</span>
              <span className="text-xs">Click to browse the media library</span>
            </button>
          </DialogTrigger>
        )}
      </div>

      {/* Media Library Modal */}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        <MediaLibrary selectedId={value} onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
}
