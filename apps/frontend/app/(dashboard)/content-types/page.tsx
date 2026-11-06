import type { Metadata } from 'next';
import { Breadcrumbs } from '@repo/shared-ui';
import { SchemaList } from '@/components/schema-builder/schema-list';
import { ContentTypeHeader } from '@/components/schema-builder/content-type-header';

export const metadata: Metadata = {
  title: 'Content Type Builder — Agentic CMS',
};

export default function ContentTypesPage() {
  return (
    <div className="grid gap-6">
      <Breadcrumbs
        variant="text"
        size="sm"
        className="p-0 bg-transparent"
        items={[{ label: 'Content Type Builder' }]}
      />
      <ContentTypeHeader />
      <SchemaList />
    </div>
  );
}
