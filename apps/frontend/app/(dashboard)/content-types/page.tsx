import type { Metadata } from 'next';
import { SchemaList } from '@/components/schema-builder/schema-list';
import { ContentTypeHeader } from '@/components/schema-builder/content-type-header';

export const metadata: Metadata = {
  title: 'Content Type Builder — Agentic CMS',
};

export default function ContentTypesPage() {
  return (
    <div className="grid gap-6">
      <ContentTypeHeader />
      <SchemaList />
    </div>
  );
}
