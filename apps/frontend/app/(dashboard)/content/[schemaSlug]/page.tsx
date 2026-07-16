import { SchemaEntryListView } from '@/components/content-editor/schema-entry-list-view';

export default async function ContentTypeEntriesPage({
  params,
}: {
  params: Promise<{ schemaSlug: string }>;
}) {
  const { schemaSlug } = await params;
  return <SchemaEntryListView schemaSlug={schemaSlug} />;
}
