import { EditSchemaView } from '@/components/schema-builder/edit-schema-view';

export default async function EditContentTypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EditSchemaView slug={slug} />;
}
