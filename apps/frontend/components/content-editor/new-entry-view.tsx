'use client';

import Link from 'next/link';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';
import { useHasPermission } from '@/hooks/use-permissions';
import { ShieldAlert } from 'lucide-react';
import { ContentEntryForm } from './content-entry-form';

export function NewEntryView({ schemaSlug }: { schemaSlug: string }) {
  const { schema, isLoading, isError } = useSchemaBySlug(schemaSlug);
  const canCreate = useHasPermission('create', schema?.id);

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
