'use client';

import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { Button } from '@repo/shared-ui';
import { ContentEntryList } from './content-entry-list';

export function SchemaEntryListView({ schemaSlug }: { schemaSlug: string }) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{schema.name}</h1>
        <Button asChild>
          <Link href={`/content/${schema.slug}/new`}>
            <PlusIcon className="size-4" />
            New Entry
          </Link>
        </Button>
      </div>

      <ContentEntryList schema={schema} />
    </div>
  );
}
