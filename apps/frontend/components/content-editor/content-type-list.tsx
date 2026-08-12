'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listSchemas } from '@/lib/api/schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shared-ui';

/** Landing page for /content — pick which content type's entries to browse. */
export function ContentTypeList() {
  const {
    data: result,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['schemas'],
    queryFn: () => listSchemas(),
  });

  const data = result?.data;

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">Loading content types…</p>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Failed to load content types.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          No content types exist yet. Create one under Content-Types first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((schema) => (
        <Link key={schema.id} href={`/content/${schema.slug}`}>
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle size="sm" className="truncate" title={schema.name}>
                {schema.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {schema.definition.fields.length} field
              {schema.definition.fields.length === 1 ? '' : 's'}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
