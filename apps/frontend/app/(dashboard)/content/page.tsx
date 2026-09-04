import type { Metadata } from 'next';
import { ContentEntriesView } from '@/components/content-editor/content-entries-view';

export const metadata: Metadata = {
  title: 'Content Entries — Agentic CMS',
};

export default function ContentPage() {
  return <ContentEntriesView />;
}
