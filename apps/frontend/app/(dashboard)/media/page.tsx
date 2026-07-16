import type { Metadata } from 'next';
import { MediaLibraryView } from '@/components/media/media-library-view';

export const metadata: Metadata = {
  title: 'Media — Agentic CMS',
};

export default function MediaPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Media</h1>
      <MediaLibraryView />
    </div>
  );
}
