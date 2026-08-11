'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Button, Card } from '@repo/shared-ui';
import { useHasPermission } from '@/hooks/use-permissions';
import { deleteContentEntry, listContentEntries } from '@/lib/api/content';
import type { ContentEntryListProps } from '@/types/component.types';
import { pickTitleField } from '@/utils/schema';
import { MediaThumbnailCell } from './media-thumbnail-cell';
import { DataTable } from '@repo/shared-ui';

const PAGE_SIZE = 25;

export function ContentEntryList({ schema }: ContentEntryListProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updatedAt:desc');

  const titleField = pickTitleField(schema.definition);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['content', schema.slug, page, sort, search],
    queryFn: () =>
      listContentEntries(schema.slug, {
        page,
        pageSize: PAGE_SIZE,
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

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteContentEntry(schema.slug, entryId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['content', schema.slug] }),
  });

  const canDelete = useHasPermission('delete', schema.id);

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
            { label: 'Actions', key: 'actions', sortable: false },
          ]}
          rows={entries.map((entry) => ({
            [titleField?.apiId ?? 'id']:
              titleField?.dataType === 'media' &&
              typeof entry.data[titleField.apiId] === 'string' &&
              entry.data[titleField.apiId] ? (
                <MediaThumbnailCell
                  assetId={entry.data[titleField.apiId] as string}
                  alt={titleField.displayName}
                />
              ) : titleField &&
                typeof entry.data[titleField.apiId] === 'string' ? (
                (entry.data[titleField.apiId] as string)
              ) : (
                <span className="text-muted-foreground text-xs">
                  {entry.id}
                </span>
              ),
            status: <span className="capitalize">{entry.status}</span>,
            updatedAt: entry.updatedAt
              ? new Date(entry.updatedAt).toLocaleString()
              : '—',
            actions: (
              <div className="flex justify-end gap-2 text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/content/${schema.slug}/${entry.id}`}>Edit</Link>
                </Button>
                <span
                  title={
                    !canDelete ? 'You do not have permission to delete.' : ''
                  }
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canDelete || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(entry.id)}
                  >
                    Delete
                  </Button>
                </span>
              </div>
            ),
          }))}
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
          pageCount={data?.meta?.pagination?.pageCount ?? 1}
          totalCount={data?.meta?.pagination?.total ?? 0}
          onPageChange={(newPage: number) => setPage(newPage)}
        />
      </Card>
    </div>
  );
}
