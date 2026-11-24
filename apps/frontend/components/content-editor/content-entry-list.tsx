'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';

import {
  Badge,
  Button,
  DataTable,
  Dropdown,
  DropdownItem,
} from '@repo/shared-ui';
import { listContentEntries } from '@/lib/api/content';
import { getWorkflowBySchemaId } from '@/lib/api/workflows';
import type { ContentEntryListProps } from '@/types/component.types';
import { pickTitleField } from '@/utils/schema';
import { ContentEntryRowActions } from './content-entry-row-actions';
import { MediaThumbnailCell } from './media-thumbnail-cell';

function getWorkflowStageBadge(stage?: string | null) {
  const normalized = (stage || 'draft').toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'draft') {
    return (
      <Badge
        variant="outline"
        size="sm"
        className="text-[11px] font-medium border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        Draft
      </Badge>
    );
  }
  if (normalized === 'in_review' || normalized === 'review') {
    return (
      <Badge
        variant="outline"
        size="sm"
        className="text-[11px] font-medium border-amber-400 bg-amber-500/15 text-amber-700 dark:border-amber-500/30 dark:text-amber-400"
      >
        In Review
      </Badge>
    );
  }
  if (normalized === 'approved') {
    return (
      <Badge
        variant="outline"
        size="sm"
        className="text-[11px] font-medium border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400"
      >
        Approved
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      size="sm"
      className="text-[11px] font-medium border-primary/30 bg-primary/10 text-primary capitalize"
    >
      {stage?.replace(/_/g, ' ') || 'Draft'}
    </Badge>
  );
}

// Page size is now managed via state
export function ContentEntryList({ schema }: ContentEntryListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updatedAt:desc');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const titleField = pickTitleField(schema.definition);

  const { data: workflow } = useQuery({
    queryKey: ['schema-workflow', schema.id],
    queryFn: () => getWorkflowBySchemaId(schema.id),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['content', schema.slug, page, sort, search, stageFilter],
    queryFn: () => {
      const filters: Record<string, Record<string, string>> = {};
      if (search && titleField) {
        filters[titleField.apiId] = { $contains: search };
      }
      if (stageFilter && stageFilter !== 'all') {
        filters.workflowStage = { $eq: stageFilter };
      }
      return listContentEntries(schema.slug, {
        page,
        pageSize,
        sort,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
    },
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

  const availableStages =
    workflow?.stages && workflow.stages.length > 0
      ? workflow.stages
      : [
          { id: 'stage-draft', name: 'Draft', slug: 'draft' },
          { id: 'stage-in-review', name: 'In Review', slug: 'in_review' },
          { id: 'stage-approved', name: 'Approved', slug: 'approved' },
        ];

  const currentStageLabel =
    stageFilter === 'all'
      ? 'All Stages'
      : (availableStages.find(
          (s) =>
            s.slug === stageFilter ||
            s.slug.replace(/[\s-]+/g, '_') ===
              stageFilter.replace(/[\s-]+/g, '_'),
        )?.name ?? stageFilter.replace(/_/g, ' '));

  return (
    <div className="w-full max-w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Dropdown
            align="start"
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs font-medium cursor-pointer"
                aria-label="Filter by workflow stage"
              >
                <Filter className="size-3.5 text-primary" />
                <span>Stage: {currentStageLabel}</span>
                <ChevronDown className="size-3 text-muted-foreground opacity-70 ml-1" />
              </Button>
            }
          >
            <DropdownItem
              onSelect={() => {
                setStageFilter('all');
                setPage(1);
              }}
              onClick={() => {
                setStageFilter('all');
                setPage(1);
              }}
              className="text-xs cursor-pointer"
            >
              All Stages
            </DropdownItem>
            {availableStages.map((stage) => (
              <DropdownItem
                key={stage.id}
                onSelect={() => {
                  setStageFilter(stage.slug);
                  setPage(1);
                }}
                onClick={() => {
                  setStageFilter(stage.slug);
                  setPage(1);
                }}
                className="text-xs cursor-pointer flex items-center justify-between gap-4"
              >
                <span>{stage.name}</span>
                {stageFilter === stage.slug && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
        {stageFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStageFilter('all');
              setPage(1);
            }}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-3 mr-1" />
            Reset Filter
          </Button>
        )}
      </div>

      <DataTable
        columns={[
          {
            label: titleField?.displayName ?? 'Entry',
            key: titleField?.apiId ?? 'id',
            sortable: true,
          },
          { label: 'Author', key: 'createdBy', sortable: false },
          { label: 'Workflow Stage', key: 'workflowStage', sortable: true },
          { label: 'Publication Status', key: 'status', sortable: true },
          { label: 'Last Updated', key: 'updatedAt', sortable: true },
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
            createdBy: (
              <span
                className="text-xs text-foreground font-medium truncate max-w-[140px] block"
                title={entry.createdByEmail || entry.createdBy || 'Admin'}
              >
                {entry.createdBy || entry.createdByEmail || 'Admin'}
              </span>
            ),
            workflowStage: getWorkflowStageBadge(entry.workflowStage),
            status: (
              <Badge
                variant={entry.status === 'published' ? 'success' : 'secondary'}
                size="sm"
                className="font-medium"
              >
                {entry.status === 'published' ? 'Published' : 'Unpublished'}
              </Badge>
            ),
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
        emptyMessage="No content entries found. Create your first entry to get started."
      />
    </div>
  );
}
