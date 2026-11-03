import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  RefreshCw,
  Download,
  X,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuditLogs } from '../api/audit.api';
import type {
  AuditLogRecord,
  AuditFilters,
  ActorFilterType,
} from '../types/audit.types';
import {
  ACTION_OPTIONS,
  RESOURCE_OPTIONS,
  ACTOR_TYPE_OPTIONS,
  PAGE_SIZE_OPTIONS,
  DEFAULT_AUDIT_PAGE,
  DEFAULT_AUDIT_PAGE_SIZE,
} from '../constants/audit.constants';
import { AuditSummaryCards } from '../components/AuditSummaryCards';
import { AuditTableView } from '../components/AuditTableView';
import { AuditDetailDrawer } from '../components/AuditDetailDrawer';

export const AuditLogPage: React.FC = () => {
  const [page, setPage] = useState<number>(DEFAULT_AUDIT_PAGE);
  const [limit, setLimit] = useState<number>(DEFAULT_AUDIT_PAGE_SIZE);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [actorTypeFilter, setActorTypeFilter] =
    useState<ActorFilterType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebouncedValue(search);

  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const queryFilters: Partial<AuditFilters> = useMemo(() => {
    const q: Partial<AuditFilters> = {
      page,
      limit,
    };
    if (actionFilter) q.action = actionFilter;
    if (resourceFilter) q.resourceType = resourceFilter;
    if (startDate) q.startDate = startDate;
    if (endDate) q.endDate = endDate;
    if (debouncedSearch.trim()) q.search = debouncedSearch.trim();
    return q;
  }, [
    page,
    limit,
    actionFilter,
    resourceFilter,
    startDate,
    endDate,
    debouncedSearch,
  ]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAuditLogs(queryFilters);

  const rawLogs: AuditLogRecord[] = useMemo(
    () => response?.data?.data || [],
    [response?.data?.data],
  );
  const totalRecords: number = response?.data?.total || 0;
  const totalPages: number = response?.data?.totalPages || 1;

  // Client-side actorType filtering if specified
  const filteredLogs = useMemo(() => {
    if (actorTypeFilter === 'all') return rawLogs;
    return rawLogs.filter((log) => log.actorType === actorTypeFilter);
  }, [rawLogs, actorTypeFilter]);

  const hasActiveFilters = Boolean(
    actionFilter ||
    resourceFilter ||
    actorTypeFilter !== 'all' ||
    startDate ||
    endDate ||
    search.trim(),
  );

  const handleResetFilters = () => {
    setActionFilter('');
    setResourceFilter('');
    setActorTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const handleSelectLog = (log: AuditLogRecord) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const exportAllFilteredJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-export-page-${page}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col min-h-full bg-background animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 border-b border-border/40 bg-card/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Audit Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Historical record of all administrative actions, content
              mutations, and system events.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/60 bg-card text-xs font-medium text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              title="Refresh log entries"
            >
              <RefreshCw
                className={`size-3.5 ${isFetching ? 'animate-spin text-primary' : 'text-muted-foreground'}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={exportAllFilteredJson}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/60 bg-card text-xs font-medium text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              title="Export visible records to JSON"
            >
              <Download className="size-3.5 text-muted-foreground" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 max-w-9xl w-full mx-auto">
        {/* KPI / Metric Summary Cards */}
        <AuditSummaryCards logs={rawLogs} totalCount={totalRecords} />

        {/* Filters & Search Control Bar */}
        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by action, user, email or resource ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Action Select */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Select */}
            <div>
              <select
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {RESOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actor Type Select */}
            <div>
              <select
                value={actorTypeFilter}
                onChange={(e) => {
                  setActorTypeFilter(
                    e.target.value as 'all' | 'user' | 'agent' | 'system',
                  );
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {ACTOR_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Filter Row: Dates & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="size-3.5" />
                <span>Date Range:</span>
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium text-xs ml-auto"
              >
                <RotateCcw className="size-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-7 animate-spin text-primary" />
            <span className="text-sm">Fetching audit logs from server...</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold">
                  Failed to load audit logs
                </h4>
                <p className="text-xs text-destructive/80">
                  An error occurred while communicating with the audit service.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-lg border border-destructive/40 text-xs font-medium hover:bg-destructive/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table Content View */}
        {!isLoading && !isError && (
          <>
            <AuditTableView logs={filteredLogs} onSelectLog={handleSelectLog} />

            {/* Pagination Controls */}
            {filteredLogs.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {filteredLogs.length} of {totalRecords} total event
                    {totalRecords === 1 ? '' : 's'}
                  </span>
                  <span>•</span>
                  <span>
                    Page {page} of {Math.max(1, totalPages)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span>Rows per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 py-1 rounded border border-border bg-background text-xs text-foreground focus:outline-none"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground font-medium disabled:opacity-40 hover:bg-muted/60 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground font-medium disabled:opacity-40 hover:bg-muted/60 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-out Technical Details Drawer */}
      <AuditDetailDrawer
        log={selectedLog}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};
