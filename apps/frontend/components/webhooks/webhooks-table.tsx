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
import { Button, Input, Checkbox, Modal, DataTable } from '@repo/shared-ui';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Trash2 } from 'lucide-react';

const AVAILABLE_EVENTS = [
  'content.published',
  'content.updated',
  'content.deleted',
  'media.uploaded',
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

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e: string) => e !== event)
        : [...prev, event],
    );
  };

  if (isLoading && !webhooksData) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading...</div>
    );
  }

  if (!search && webhooks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)}>
            Register Webhook
          </Button>
          <Modal
            isOpen={isCreateOpen}
            onClose={closeDialog}
            title="Register Webhook"
            confirmText={
              createMutation.isPending ? 'Registering...' : 'Register'
            }
            cancelText="Cancel"
            onConfirm={() => {
              if (
                name &&
                url &&
                events.length > 0 &&
                !createMutation.isPending
              ) {
                createMutation.mutate({ name, url, events });
              }
            }}
            onCancel={closeDialog}
          >
            <div className="space-y-4 py-4">
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
                <label className="text-sm font-medium">Events</label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={events.includes(event)}
                        onChange={() => toggleEvent(event)}
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        </div>
        <div className="text-center text-muted-foreground py-8 border rounded-md">
          No webhooks registered yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>Register Webhook</Button>
        <Modal
          isOpen={isCreateOpen}
          onClose={closeDialog}
          title="Register Webhook"
          confirmText={createMutation.isPending ? 'Registering...' : 'Register'}
          cancelText="Cancel"
          onConfirm={() => {
            if (name && url && events.length > 0 && !createMutation.isPending) {
              createMutation.mutate({ name, url, events });
            }
          }}
          onCancel={closeDialog}
        >
          <div className="space-y-4 py-4">
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
              <label className="text-sm font-medium">Events</label>
              <div className="space-y-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={events.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <DataTable
          columns={[
            { label: 'Name', key: 'name', sortable: true },
            { label: 'URL', key: 'url', sortable: true },
            { label: 'Events', key: 'events', sortable: false },
            { label: 'Status', key: 'status', sortable: true },
            { label: 'Actions', key: 'actions', sortable: false },
          ]}
          rows={webhooks.map((webhook) => ({
            name: webhook.name,
            url: (
              <span className="max-w-xs truncate font-mono text-xs">
                {webhook.url}
              </span>
            ),
            events: (
              <span className="text-xs text-muted-foreground">
                {webhook.events.join(', ')}
              </span>
            ),
            status: webhook.isActive ? (
              <span className="text-green-500 font-medium">Active</span>
            ) : (
              <span className="text-muted-foreground font-medium">
                Inactive
              </span>
            ),
            actions: (
              <div className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => setPendingDelete(webhook)}
                  title="Delete Webhook"
                >
                  <Trash2 className="size-4" />
                </Button>
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
          onPageSizeChange={(newSize: number) => setPageSize(newSize)}
          onPageChange={(newPage: number) => setPage(newPage)}
          emptyMessage="No webhooks match your search criteria."
        />
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
    </div>
  );
}
