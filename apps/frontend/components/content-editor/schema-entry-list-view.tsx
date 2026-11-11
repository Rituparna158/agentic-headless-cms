'use client';

import Link from 'next/link';
import { FileText, PlusIcon } from 'lucide-react';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { Breadcrumbs, Button } from '@repo/shared-ui';
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
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full overflow-hidden">
      <Breadcrumbs
        variant="text"
        size="sm"
        className="p-0 bg-transparent"
        items={[{ label: 'Content' }, { label: schema.name }]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="size-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
              {schema.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and publish entries for {schema.name}.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 w-fit">
          <Link href={`/content/${schema.slug}/new`}>
            <PlusIcon className="size-4 mr-1.5" />
            New Entry
          </Link>
        </Button>
      </div>

      <ContentEntryList schema={schema} />
    </div>
  );
}
