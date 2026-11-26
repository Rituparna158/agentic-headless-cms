'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { listWebhooks, createWebhook, deleteWebhook } from '@/lib/api/webhooks';
import { WebhookRecord } from '@repo/types';
import {
  Button,
  Input,
  Modal,
  DataTable,
  Dropdown,
  DropdownItem,
  Badge,
} from '@repo/shared-ui';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Trash2, History, MoreVertical, Radio, Plus } from 'lucide-react';
import { WebhookDeliveriesDrawer } from './webhook-deliveries-drawer';
import { WebhookEventsCombobox } from './webhook-events-combobox';

const EVENT_CATEGORIES = [
  {
    category: 'Content Lifecycle',
    events: [
      {
        id: 'content.created',
        description: 'When a new draft entry is created',
      },
      {
        id: 'content.updated',
        description: 'When an entry is modified or updated',
      },
      {
        id: 'content.published',
        description: 'When an entry is published live',
      },
      {
        id: 'content.unpublished',
        description: 'When an entry is reverted from published',
      },
      { id: 'content.deleted', description: 'When an entry is deleted' },
    ],
  },
  {
    category: 'Editorial Workflow',
    events: [
      {
        id: 'workflow.transition',
        description: 'When an entry transitions between any workflow stages',
      },
      {
        id: 'workflow.review_requested',
        description: 'When an entry is submitted for editorial review',
      },
      {
        id: 'workflow.approved',
        description: 'When an entry is approved by an assigned reviewer',
      },
      {
        id: 'workflow.changes_requested',
        description: 'When a reviewer requests changes on an entry',
      },
    ],
  },
  {
    category: 'Media Assets',
    events: [
      { id: 'media.uploaded', description: 'When a media asset is uploaded' },
    ],
  },
];

export function WebhooksTable() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<WebhookRecord | null>(
    null,
  );
  const [selectedWebhookForDeliveries, setSelectedWebhookForDeliveries] =
    useState<WebhookRecord | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('createdAt:desc');
  const [search, setSearch] = useState('');

  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['webhooks', page, pageSize, sort, search],
    queryFn: () => listWebhooks({ page, pageSize, sort, search }),
    placeholderData: keepPreviousData,
  });

  const webhooks = webhooksData?.data || [];

  const createMutation = useMutation({
    mutationFn: (variables: { name: string; url: string; events: string[] }) =>
      createWebhook(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setPendingDelete(null);
    },
  });

  const closeDialog = () => {
    setIsCreateOpen(false);
    setName('');
    setUrl('');
    setEvents([]);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header Row with Action */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Endpoints listening for content and system mutations
        </div>
        <Button
          aria-label="+ Register"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5"
          size="sm"
        >
          <Plus className="size-4" />
          <span>Register</span>
        </Button>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={closeDialog}
        size="lg"
        className="min-h-[540px] sm:min-h-[580px]"
        bodyClassName="px-6 py-4 flex flex-col"
        title="Register Webhook"
        confirmText={createMutation.isPending ? 'Registering...' : 'Register'}
        cancelText="Cancel"
        onConfirm={() => {
          if (name && url && events.length > 0 && !createMutation.isPending) {
            createMutation.mutate({ name, url, events });
          }
        }}
        onCancel={closeDialog}
        colorOverrides={{
          confirmButton:
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-primary/20',
        }}
      >
        <div className="space-y-4 flex flex-col flex-1 min-h-[380px]">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. Next.js ISR Rebuild"
              variant="default"
              value={name}
              onChange={(val: string) => setName(val)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input
              placeholder="https://example.com/api/revalidate"
              variant="default"
              value={url}
              onChange={(val: string) => setUrl(val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Events</label>
              {events.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {events.length} selected
                </span>
              )}
            </div>
            <WebhookEventsCombobox
              categories={EVENT_CATEGORIES}
              selectedEvents={events}
              onChange={setEvents}
            />
          </div>
        </div>
      </Modal>

      {/* Main Table Container matching Audit Log */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden w-full max-w-full min-w-0">
        {isLoading && !webhooksData ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-muted/60 rounded-md w-full" />
            <div className="h-10 bg-muted/40 rounded-md w-full" />
            <div className="h-10 bg-muted/30 rounded-md w-full" />
          </div>
        ) : !search && webhooks.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Radio className="size-8 text-muted-foreground/40" />
            <h3 className="text-base font-semibold">
              No webhooks registered yet.
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Register your first webhook endpoint to start receiving real-time
              event notifications.
            </p>
          </div>
        ) : (
          <DataTable
            columns={[
              { label: 'Name', key: 'name', sortable: true },
              { label: 'Target URL', key: 'url', sortable: true },
              { label: 'Events', key: 'events', sortable: false },
              { label: 'Status', key: 'status', sortable: true },
              {
                label: 'Actions',
                key: 'actions',
                sortable: false,
                align: 'right',
              },
            ]}
            rows={webhooks.map((webhook) => ({
              name: (
                <span
                  className="font-medium text-sm truncate max-w-[160px] sm:max-w-[200px] block"
                  title={webhook.name}
                >
                  {webhook.name}
                </span>
              ),
              url: (
                <div className="flex items-center max-w-[200px] sm:max-w-xs min-w-0">
                  <span
                    className="truncate font-mono text-xs text-muted-foreground"
                    title={webhook.url}
                  >
                    {webhook.url}
                  </span>
                </div>
              ),
              events: (
                <div className="flex flex-wrap gap-1 max-w-[220px]">
                  {webhook.events.map((event) => (
                    <Badge
                      key={event}
                      variant="secondary"
                      size="xs"
                      className="text-[10px] font-mono"
                    >
                      {event}
                    </Badge>
                  ))}
                </div>
              ),
              status: (
                <Badge
                  variant={webhook.isActive ? 'success' : 'secondary'}
                  size="sm"
                  className="font-medium"
                >
                  {webhook.isActive ? 'Active' : 'Inactive'}
                </Badge>
              ),
              actions: (
                <div className="flex items-center justify-end">
                  <Dropdown
                    align="end"
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Actions"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <DropdownItem
                      onClick={() => setSelectedWebhookForDeliveries(webhook)}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Delivery History</span>
                      </div>
                    </DropdownItem>
                    <DropdownItem onClick={() => setPendingDelete(webhook)}>
                      <div className="flex items-center gap-2 text-xs text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </div>
                    </DropdownItem>
                  </Dropdown>
                </div>
              ),
            }))}
            enableFiltering={true}
            manualFiltering={true}
            searchValue={search}
            filterPlaceholder="Search webhooks..."
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
            pageCount={webhooksData?.meta?.pagination?.pageCount ?? 1}
            pageSize={pageSize}
            rowsPerPageOptions={[5, 10, 20, 25, 50]}
            onPageSizeChange={(newSize: number) => {
              setPageSize(newSize);
              setPage(1);
            }}
            onPageChange={(newPage: number) => setPage(newPage)}
            emptyMessage="No webhooks match your search criteria."
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete webhook?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will stop receiving events immediately. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />

      <WebhookDeliveriesDrawer
        webhook={selectedWebhookForDeliveries}
        open={!!selectedWebhookForDeliveries}
        onOpenChange={(open) => !open && setSelectedWebhookForDeliveries(null)}
      />
    </div>
  );
}
