'use client';

import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@repo/shared-ui';
import { ContentEntryForm } from './content-entry-form';

export function NewEntryView({ schemaSlug }: { schemaSlug: string }) {
  const { schema, isLoading, isError } = useSchemaBySlug(schemaSlug);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton
          variant="text"
          width="180px"
          height="32px"
          className="rounded"
        />
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <Skeleton
            variant="text"
            width="80px"
            height="24px"
            className="rounded"
          />
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
