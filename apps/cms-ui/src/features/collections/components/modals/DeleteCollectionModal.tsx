import { AlertTriangle } from 'lucide-react';
import type { DeleteCollectionModalProps } from '../../types/collections.types';

export type { DeleteCollectionModalProps };

export function DeleteCollectionModal({
  collection,
  deleteMode,
  forceDeleteConfirmName,
  onForceDeleteConfirmNameChange,
  onEnterForceMode,
  onConfirmDelete,
  onClose,
  isPending,
  isError,
}: DeleteCollectionModalProps) {
  if (!collection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {deleteMode === 'normal' && (
            <>
              <div className="flex items-center gap-3 mb-3 text-destructive">
                <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Delete Collection
                  </h2>
                  <span className="text-[10px] text-destructive font-semibold uppercase tracking-wider">
                    Destructive Action
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete the{' '}
                <span className="font-semibold text-foreground">
                  &quot;{collection.name}&quot;
                </span>{' '}
                collection? This action permanently removes the collection
                schema.
              </p>

              <div className="mb-5 rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-2">
                <label className="block text-xs font-medium text-foreground">
                  To confirm deletion, type{' '}
                  <span className="font-mono font-bold text-destructive bg-background px-1.5 py-0.5 rounded border border-destructive/30 select-all">
                    {collection.name}
                  </span>{' '}
                  below:
                </label>
                <input
                  type="text"
                  value={forceDeleteConfirmName}
                  onChange={(e) =>
                    onForceDeleteConfirmNameChange(e.target.value)
                  }
                  placeholder="Type collection name..."
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all font-medium"
                />
              </div>

              {isError && (
                <p className="text-sm font-medium text-destructive mb-4">
                  Failed to delete collection. Please try again.
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={
                    isPending ||
                    forceDeleteConfirmName.trim() !== collection.name.trim()
                  }
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isPending ? 'Deleting...' : 'Delete Collection'}
                </button>
              </div>
            </>
          )}

          {deleteMode === 'conflict' && (
            <>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Active Pages Found</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                The{' '}
                <span className="font-medium text-foreground">
                  &quot;{collection.name}&quot;
                </span>{' '}
                collection cannot be deleted because it still contains active
                pages.
                <br />
                <br />
                You can either cancel and delete those pages manually, or you
                can force delete the collection to permanently destroy all its
                contents.
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onEnterForceMode}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Enter Force Delete Mode
                </button>
              </div>
            </>
          )}

          {deleteMode === 'force' && (
            <>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  Force Delete Collection
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This action <span className="font-bold">cannot be undone</span>.
                This will permanently delete the collection and all of its
                associated pages.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Please type{' '}
                  <span className="font-bold select-all bg-muted px-1.5 py-0.5 rounded text-destructive">
                    {collection.name}
                  </span>{' '}
                  to confirm.
                </label>
                <input
                  type="text"
                  value={forceDeleteConfirmName}
                  onChange={(e) =>
                    onForceDeleteConfirmNameChange(e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-destructive/50 text-foreground"
                  placeholder="Type collection name here..."
                />
              </div>

              {isError && (
                <p className="text-sm font-medium text-destructive mb-4">
                  Failed to force delete collection. Please try again.
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={
                    isPending || forceDeleteConfirmName !== collection.name
                  }
                  className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isPending ? 'Deleting...' : 'Confirm Force Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
