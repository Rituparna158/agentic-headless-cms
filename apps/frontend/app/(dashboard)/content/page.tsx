import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ContentEntriesView } from '@/components/content-editor/content-entries-view';

export const metadata: Metadata = {
  title: 'Content Entries — Agentic CMS',
};

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-muted-foreground">
          Loading content entries...
        </div>
      }
    >
      <ContentEntriesView />
    </Suspense>
  );
}
