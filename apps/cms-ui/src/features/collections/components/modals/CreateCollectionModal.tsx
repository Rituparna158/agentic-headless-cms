import type { CreateCollectionModalProps } from '../../types/collections.types';

export type { CreateCollectionModalProps };

export function CreateCollectionModal({
  isOpen,
  onClose,
  name,
  onNameChange,
  slug,
  onSlugChange,
  description,
  onDescriptionChange,
  onSubmit,
  isPending,
  isError,
}: CreateCollectionModalProps) {
  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    onNameChange(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!slug || slug === autoSlug) {
      onSlugChange(autoSlug);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Create New Collection
          </h2>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Collection Name
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  placeholder="e.g. Portfolio Pages"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="create-slug"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  API Slug
                </label>
                <input
                  id="create-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-mono text-sm"
                  placeholder="e.g. portfolio-pages"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will automatically generate a schema with title, slug,
                  and body fields.
                </p>
              </div>
              <div>
                <label
                  htmlFor="create-description"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Description{' '}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </label>
                <textarea
                  id="create-description"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm min-h-[80px] resize-y"
                  placeholder="Briefly describe what this collection is for..."
                />
              </div>
            </div>

            {isError && (
              <p className="text-sm font-medium text-destructive mb-4">
                Failed to create collection. Please check the slug.
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
                disabled={isPending || !name || !slug}
                className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isPending ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
