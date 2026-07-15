import type { Metadata } from 'next';
import { ContentTypeList } from '@/components/content-editor/content-type-list';

export const metadata: Metadata = {
  title: 'Content — Agentic CMS',
};

export default function ContentPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Content</h1>
      <ContentTypeList />
    </div>
  );
}
