'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { SchemaDefinition } from '@repo/shared-types';

import { deleteContentEntry, listContentEntries } from '@/lib/api/content';
import type { SchemaRecord } from '@/lib/api/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 25;

export interface ContentEntryListProps {
  schema: SchemaRecord;
}

/** The first text/richtext field is used as the entry's display title in the list — schemas have no dedicated "title field" concept, so this is the closest reasonable stand-in. */
function pickTitleField(definition: SchemaDefinition) {
  return definition.fields.find(
    (f) => f.dataType === 'text' || f.dataType === 'richtext',
  );
}

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
  const pagination = data?.meta.pagination;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {titleField ? (
          <Input
            placeholder={`Search by ${titleField.displayName}…`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
        ) : null}

        <select
          aria-label="Sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="updatedAt:desc">Recently updated</option>
          <option value="updatedAt:asc">Least recently updated</option>
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
        </select>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No entries yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{titleField?.displayName ?? 'Entry'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {titleField &&
                    typeof entry.data[titleField.apiId] === 'string'
                      ? (entry.data[titleField.apiId] as string)
                      : entry.id}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {entry.status}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.updatedAt
                      ? new Date(entry.updatedAt).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/content/${schema.slug}/${entry.id}`}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(entry.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {pagination && pagination.pageCount > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {pagination.page} of {pagination.pageCount} ({pagination.total}{' '}
            entries)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
