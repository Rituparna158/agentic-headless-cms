import { NewEntryView } from '@/components/content-editor/new-entry-view';

export default async function NewContentEntryPage({
  params,
}: {
  params: Promise<{ schemaSlug: string }>;
}) {
  const { schemaSlug } = await params;
  return <NewEntryView schemaSlug={schemaSlug} />;
}
