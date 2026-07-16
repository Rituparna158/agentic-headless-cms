'use client';

import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentEntryForm } from './content-entry-form';

export function NewEntryView({ schemaSlug }: { schemaSlug: string }) {
  const { schema, isLoading, isError } = useSchemaBySlug(schemaSlug);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (isError || !schema) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Content type &quot;{schemaSlug}&quot; was not found.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">New {schema.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentEntryForm schema={schema} />
        </CardContent>
      </Card>
    </div>
  );
}
