'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/shared-ui';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { SchemaBuilderForm } from './schema-builder-form';

export function EditSchemaView({ slug }: { slug: string }) {
  const { schema, isLoading, isError } = useSchemaBySlug(slug);

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">Loading content type…</p>
    );
  }

  if (isError || !schema) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Content type &quot;{slug}&quot; was not found.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Edit {schema.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <SchemaBuilderForm schema={schema} />
        </CardContent>
      </Card>
    </div>
  );
}
