'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listWebhooks, createWebhook, deleteWebhook } from '@/lib/api/webhooks';
import { WebhookRecord } from '@repo/types';
import { Button, Input, Checkbox, Modal, Table } from '@repo/shared-ui';
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

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: listWebhooks,
  });

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

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading...</div>
    );
  }

  if (webhooks.length === 0) {
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
        <Table
          headings={[
            { label: 'Name', key: 'name', sort: 'asc' },
            { label: 'URL', key: 'url', sort: 'asc' },
            { label: 'Events', key: 'events', sort: 'asc' },
            { label: 'Status', key: 'status', sort: 'asc' },
            { label: 'Actions', key: 'actions', sort: 'asc' },
          ]}
          data={webhooks.map((webhook) => ({
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
          applySort={() => {}}
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
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
