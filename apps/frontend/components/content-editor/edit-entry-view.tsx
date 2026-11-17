'use client';

import { useQuery } from '@tanstack/react-query';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { getContentEntry } from '@/lib/api/content';
import { Breadcrumbs, Skeleton } from '@repo/shared-ui';
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
    return (
      <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 max-w-full">
        <Skeleton
          variant="text"
          width="220px"
          height="24px"
          className="rounded"
        />
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <Skeleton
            variant="text"
            width="120px"
            height="28px"
            className="rounded"
          />
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
            <Skeleton
              variant="rectangular"
              width="140px"
              height="32px"
              className="rounded-lg"
            />
            <div className="flex gap-2">
              <Skeleton
                variant="rectangular"
                width="90px"
                height="32px"
                className="rounded-lg"
              />
              <Skeleton
                variant="rectangular"
                width="90px"
                height="32px"
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton
                variant="text"
                width="120px"
                height="16px"
                className="rounded"
              />
              <Skeleton
                variant="rectangular"
                width="100%"
                height="40px"
                className="rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Skeleton
                variant="text"
                width="140px"
                height="16px"
                className="rounded"
              />
              <Skeleton
                variant="rectangular"
                width="100%"
                height="40px"
                className="rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    );
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
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <Breadcrumbs
        variant="text"
        size="sm"
        className="p-0 bg-transparent"
        items={[
          { label: 'Content' },
          { label: schema.name, href: `/content/${schema.slug}` },
          { label: title },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-2 border-b border-border/50">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate max-w-full">
          {title}
        </h1>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
          {schema.name}
        </span>
      </div>

      <ContentEntryForm schema={schema} entry={entry} />
    </div>
  );
}
