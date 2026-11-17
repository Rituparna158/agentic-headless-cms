'use client';

import { Breadcrumbs } from '@repo/shared-ui';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { SchemaBuilderForm } from './schema-builder-form';

export function EditSchemaView({ slug }: { slug: string }) {
  const { schema, isLoading, isError } = useSchemaBySlug(slug);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0">
        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        <div className="h-8 w-60 bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted/30 animate-pulse rounded-xl border border-border/60" />
      </div>
    );
  }

  if (isError || !schema) {
    return (
      <p
        role="alert"
        className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl p-4"
      >
        Content type &quot;{slug}&quot; was not found.
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 max-w-full">
      <Breadcrumbs
        variant="text"
        size="sm"
        className="p-0 bg-transparent"
        items={[
          { label: 'Content Type Builder', href: '/content-types' },
          { label: schema.name },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-2 border-b border-border/50">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
          Edit {schema.name}
        </h1>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 shrink-0">
          {schema.slug}
        </span>
      </div>

      <SchemaBuilderForm schema={schema} />
    </div>
  );
}
