'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PencilIcon } from 'lucide-react';
import { listSchemas } from '@/lib/api/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SchemaRowActions } from './schema-row-actions';

export function SchemaList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['schemas'],
    queryFn: listSchemas,
  });

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
          No content types yet. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API ID</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Fields</TableHead>
            <TableHead>Localized</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((schema) => {
            const isLocalized = schema.definition.fields.some(
              (field) => field.isLocalized,
            );
            return (
              <TableRow key={schema.id}>
                <TableCell className="font-medium">{schema.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {schema.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {schema.type}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {schema.definition.fields.length}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {isLocalized ? 'Yes' : 'No'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        href={`/content-types/${schema.slug}/edit`}
                        title="Edit content type"
                      >
                        <PencilIcon className="size-4" />
                      </Link>
                    </Button>
                    <SchemaRowActions schema={schema} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
