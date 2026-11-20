import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { PageEntry } from '@/types/content.types';
import type { FeatureBlogDialogProps } from '../types/blog.types';

const hasLayout = (p: PageEntry) => {
  const body = p.data?.body;
  return Boolean(
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    (body as { html?: string }).html,
  );
};

export const FeatureBlogDialog: React.FC<FeatureBlogDialogProps> = ({
  blogName,
  pages,
  isSaving,
  onClose,
  onConfirm,
}) => {
  const [pageId, setPageId] = useState(pages[0]?.id ?? '');
  const [title, setTitle] = useState(`Latest from ${blogName}`);
  const [limit, setLimit] = useState(3);
  const target = pages.find((p) => p.id === pageId);

  const input =
    'w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Feature this blog on a page"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    >
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Show {blogName} on a page
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Adds a &ldquo;latest posts&rdquo; section to the page you choose.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This website has no other pages yet. Add a page first, then
              feature the blog on it.
            </p>
          ) : (
            <>
              <div>
                <label
                  htmlFor="fb-page"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Page
                </label>
                <select
                  id="fb-page"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className={input}
                >
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || (p.data?.title as string) || 'Untitled'} (
                      {p.slug || '/'})
                    </option>
                  ))}
                </select>
                {target && !hasLayout(target) && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    This page has no layout yet, so it will start with just this
                    section.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="fb-title"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Section heading
                </label>
                <input
                  id="fb-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label
                  htmlFor="fb-limit"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Number of posts
                </label>
                <select
                  id="fb-limit"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className={input}
                >
                  {[3, 6, 9, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-muted-foreground">
                It is saved to the page as a draft. Publish the page when you
                are happy with it.
              </p>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!pageId || !title.trim() || isSaving}
            onClick={() => onConfirm({ pageId, title: title.trim(), limit })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Add to page
          </button>
        </div>
      </div>
    </div>
  );
};
