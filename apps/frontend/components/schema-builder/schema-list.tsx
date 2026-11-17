'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import { Boxes, PlusIcon } from 'lucide-react';
import { listSchemas } from '@/lib/api/schemas';
import { Badge, Button, Card, CardContent, DataTable } from '@repo/shared-ui';
import { SchemaRowActions } from './schema-row-actions';

export function SchemaList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('createdAt:desc');
  const [search, setSearch] = useState('');

  const {
    data: schemasData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['schemas', page, pageSize, sort, search],
    queryFn: () => listSchemas({ page, pageSize, sort, search }),
    placeholderData: keepPreviousData,
  });

  const data = schemasData?.data || [];

  if (isLoading && !schemasData) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full bg-muted/40 animate-pulse rounded-lg" />
        <div className="h-14 w-full bg-muted/30 animate-pulse rounded-lg" />
        <div className="h-14 w-full bg-muted/20 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <p
        role="alert"
        className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl p-4"
      >
        Failed to load content types.
      </p>
    );
  }

  if (!search && data.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-muted/10">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-xl bg-muted p-3 mb-3 text-muted-foreground ring-1 ring-border">
            <Boxes className="size-6" />
          </div>
          <p className="font-semibold text-sm text-foreground mb-1">
            No content types found. Create your first content type to get
            started.
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Content types define the fields, validation rules, and schema for
            your published entries.
          </p>
          <Button asChild size="sm">
            <Link href="/content-types/new">
              <PlusIcon className="size-4 mr-1.5" />
              Create Content Type
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
      <DataTable
        columns={[
          { label: 'Name', key: 'name', sortable: true },
          { label: 'API ID', key: 'slug', sortable: true },
          { label: 'Type', key: 'type', sortable: true },
          { label: 'Fields', key: 'fields', sortable: true },
          { label: 'Localized', key: 'localized', sortable: true },
          { label: 'Actions', key: 'actions', sortable: false, align: 'right' },
        ]}
        rows={data.map((schema) => {
          const isLocalized = schema.definition.fields.some(
            (field) => field.isLocalized,
          );
          return {
            name: (
              <Link
                href={`/content-types/${schema.slug}/edit`}
                className="font-medium text-foreground hover:text-primary no-underline transition-colors cursor-pointer flex items-center gap-2"
                title="Click to edit content type"
              >
                <Boxes className="size-4 text-muted-foreground shrink-0" />
                <span>{schema.name}</span>
              </Link>
            ),
            slug: (
              <code className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                {schema.slug}
              </code>
            ),
            type: (
              <Badge
                variant={schema.type === 'collection' ? 'default' : 'secondary'}
                size="sm"
                className="capitalize text-xs font-medium"
              >
                {schema.type}
              </Badge>
            ),
            fields: (
              <span className="text-muted-foreground text-xs font-mono font-medium">
                {schema.definition.fields.length}
              </span>
            ),
            localized: isLocalized ? (
              <Badge
                variant="outline"
                size="sm"
                className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-[11px] font-medium"
              >
                Yes
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">No</span>
            ),
            actions: (
              <div className="flex items-center justify-end">
                <SchemaRowActions schema={schema} />
              </div>
            ),
          };
        })}
        enableFiltering={true}
        manualFiltering={true}
        searchValue={search}
        filterPlaceholder="Search content types..."
        onSearchChange={(val: string) => {
          setSearch(val);
          setPage(1);
        }}
        enableSorting={true}
        manualSorting={true}
        defaultSortKey={sort.split(':')[0]}
        defaultSortDirection={sort.split(':')[1] as 'asc' | 'desc'}
        onSortChange={(
          key: string | number | symbol,
          direction: 'asc' | 'desc',
        ) => {
          setSort(`${String(key)}:${direction}`);
          setPage(1);
        }}
        enablePagination={true}
        manualPagination={true}
        page={page}
        pageCount={schemasData?.meta?.pagination?.pageCount ?? 1}
        pageSize={pageSize}
        onPageSizeChange={(newSize: number) => setPageSize(newSize)}
        onPageChange={(newPage: number) => setPage(newPage)}
        emptyMessage="No content types match your search query."
      />
    </div>
  );
}
