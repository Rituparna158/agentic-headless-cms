'use client';

import { useQuery } from '@tanstack/react-query';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { getContentEntry } from '@/lib/api/content';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shared-ui';
import { ContentEntryForm } from './content-entry-form';

export function EditEntryView({
  schemaSlug,
  entryId,
}: {
  schemaSlug: string;
  entryId: string;
}) {
  const {
    schema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
  } = useSchemaBySlug(schemaSlug);

  const {
    data: entry,
    isLoading: isEntryLoading,
    isError: isEntryError,
  } = useQuery({
    queryKey: ['content', schemaSlug, 'entry', entryId],
    queryFn: () => getContentEntry(schemaSlug, entryId),
  });

  if (isSchemaLoading || isEntryLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (isSchemaError || !schema) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Content type &quot;{schemaSlug}&quot; was not found.
      </p>
    );
  }

  if (isEntryError || !entry) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Entry not found.
      </p>
    );
  }

  const titleField = schema.definition.fields.find(
    (f) => f.dataType === 'text' || f.dataType === 'richtext',
  );
  const title =
    titleField && typeof entry.data[titleField.apiId] === 'string'
      ? (entry.data[titleField.apiId] as string)
      : entry.id;

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentEntryForm schema={schema} entry={entry} />
        </CardContent>
      </Card>
    </div>
  );
}
