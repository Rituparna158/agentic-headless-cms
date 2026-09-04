'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, Modal, Dropdown, DropdownItem } from '@repo/shared-ui';
import { deleteContentEntry } from '@/lib/api/content';
import { useHasPermission } from '@/hooks/use-permissions';

interface ContentEntryRowActionsProps {
  schemaSlug: string;
  schemaId: string;
  entryId: string;
  title?: string;
}

export function ContentEntryRowActions({
  schemaSlug,
  schemaId,
  entryId,
  title,
}: ContentEntryRowActionsProps) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canDelete = useHasPermission('delete', schemaId);

  const deleteMutation = useMutation({
    mutationFn: () => deleteContentEntry(schemaSlug, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', schemaSlug] });
      setShowDeleteDialog(false);
    },
    onError: (error: unknown) => {
      console.error('Failed to delete content entry:', error);
      alert('Failed to delete entry. Please try again.');
      setShowDeleteDialog(false);
    },
  });

  return (
    <>
      <Dropdown
        align="end"
        trigger={
          <Button variant="ghost" className="h-8 w-8 p-0" title="Actions">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
      >
        <DropdownItem asChild>
          <Link
            href={`/content/${schemaSlug}/${entryId}`}
            className="flex items-center no-underline w-full cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
            Edit
          </Link>
        </DropdownItem>

        <DropdownItem
          className="text-destructive focus:text-destructive cursor-pointer"
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
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteDialog(false)}
      >
        <div className="text-sm text-muted-foreground py-4 wrap-break-word">
          This will permanently delete{' '}
          {title ? <strong>{title}</strong> : 'this entry'}. This action cannot
          be undone.
        </div>
      </Modal>
    </>
  );
}
