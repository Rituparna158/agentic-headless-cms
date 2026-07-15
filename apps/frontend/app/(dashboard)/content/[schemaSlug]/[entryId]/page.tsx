import { EditEntryView } from '@/components/content-editor/edit-entry-view';

export default async function EditContentEntryPage({
  params,
}: {
  params: Promise<{ schemaSlug: string; entryId: string }>;
}) {
  const { schemaSlug, entryId } = await params;
  return <EditEntryView schemaSlug={schemaSlug} entryId={entryId} />;
}
