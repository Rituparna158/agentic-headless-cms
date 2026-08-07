'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              if (canDelete) setShowDeleteDialog(true);
              else e.preventDefault();
            }}
            disabled={!canDelete}
            title={!canDelete ? 'You do not have permission to delete.' : ''}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the <strong>{schema.name}</strong>{' '}
              content type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate({ id: schema.id, force: false });
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showForceDeleteDialog}
        onOpenChange={setShowForceDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schema has existing content</AlertDialogTitle>
            <AlertDialogDescription>
              The <strong>{schema.name}</strong> content type has existing
              content entries. Are you sure you want to delete this content type{' '}
              <strong>AND all of its content</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate({ id: schema.id, force: true });
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Force Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
