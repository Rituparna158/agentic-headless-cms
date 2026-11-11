'use client';

import Link from 'next/link';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@repo/shared-ui';
import { useHasPermission } from '@/hooks/use-permissions';
import { ShieldAlert } from 'lucide-react';
import { ContentEntryForm } from './content-entry-form';

export function NewEntryView({ schemaSlug }: { schemaSlug: string }) {
  const { schema, isLoading, isError } = useSchemaBySlug(schemaSlug);
  const canCreate = useHasPermission('create', schema?.id);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 max-w-full">
        <Skeleton
          variant="text"
          width="180px"
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

  if (!canCreate) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 bg-muted/10">
        <Card className="max-w-md text-center border-dashed p-4">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <ShieldAlert className="h-10 w-10 text-amber-500" />
            </div>
            <CardTitle>View-Only Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your role only has view permissions for &quot;{schema.name}&quot;.
              You cannot create new entries.
            </p>
            <Button asChild variant="outline">
              <Link href={`/content?type=${schema.slug}`}>
                Back to {schema.name}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <Breadcrumbs
        variant="text"
        size="sm"
        className="p-0 bg-transparent"
        items={[
          { label: 'Content' },
          { label: schema.name, href: `/content/${schema.slug}` },
          { label: 'New' },
        ]}
      />

      <div className="pb-2 border-b border-border/50">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
            New {schema.name}
          </h1>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
            Draft
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Populate the fields below to create a new content entry.
        </p>
      </div>

      <ContentEntryForm schema={schema} />
    </div>
  );
}
