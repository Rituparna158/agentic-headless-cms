import { Link } from 'react-router-dom';
import { Search, Boxes, Palette, Eye, Trash2 } from 'lucide-react';
import type { CollectionEntriesGridViewProps } from '../types/collections.types';
import { normalizeCollaborator } from '../utils/collaborator.util';

export type { CollectionEntriesGridViewProps };

export function CollectionEntriesGridView({
  pages,
  schemaSlug,
  search,
  onSearchChange,
  page,
  pageSize,
  totalCount,
  pageCount,
  onPageChange,
  currentUser,
  pageAuthorMap,
  onOpenDrawer,
  onDeletePage,
}: CollectionEntriesGridViewProps) {
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search pages..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs"
          />
        </div>
        {totalCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} pages
          </p>
        )}
      </div>

      {pages.length === 0 && search ? (
        <div className="text-center py-12 border border-border rounded-2xl bg-card/40">
          <p className="text-sm font-medium text-muted-foreground">
            No pages matching &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pages.map((p) => {
            const title = p.data?.title || 'Untitled';
            const slug = p.data?.slug || '-';
            const cleanSlug = slug.replace(/^\//, '');
            const rawAuthor =
              p.updatedBy ||
              pageAuthorMap.get(p.id)?.name ||
              currentUser?.firstName ||
              currentUser?.email ||
              'Admin';
            const authorDisplayName = normalizeCollaborator(
              rawAuthor,
              currentUser,
            ).displayName;

            const pageSchemas = (
              Array.isArray(p.data?._schemas) ? p.data._schemas : []
            ) as Array<{ name?: string; slug?: string }>;

            return (
              <div
                key={p.id}
                className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 p-5"
              >
                <div className="flex gap-4 items-start mb-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <span className="text-xl font-bold">
                      {title.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => onOpenDrawer(p)}
                        className="text-lg font-bold text-foreground hover:text-primary transition-colors truncate tracking-tight text-left"
                        title={title}
                      >
                        {title}
                      </button>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 tracking-wide ${
                          p.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'published'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        {p.status === 'published' ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground truncate">
                      /{cleanSlug}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-3 mb-5 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-muted-foreground">
                      Schemas:
                    </span>
                    {pageSchemas.length > 0 ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono"
                        title={pageSchemas
                          .map((s) => s.name || s.slug)
                          .join(', ')}
                      >
                        <Boxes className="w-3 h-3 text-indigo-400" />
                        {pageSchemas.length}{' '}
                        {pageSchemas.length === 1 ? 'Schema' : 'Schemas'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500 font-mono">
                        No Schemas
                      </span>
                    )}
                  </div>
                  {p.createdAt && (
                    <div className="flex justify-between items-center text-[12px] text-muted-foreground">
                      <span className="font-medium">Created:</span>
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[12px] text-muted-foreground">
                    <span className="font-medium">Last Updated:</span>
                    <div className="flex items-center gap-1">
                      <span>
                        {p.updatedAt
                          ? new Date(p.updatedAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                      {authorDisplayName && (
                        <>
                          <span className="opacity-50">•</span>
                          <span>
                            by{' '}
                            <span className="font-medium text-foreground">
                              {authorDisplayName}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDrawer(p)}
                    className="flex-1 flex justify-center items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-sm shadow-indigo-600/20"
                  >
                    Edit Details & Schema
                  </button>
                  <Link
                    to={`/collections/${schemaSlug}/${p.id}`}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-indigo-400 transition-colors"
                    title="Visual Page Builder"
                  >
                    <Palette className="w-4 h-4 text-indigo-400" />
                  </Link>
                  <Link
                    to={`/collections/${schemaSlug}/preview/${cleanSlug || p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
                    title="Preview Page"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      onDeletePage({
                        id: p.id,
                        title,
                      })
                    }
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-background hover:bg-destructive/10 text-destructive transition-colors"
                    title="Delete Page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors shadow-xs"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(pageCount, page + 1))}
              disabled={page >= pageCount}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
