import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  DataTable,
  Tabs,
} from '@repo/shared-ui';
import { accessApi } from '../api/access.api';
import { MfaRequestRecord, MfaRequestStatus } from '../types/access.types';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

type TabId = 'pending' | 'history';
type SortDirection = 'asc' | 'desc';

const SORTABLE_COLUMNS = ['email', 'createdAt', 'status'] as const;

export const MfaRequestsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('pending');

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [pendingSort, setPendingSort] = useState('createdAt:desc');
  const [pendingSearch, setPendingSearch] = useState('');
  const debouncedPendingSearch = useDebouncedValue(pendingSearch);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historySort, setHistorySort] = useState('createdAt:desc');
  const [historySearch, setHistorySearch] = useState('');
  const debouncedHistorySearch = useDebouncedValue(historySearch);

  const {
    data: pendingResponse,
    isLoading: pendingLoading,
    isFetching: pendingFetching,
  } = useQuery({
    queryKey: [
      'mfa-requests',
      'pending',
      pendingPage,
      pendingPageSize,
      pendingSort,
      debouncedPendingSearch,
    ],
    queryFn: () =>
      accessApi.getMfaRequests('pending', {
        page: pendingPage,
        pageSize: pendingPageSize,
        sort: pendingSort,
        search: debouncedPendingSearch,
      }),
    placeholderData: keepPreviousData,
  });
  const {
    data: historyResponse,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useQuery({
    queryKey: [
      'mfa-requests',
      'history',
      historyPage,
      historyPageSize,
      historySort,
      debouncedHistorySearch,
    ],
    queryFn: () =>
      accessApi.getMfaRequests('history', {
        page: historyPage,
        pageSize: historyPageSize,
        sort: historySort,
        search: debouncedHistorySearch,
      }),
    placeholderData: keepPreviousData,
  });
  const { data: rejectedResponse } = useQuery({
    queryKey: ['mfa-requests', 'rejected'],
    queryFn: () =>
      accessApi.getMfaRequests('rejected', { page: 1, pageSize: 1 }),
    placeholderData: keepPreviousData,
  });

  const pending = pendingResponse?.data?.data || [];
  const pendingPagination = pendingResponse?.data?.meta?.pagination;
  const history = historyResponse?.data?.data || [];
  const historyPagination = historyResponse?.data?.meta?.pagination;
  const rejectedTotal = rejectedResponse?.data?.meta?.pagination?.total ?? 0;

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'approve' | 'reject';
    }) =>
      action === 'approve'
        ? accessApi.approveMfaRequest(id)
        : accessApi.rejectMfaRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-requests'] });
    },
  });

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    actionMutation.mutate({ id, action });
  };

  const isLoading = activeTab === 'pending' ? pendingLoading : historyLoading;
  const isFetching =
    activeTab === 'pending' ? pendingFetching : historyFetching;
  const isActionPending = (id: string, action: 'approve' | 'reject') =>
    actionMutation.isPending &&
    actionMutation.variables?.id === id &&
    actionMutation.variables?.action === action;

  const toSortValue = (
    key: (typeof SORTABLE_COLUMNS)[number],
    direction: SortDirection,
  ) => `${key}:${direction}`;

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      <div className="px-6 py-6 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h2" className="tracking-tight mb-1">
              MFA Reset Requests
            </Typography>
            <Typography variant="body" className="text-muted-foreground">
              Review and approve or reject user requests to reset their
              Multi-Factor Authentication.
            </Typography>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Clock className="size-4" />}
            label="Pending"
            value={pendingPagination?.total ?? 0}
            className="border-amber-500/30 bg-amber-500/5 text-amber-600"
          />
          <SummaryCard
            icon={<ShieldCheck className="size-4" />}
            label="Approved"
            value={(historyPagination?.total ?? 0) - rejectedTotal}
            className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
          />
          <SummaryCard
            icon={<ShieldAlert className="size-4" />}
            label="Rejected"
            value={rejectedTotal}
            className="border-red-500/30 bg-red-500/5 text-red-600"
          />
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <Tabs
              options={['Pending', 'History']}
              selected={activeTab === 'pending' ? 0 : 1}
              value={(idx: number) =>
                setActiveTab(idx === 0 ? 'pending' : 'history')
              }
            />

            <div className="rounded-lg border border-border/60">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading requests...
                </div>
              ) : (
                <>
                  {isFetching && (
                    <div className="flex items-center gap-2 justify-end px-4 pt-3 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Updating...
                    </div>
                  )}
                  {activeTab === 'pending' ? (
                    <DataTable
                      columns={[
                        { label: 'USER', key: 'email', sortable: true },
                        {
                          label: 'REQUESTED',
                          key: 'createdAt',
                          sortable: true,
                        },
                        { label: 'ACTIONS', key: 'actions', sortable: false },
                      ]}
                      rows={pending.map((req: MfaRequestRecord) => ({
                        id: req.id,
                        email: (
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {(req.user?.firstName || req.user?.email || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {req.user?.email || req.userId}
                              </div>
                              {(req.user?.firstName || req.user?.lastName) && (
                                <div className="text-muted-foreground text-xs">
                                  {req.user.firstName} {req.user.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                        createdAt: formatDate(req.createdAt),
                        actions: (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionMutation.isPending}
                              onClick={() => handleAction(req.id, 'reject')}
                            >
                              {isActionPending(req.id, 'reject') ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5" />
                              )}
                              Reject
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={actionMutation.isPending}
                              onClick={() => handleAction(req.id, 'approve')}
                            >
                              {isActionPending(req.id, 'approve') ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              Approve
                            </Button>
                          </div>
                        ),
                      }))}
                      enablePagination
                      manualPagination
                      page={pendingPage}
                      pageCount={pendingPagination?.pageCount ?? 1}
                      totalCount={pendingPagination?.total}
                      pageSize={pendingPageSize}
                      onPageChange={setPendingPage}
                      onPageSizeChange={(newSize) => {
                        setPendingPageSize(newSize);
                        setPendingPage(1);
                      }}
                      enableSorting
                      manualSorting
                      defaultSortKey={pendingSort.split(':')[0]}
                      defaultSortDirection={
                        pendingSort.split(':')[1] as SortDirection
                      }
                      onSortChange={(key, direction) => {
                        if (
                          SORTABLE_COLUMNS.includes(
                            key as (typeof SORTABLE_COLUMNS)[number],
                          )
                        ) {
                          setPendingSort(
                            toSortValue(
                              key as (typeof SORTABLE_COLUMNS)[number],
                              direction,
                            ),
                          );
                          setPendingPage(1);
                        }
                      }}
                      enableFiltering
                      manualFiltering
                      filterPlaceholder="Search requests..."
                      onSearchChange={(value) => {
                        setPendingSearch(value);
                        setPendingPage(1);
                      }}
                      emptyMessage="No pending MFA reset requests."
                    />
                  ) : (
                    <DataTable
                      columns={[
                        { label: 'USER', key: 'email', sortable: true },
                        {
                          label: 'REQUESTED',
                          key: 'createdAt',
                          sortable: true,
                        },
                        { label: 'STATUS', key: 'status', sortable: true },
                        { label: 'HANDLED BY', key: 'admin', sortable: false },
                      ]}
                      rows={history.map((req: MfaRequestRecord) => ({
                        id: req.id,
                        email: (
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {(req.user?.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium text-foreground">
                              {req.user?.email || req.userId}
                            </div>
                          </div>
                        ),
                        createdAt: formatDate(req.createdAt),
                        status: <StatusBadge status={req.status} />,
                        admin: req.admin?.email || 'System',
                      }))}
                      enablePagination
                      manualPagination
                      page={historyPage}
                      pageCount={historyPagination?.pageCount ?? 1}
                      totalCount={historyPagination?.total}
                      pageSize={historyPageSize}
                      onPageChange={setHistoryPage}
                      onPageSizeChange={(newSize) => {
                        setHistoryPageSize(newSize);
                        setHistoryPage(1);
                      }}
                      enableSorting
                      manualSorting
                      defaultSortKey={historySort.split(':')[0]}
                      defaultSortDirection={
                        historySort.split(':')[1] as SortDirection
                      }
                      onSortChange={(key, direction) => {
                        if (
                          SORTABLE_COLUMNS.includes(
                            key as (typeof SORTABLE_COLUMNS)[number],
                          )
                        ) {
                          setHistorySort(
                            toSortValue(
                              key as (typeof SORTABLE_COLUMNS)[number],
                              direction,
                            ),
                          );
                          setHistoryPage(1);
                        }
                      }}
                      enableFiltering
                      manualFiltering
                      filterPlaceholder="Search history..."
                      onSearchChange={(value) => {
                        setHistorySearch(value);
                        setHistoryPage(1);
                      }}
                      emptyMessage="No MFA reset history yet."
                    />
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function SummaryCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className={`rounded-lg p-2.5 ${className}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MfaRequestStatus }) {
  const styles =
    status === 'approved'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
      : status === 'rejected'
        ? 'bg-red-500/10 text-red-600 border-red-500/30'
        : status === 'completed'
          ? 'bg-primary/10 text-primary border-primary/30'
          : status === 'expired'
            ? 'bg-muted text-muted-foreground border-border'
            : 'bg-amber-500/10 text-amber-600 border-amber-500/30';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
