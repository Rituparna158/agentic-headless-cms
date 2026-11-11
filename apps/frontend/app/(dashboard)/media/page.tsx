import type { Metadata } from 'next';
import { Image as ImageIcon } from 'lucide-react';
import { MediaLibraryView } from '@/components/media/media-library-view';

export const metadata: Metadata = {
  title: 'Media Library — Headless CMS',
};

export default function MediaPage() {
  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ImageIcon className="size-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Media Library
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Upload, organize, and manage image, video, and document assets across
          folders.
        </p>
      </div>

      <MediaLibraryView />
    </div>
  );
}
