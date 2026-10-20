import type { EditCollectionModalProps } from '../../types/collections.types';

export type { EditCollectionModalProps };

export function EditCollectionModal({
  collection,
  onClose,
  onCollectionChange,
  onSubmit,
  isPending,
  isError,
}: EditCollectionModalProps) {
  if (!collection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Edit Collection
          </h2>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Collection Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={collection.name}
                  onChange={(e) =>
                    onCollectionChange({
                      ...collection,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  placeholder="e.g. Portfolio Pages"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 opacity-70">
                  API Slug
                </label>
                <input
                  type="text"
                  value={collection.slug}
                  disabled
                  className="w-full px-3 py-2 bg-muted border border-input rounded-md text-muted-foreground font-mono text-sm opacity-70 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The API slug cannot be changed after creation.
                </p>
              </div>
              <div>
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Description{' '}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </label>
                <textarea
                  id="edit-description"
                  value={collection.description || ''}
                  onChange={(e) =>
                    onCollectionChange({
                      ...collection,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm min-h-[80px] resize-y"
                  placeholder="Briefly describe what this collection is for..."
                />
              </div>
            </div>

            {isError && (
              <p className="text-sm font-medium text-destructive mb-4">
                Failed to update collection. Please try again.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !collection.name}
                className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
