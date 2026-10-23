import { Link } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import type { CollectionsGridViewProps } from '../types/collections.types';
import { normalizeCollaborator } from '../utils/collaborator.util';

export type { CollectionsGridViewProps };

export function CollectionsGridView({
  collections,
  currentUser,
  onEdit,
  onDelete,
}: CollectionsGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <div
          key={collection.id}
          className="group flex flex-col bg-card rounded-[5px] border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 p-5"
        >
          <div className="flex gap-4 items-start mb-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <span className="text-xl font-bold">
                {collection.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground truncate tracking-tight">
                  {collection.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#fbf3d0] text-[#8e6c1d] border border-[#f3e3a8] flex-shrink-0 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4a83b]" />
                  {collection.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-snug h-[40px]">
                {collection?.description || (
                  <span className="italic opacity-60">
                    No description provided.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 mb-5 border border-border/40 space-y-2">
            {collection.createdAt && (
              <div className="flex justify-between items-center text-[12px] text-muted-foreground">
                <span className="font-medium">Created:</span>
                <span>
                  {new Date(collection.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-[12px] text-muted-foreground">
              <span className="font-medium">Last Updated:</span>
              <div className="flex items-center gap-1">
                {collection.updatedAt && (
                  <span>
                    {new Date(collection.updatedAt).toLocaleDateString()}
                  </span>
                )}
                {collection.lastUpdatedBy && (
                  <>
                    <span className="opacity-50">•</span>
                    <span>
                      by{' '}
                      <span className="font-medium text-foreground">
                        {
                          normalizeCollaborator(
                            collection.lastUpdatedBy,
                            currentUser,
                          ).displayName
                        }
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <Link
              to={`/collections/${collection.slug}`}
              className="flex-1 flex justify-center items-center px-4 py-2.5 bg-[#4273b8] hover:bg-[#345c93] text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              Manage Content
            </Link>
            <button
              type="button"
              onClick={() =>
                onEdit({
                  id: collection.id,
                  name: collection.name,
                  slug: collection.slug,
                  description: collection.description,
                })
              }
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
              title="Edit Collection"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                onDelete({
                  id: collection.id,
                  name: collection.name,
                })
              }
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-destructive/10 text-destructive transition-colors"
              title="Delete Collection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
