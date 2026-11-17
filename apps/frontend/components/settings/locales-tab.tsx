'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listLocales,
  createLocale,
  deleteLocale,
  setDefaultLocale,
} from '@/lib/api/locales';
import { Button, Input, Modal, DataTable, Checkbox } from '@repo/shared-ui';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Trash2 } from 'lucide-react';
import { LocaleRecord } from '@repo/types';

export function LocalesTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<LocaleRecord | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('createdAt:desc');
  const [search, setSearch] = useState('');

  const { data: localesData, isLoading } = useQuery({
    queryKey: ['locales', page, pageSize, sort, search],
    queryFn: () => listLocales({ page, pageSize, sort, search }),
  });

  const locales = localesData?.data || [];

  const createMutation = useMutation({
    mutationFn: () =>
      createLocale({
        code,
        name,
        ...(isDefault ? { isDefault: true } : {}),
      }),
    onSuccess: () => {
      toast.success('Locale added');
      queryClient.invalidateQueries({ queryKey: ['locales'] });
      closeDialog();
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create locale',
      );
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultLocale(id),
    onSuccess: () => {
      toast.success('Default locale updated');
      queryClient.invalidateQueries({ queryKey: ['locales'] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update default locale',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLocale(id),
    onSuccess: () => {
      toast.success('Locale deleted');
      queryClient.invalidateQueries({ queryKey: ['locales'] });
      setPendingDelete(null);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete locale',
      );
    },
  });

  const closeDialog = () => {
    setIsCreateOpen(false);
    setCode('');
    setName('');
    setIsDefault(false);
  };

  if (isLoading && !localesData) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>+ Add</Button>
        <Modal
          isOpen={isCreateOpen}
          onClose={closeDialog}
          title="Add Locale"
          showFooter={false}
        >
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Code
              </label>
              <Input
                placeholder="e.g. fr-FR"
                value={code}
                onChange={(val: string) => setCode(val)}
                variant="default"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <Input
                placeholder="e.g. French"
                value={name}
                onChange={(val: string) => setName(val)}
                variant="default"
              />
            </div>
            <div className="pt-1">
              <Checkbox
                size="sm"
                label="Set as default locale"
                checked={isDefault}
                onChange={(checked: boolean) => setIsDefault(checked)}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-4">
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

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs w-full max-w-full min-w-0">
        <DataTable
          columns={[
            { label: 'Code', key: 'code', sortable: true },
            { label: 'Name', key: 'name', sortable: true },
            { label: 'Default', key: 'isDefault', sortable: true },
            {
              label: 'Actions',
              key: 'actions',
              sortable: false,
              align: 'right',
            },
          ]}
          rows={locales.map((locale) => ({
            code: <span className="font-mono text-xs">{locale.code}</span>,
            name: locale.name,
            isDefault: locale.isDefault ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Yes
              </span>
            ) : (
              <span className="text-muted-foreground/60 text-xs pl-2">—</span>
            ),
            actions: (
              <div className="flex items-center justify-end gap-1.5">
                {!locale.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setDefaultMutation.mutate(locale.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    {setDefaultMutation.isPending &&
                    setDefaultMutation.variables === locale.id
                      ? 'Setting...'
                      : 'Set as default'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 size-8"
                  onClick={() => setPendingDelete(locale)}
                  title="Delete Locale"
                  aria-label="Delete Locale"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          }))}
          enableFiltering={true}
          manualFiltering={true}
          searchValue={search}
          filterPlaceholder="Search locales..."
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
          pageCount={localesData?.meta?.pagination?.pageCount ?? 1}
          pageSize={pageSize}
          onPageSizeChange={(newSize: number) => setPageSize(newSize)}
          onPageChange={(newPage: number) => setPage(newPage)}
        />
        {locales.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border-t border-border">
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
