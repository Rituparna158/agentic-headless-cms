'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LayersIcon, PlusIcon } from 'lucide-react';
import { listSchemas } from '@/lib/api/schemas';
import { Button, Card, CardContent } from '@repo/shared-ui';
import { ContentEntryList } from './content-entry-list';

export function ContentEntriesView() {
  const searchParams = useSearchParams();
  const activeTypeSlug = searchParams?.get('type');

  const {
    data: schemasData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['schemas'],
    queryFn: () => listSchemas({ pageSize: 100 }),
  });

  const schemas = useMemo(() => schemasData?.data ?? [], [schemasData]);

  // Determine active schema (from query param or default to first available schema)
  const activeSchema = useMemo(() => {
    if (!schemas.length) return null;
    if (activeTypeSlug) {
      const match = schemas.find((s) => s.slug === activeTypeSlug);
      if (match) return match;
    }
    return schemas[0];
  }, [schemas, activeTypeSlug]);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Loading content entries…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Failed to load content types.
      </p>
    );
  }

  if (!schemas.length || !activeSchema) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Content Entries</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <LayersIcon className="text-muted-foreground size-6" />
            </div>
            <div className="grid gap-1">
              <h3 className="font-semibold text-lg">
                No content types defined
              </h3>
              <p className="text-muted-foreground text-sm">
                Create a Content Type first before managing content entries.
              </p>
            </div>
            <Button asChild>
              <Link href="/content-types/new">
                <PlusIcon className="size-4 mr-2" />
                Create Content Type
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 w-full">
      {/* 100% Full-Width Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{activeSchema.name}</h1>
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
              {activeSchema.slug}
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Managing entries for content type &quot;{activeSchema.name}&quot; (
            {activeSchema.definition.fields.length} fields)
          </p>
        </div>

        <Button asChild>
          <Link href={`/content/${activeSchema.slug}/new`}>
            <PlusIcon className="size-4 mr-2" />
            New {activeSchema.name} Entry
          </Link>
        </Button>
      </div>

      {/* 100% Full-Width Ignix UI Data Table */}
      <ContentEntryList key={activeSchema.id} schema={activeSchema} />
    </div>
  );
}
