'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import { PencilIcon } from 'lucide-react';
import { listSchemas } from '@/lib/api/schemas';
import { Button, Card, CardContent, DataTable } from '@repo/shared-ui';
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

  if (!search && data.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          No content types yet. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <DataTable
      columns={[
        { label: 'Name', key: 'name', sortable: true },
        { label: 'API ID', key: 'slug', sortable: true },
        { label: 'Kind', key: 'kind', sortable: true },
        { label: 'Fields', key: 'fields', sortable: true },
        { label: 'Localized', key: 'localized', sortable: true },
        { label: 'Actions', key: 'actions', sortable: false },
      ]}
      rows={data.map((schema) => {
        const isLocalized = schema.definition.fields.some(
          (field) => field.isLocalized,
        );
        return {
          name: <span className="font-medium">{schema.name}</span>,
          slug: <span className="text-muted-foreground">{schema.slug}</span>,
          kind: <span className="text-muted-foreground">{schema.type}</span>,
          fields: (
            <span className="text-muted-foreground">
              {schema.definition.fields.length}
            </span>
          ),
          localized: (
            <span className="text-muted-foreground">
              {isLocalized ? 'Yes' : 'No'}
            </span>
          ),
          actions: (
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
  );
}
