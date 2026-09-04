'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Card, DataTable } from '@repo/shared-ui';
import { listContentEntries } from '@/lib/api/content';
import type { ContentEntryListProps } from '@/types/component.types';
import { pickTitleField } from '@/utils/schema';
import { ContentEntryRowActions } from './content-entry-row-actions';
import { MediaThumbnailCell } from './media-thumbnail-cell';

// Page size is now managed via state
export function ContentEntryList({ schema }: ContentEntryListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updatedAt:desc');

  const titleField = pickTitleField(schema.definition);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['content', schema.slug, page, sort, search],
    queryFn: () =>
      listContentEntries(schema.slug, {
        page,
        pageSize,
        sort,
        filters:
          search && titleField
            ? { [titleField.apiId]: { $contains: search } }
            : undefined,
      }),
    // Every keystroke in search (and every page/sort change) changes the
    // query key — without this, each change would drop straight to
    // isLoading and unmount the whole list (including the search input
    // itself, losing focus mid-typing) until the new page fetches in.
    // Keeping the previous page's data visible during refetch avoids that.
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading entries…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Failed to load entries.
      </p>
    );
  }

  const entries = data?.data ?? [];

  return (
    <div className="grid gap-3">
      <Card>
        <DataTable
          columns={[
            {
              label: titleField?.displayName ?? 'Entry',
              key: titleField?.apiId ?? 'id',
              sortable: true,
            },
            { label: 'Status', key: 'status', sortable: true },
            { label: 'Updated', key: 'updatedAt', sortable: true },
            {
              label: 'Actions',
              key: 'actions',
              sortable: false,
              align: 'right',
            },
          ]}
          rows={entries.map((entry) => {
            const displayTitle =
              titleField && typeof entry.data[titleField.apiId] === 'string'
                ? (entry.data[titleField.apiId] as string)
                : undefined;

            return {
              [titleField?.apiId ?? 'id']:
                titleField?.dataType === 'media' &&
                typeof entry.data[titleField.apiId] === 'string' &&
                entry.data[titleField.apiId] ? (
                  <MediaThumbnailCell
                    assetId={entry.data[titleField.apiId] as string}
                    alt={titleField.displayName}
                  />
                ) : displayTitle ? (
                  <Link
                    href={`/content/${schema.slug}/${entry.id}`}
                    className="font-medium text-foreground hover:text-primary no-underline transition-colors cursor-pointer"
                    title="Click to view/edit entry"
                  >
                    {displayTitle}
                  </Link>
                ) : (
                  <Link
                    href={`/content/${schema.slug}/${entry.id}`}
                    className="font-medium text-muted-foreground hover:text-primary no-underline transition-colors text-xs cursor-pointer"
                    title="Click to view/edit entry"
                  >
                    {entry.id}
                  </Link>
                ),
              status: <span className="capitalize">{entry.status}</span>,
              updatedAt: entry.updatedAt
                ? new Date(entry.updatedAt).toLocaleString()
                : '—',
              actions: (
                <div className="flex items-center justify-end">
                  <ContentEntryRowActions
                    schemaSlug={schema.slug}
                    schemaId={schema.id}
                    entryId={entry.id}
                    title={displayTitle}
                  />
                </div>
              ),
            };
          })}
          enableFiltering={!!titleField}
          manualFiltering={true}
          filterPlaceholder={`Search by ${titleField?.displayName ?? 'Entry'}...`}
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
          pageSize={pageSize}
          onPageSizeChange={(newSize: number) => setPageSize(newSize)}
          pageCount={data?.meta?.pagination?.pageCount ?? 1}
          totalCount={data?.meta?.pagination?.total ?? 0}
          onPageChange={(newPage: number) => setPage(newPage)}
        />
      </Card>
    </div>
  );
}
