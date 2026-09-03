'use client';

import * as React from 'react';
import { DataTable, Dropdown, DropdownItem, Button } from '@repo/shared-ui';
import type { AuditLogRecord, GetAuditLogsQuery } from '@repo/types';
import { useAuditLogs } from '@/lib/api/audit';
import { AuditDetailDrawer } from './audit-detail-drawer';
import {
  Filter,
  Eye,
  Clock,
  User,
  Bot,
  Layers,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

const ACTION_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  create: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  update: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  publish: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  rollback: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  delete: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/30',
  },
};

const RESOURCE_TYPES = [
  'content',
  'schema',
  'role',
  'user',
  'locale',
  'webhook',
  'media',
];

const ACTIONS = ['create', 'update', 'publish', 'delete', 'rollback'];

const COLUMNS = [
  { key: 'action', label: 'Action', sortable: true },
  { key: 'resource', label: 'Resource', sortable: true },
  { key: 'actor', label: 'Actor', sortable: true },
  { key: 'timestamp', label: 'Timestamp', sortable: true },
  { key: 'details', label: 'Details', sortable: false },
];

export function AuditLogTable() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [sortKey, setSortKey] = React.useState<string>('timestamp');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
    'desc',
  );
  const [actionFilter, setActionFilter] = React.useState<string>('');
  const [resourceFilter, setResourceFilter] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedLog, setSelectedLog] = React.useState<AuditLogRecord | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const queryParams: GetAuditLogsQuery = React.useMemo(() => {
    const params: GetAuditLogsQuery = {
      page,
      limit: pageSize,
    };
    if (actionFilter) params.action = actionFilter;
    if (resourceFilter) params.resourceType = resourceFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return params;
  }, [page, pageSize, actionFilter, resourceFilter, searchQuery]);

  const { data, isLoading, isError, refetch } = useAuditLogs(queryParams);

  // Use server-returned data directly — the API already handles search filtering
  const displayLogs = React.useMemo(() => data?.data ?? [], [data?.data]);

  // Client-side sorting on the actual record data values
  const sortedLogs = React.useMemo(() => {
    const list = [...displayLogs];
    list.sort((a, b) => {
      if (sortKey === 'action') {
        const aVal = a.action || '';
        const bVal = b.action || '';
        const cmp = aVal.localeCompare(bVal, undefined, {
          sensitivity: 'base',
        });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortKey === 'resource') {
        const aVal = `${a.resourceType} ${a.resourceId}`;
        const bVal = `${b.resourceType} ${b.resourceId}`;
        const cmp = aVal.localeCompare(bVal, undefined, {
          sensitivity: 'base',
        });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortKey === 'actor') {
        const aVal =
          `${a.actorFirstName || ''} ${a.actorLastName || ''} ${a.actorEmail || ''}`.trim() ||
          'System';
        const bVal =
          `${b.actorFirstName || ''} ${b.actorLastName || ''} ${b.actorEmail || ''}`.trim() ||
          'System';
        const cmp = aVal.localeCompare(bVal, undefined, {
          sensitivity: 'base',
        });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortKey === 'timestamp') {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      return 0;
    });
    return list;
  }, [displayLogs, sortKey, sortDirection]);

  const handleRowClick = React.useCallback((log: AuditLogRecord) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  }, []);

  const resetFilters = React.useCallback(() => {
    setActionFilter('');
    setResourceFilter('');
    setSearchQuery('');
    setPage(1);
  }, []);

  const hasActiveCategoryFilters = Boolean(actionFilter || resourceFilter);
  const hasActiveFilters = Boolean(
    actionFilter || resourceFilter || searchQuery,
  );

  const rows = React.useMemo(() => {
    return sortedLogs.map((log) => {
      const actionStyle = ACTION_COLORS[log.action.toLowerCase()] || {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
      };
      const actorName =
        log.actorFirstName && log.actorLastName
          ? `${log.actorFirstName} ${log.actorLastName}`
          : log.actorEmail || 'System';

      const logTime = new Date(log.timestamp);
      const formattedDate = logTime.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = logTime.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        action: (
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}
          >
            {log.action.toUpperCase()}
          </span>
        ),
        resource: (
          <div className="flex flex-col">
            <span className="font-medium text-sm capitalize">
              {log.resourceType}
            </span>
            <span
              className="text-[11px] font-mono text-muted-foreground truncate max-w-[180px]"
              title={log.resourceId}
            >
              {log.resourceId}
            </span>
          </div>
        ),
        actor: (
          <div className="flex items-center gap-2">
            {log.actorType === 'agent' ? (
              <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Bot className="size-3.5" />
              </div>
            ) : (
              <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <User className="size-3.5" />
              </div>
            )}
            <div className="flex flex-col truncate max-w-[200px]">
              <span className="text-sm font-medium truncate">{actorName}</span>
              {log.actorEmail && log.actorFirstName && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {log.actorEmail}
                </span>
              )}
            </div>
          </div>
        ),
        timestamp: (
          <div className="flex flex-col text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <Clock className="size-3 text-muted-foreground" />
              <span>{formattedTime}</span>
            </div>
            <span>{formattedDate}</span>
          </div>
        ),
        details: (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleRowClick(log);
              }}
              className="h-8 w-8 p-0"
              title="View details"
            >
              <Eye className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ),
      };
    });
  }, [sortedLogs, handleRowClick]);

  return (
    <div className="flex flex-col gap-4">
      {/* Category Dropdown Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/60 p-3 rounded-xl border border-border/70 backdrop-blur-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter Dropdown (ignix-ui) */}
          <Dropdown
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                <Filter className="size-3.5 text-muted-foreground" />
                <span>
                  {actionFilter ? actionFilter.toUpperCase() : 'All Actions'}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            }
          >
            <DropdownItem
              onClick={() => {
                setActionFilter('');
                setPage(1);
              }}
            >
              All Actions
            </DropdownItem>
            {ACTIONS.map((act) => (
              <DropdownItem
                key={act}
                onClick={() => {
                  setActionFilter(act);
                  setPage(1);
                }}
              >
                {act.toUpperCase()}
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Resource Filter Dropdown (ignix-ui) */}
          <Dropdown
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                <Layers className="size-3.5 text-muted-foreground" />
                <span>
                  {resourceFilter
                    ? resourceFilter.charAt(0).toUpperCase() +
                      resourceFilter.slice(1)
                    : 'All Resources'}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            }
          >
            <DropdownItem
              onClick={() => {
                setResourceFilter('');
                setPage(1);
              }}
            >
              All Resources
            </DropdownItem>
            {RESOURCE_TYPES.map((res) => (
              <DropdownItem
                key={res}
                onClick={() => {
                  setResourceFilter(res);
                  setPage(1);
                }}
              >
                {res.charAt(0).toUpperCase() + res.slice(1)}
              </DropdownItem>
            ))}
          </Dropdown>

          {hasActiveCategoryFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9 gap-1.5 text-xs"
            >
              <RotateCcw className="size-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main ignix-ui DataTable with Built-in Search Bar */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        {isLoading && !data ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-muted/60 rounded-md w-full" />
            <div className="h-10 bg-muted/40 rounded-md w-full" />
            <div className="h-10 bg-muted/30 rounded-md w-full" />
            <div className="h-10 bg-muted/40 rounded-md w-full" />
            <div className="h-10 bg-muted/30 rounded-md w-full" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-medium text-destructive">
              Failed to load audit logs.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : displayLogs.length === 0 && !hasActiveFilters ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Filter className="size-8 text-muted-foreground/40" />
            <h3 className="text-base font-semibold">No audit logs found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              System mutations and administrative activities will appear here as
              they occur.
            </p>
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={rows}
            enableFiltering={true}
            manualFiltering={true}
            searchValue={searchQuery}
            filterPlaceholder="Search by resource, actor, or ID..."
            onSearchChange={(q: string) => {
              setSearchQuery(q);
              setPage(1);
            }}
            enableSorting={true}
            manualSorting={true}
            defaultSortKey={sortKey}
            defaultSortDirection={sortDirection}
            onSortChange={(key: string, dir: 'asc' | 'desc') => {
              setSortKey(key);
              setSortDirection(dir);
            }}
            manualPagination
            enablePagination={true}
            page={page}
            pageSize={pageSize}
            rowsPerPageOptions={[5, 10, 15, 20, 50]}
            pageCount={data?.totalPages || 1}
            totalCount={data?.total || 0}
            onPageChange={setPage}
            onPageSizeChange={(newSize: number) => {
              setPageSize(newSize);
              setPage(1);
            }}
            emptyMessage="No audit logs match your search or filter criteria."
          />
        )}
      </div>

      {/* ignix-ui Drawer Inspector */}
      <AuditDetailDrawer
        log={selectedLog}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
