'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, Modal, Dropdown, DropdownItem } from '@repo/shared-ui';
import { deleteSchema } from '@/lib/api/schemas';
import type { SchemaRecord } from '@repo/types';
import { useHasPermission } from '@/hooks/use-permissions';

export function SchemaRowActions({ schema }: { schema: SchemaRecord }) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);

  const canDelete = useHasPermission('delete', schema.id);

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force: boolean }) =>
      deleteSchema(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      setShowDeleteDialog(false);
      setShowForceDeleteDialog(false);
    },
    onError: (error: unknown) => {
      const err = error as { status?: number; message?: string };
      if (
        err?.status === 409 ||
        err?.message?.toLowerCase().includes('conflict') ||
        err?.message?.includes('FOREIGN_KEY_VIOLATION') ||
        err?.message?.includes('constraint')
      ) {
        setShowDeleteDialog(false);
        setShowForceDeleteDialog(true);
      } else {
        console.error('Failed to delete schema:', error);
        alert('Failed to delete schema. Please try again.');
        setShowDeleteDialog(false);
      }
    },
  });

  return (
    <>
      <Dropdown
        trigger={
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      >
        <DropdownItem
          className="text-destructive focus:text-destructive"
          onSelect={(e: Event) => {
            if (canDelete) setShowDeleteDialog(true);
            else e.preventDefault();
          }}
          disabled={!canDelete}
          title={!canDelete ? 'You do not have permission to delete.' : ''}
        >
          <div className="flex items-center">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </div>
        </DropdownItem>
      </Dropdown>

      <Modal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Are you absolutely sure?"
        confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={() => deleteMutation.mutate({ id: schema.id, force: false })}
        onCancel={() => setShowDeleteDialog(false)}
      >
        <div className="text-sm text-muted-foreground py-4 wrap-break-word">
          This will permanently delete the <strong>{schema.name}</strong>{' '}
          content type.
        </div>
      </Modal>

      <Modal
        isOpen={showForceDeleteDialog}
        onClose={() => setShowForceDeleteDialog(false)}
        title="Schema has existing content"
        confirmText={
          deleteMutation.isPending ? 'Deleting...' : 'Force Delete All'
        }
        cancelText="Cancel"
        onConfirm={() => deleteMutation.mutate({ id: schema.id, force: true })}
        onCancel={() => setShowForceDeleteDialog(false)}
      >
        <div className="text-sm text-muted-foreground py-4">
          The <strong>{schema.name}</strong> content type has existing content
          entries. Are you sure you want to delete this content type{' '}
          <strong>AND all of its content</strong>? This action cannot be undone.
        </div>
      </Modal>
    </>
  );
}
