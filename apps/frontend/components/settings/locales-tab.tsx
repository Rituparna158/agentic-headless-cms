'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listLocales, createLocale, deleteLocale } from '@/lib/api/locales';
import { Button, Input, Modal, Table } from '@repo/shared-ui';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Trash2 } from 'lucide-react';
import { LocaleRecord } from '@repo/types';

export function LocalesTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<LocaleRecord | null>(null);

  const { data: locales = [], isLoading } = useQuery({
    queryKey: ['locales'],
    queryFn: listLocales,
  });

  const createMutation = useMutation({
    mutationFn: () => createLocale({ code, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locales'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLocale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locales'] });
      setPendingDelete(null);
    },
  });

  const closeDialog = () => {
    setIsCreateOpen(false);
    setCode('');
    setName('');
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>Add Locale</Button>
        <Modal
          isOpen={isCreateOpen}
          onClose={closeDialog}
          title="Add Locale"
          showFooter={false}
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input
                placeholder="e.g. fr-FR"
                value={code}
                onChange={(val: string) => setCode(val)}
                variant="default"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. French"
                value={name}
                onChange={(val: string) => setName(val)}
                variant="default"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={!code || !name || createMutation.isPending}
              >
                {createMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table
          headings={[
            { label: 'Code', key: 'code', sort: 'asc' },
            { label: 'Name', key: 'name', sort: 'asc' },
            { label: 'Default', key: 'isDefault', sort: 'asc' },
            { label: 'Actions', key: 'actions', sort: 'asc' },
          ]}
          data={locales.map((locale) => ({
            code: <span className="font-mono text-xs">{locale.code}</span>,
            name: locale.name,
            isDefault: locale.isDefault ? 'Yes' : '',
            actions: (
              <div className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => setPendingDelete(locale)}
                  title="Delete Locale"
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
        {locales.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border-t">
            No locales configured yet.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete locale?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" (${pendingDelete.code}) will be removed. This can't be undone.`
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
