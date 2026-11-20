import React, { useState } from 'react';
import { X, FileText, PenTool, ArrowRight } from 'lucide-react';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import type { WhatToPostDispatcherModalProps } from '../types/posts.types';

export type { WhatToPostDispatcherModalProps };

export const WhatToPostDispatcherModal: React.FC<
  WhatToPostDispatcherModalProps
> = ({
  isOpen,
  onClose,
  siteName,
  pages,
  blogs,
  onSelectBlog,
  onSelectPageForm,
  blogEnabled = true,
  settingsHref,
}) => {
  const [selectedPageId, setSelectedPageId] = useState<string>(() => {
    return pages[0]?.id || '';
  });

  // Update selected page if pages load
  React.useEffect(() => {
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0]!.id);
    }
  }, [pages, selectedPageId]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="What do you want to post?"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              What Do You Want to Post?
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select content type to publish to &ldquo;{siteName}&rdquo;:
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dispatcher Options Body */}
        <div className="p-6 space-y-4">
          {/* Option 1: Blog post */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                <PenTool size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  ✍️ A Blog Post
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Write a new post in the distraction-free writing studio. Pick
                  the kind of post below.
                </p>
              </div>
            </div>
            {blogs.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {blogs.map((b) => (
                  <button
                    key={b.pageId}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectBlog(b.pageId);
                    }}
                    className={CMS_THEME_CLASSES.buttons.primary}
                  >
                    <span>New {b.postLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {blogEnabled
                  ? 'No blog type is set up yet. '
                  : 'Blogging is turned off for this website. '}
                {settingsHref && (
                  <a
                    href={settingsHref}
                    className="font-semibold text-primary hover:underline"
                  >
                    Set up a blog in Site Settings
                  </a>
                )}
              </p>
            )}
          </div>

          {/* Option 2: Page Content Form */}
          <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors flex flex-col justify-between group">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">
                  📄 Page Content Form
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Fill out the structured content sections (Hero banner, feature
                  cards, FAQs) for a static page without touching layout
                  templates.
                </p>

                {/* Target Page Selector using Real Pages */}
                <div className="mt-3.5">
                  <label
                    htmlFor="target-page-select"
                    className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider"
                  >
                    Target Page:
                  </label>
                  {pages.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No published pages available yet.
                    </p>
                  ) : (
                    <select
                      id="target-page-select"
                      value={selectedPageId}
                      onChange={(e) => setSelectedPageId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title ||
                            (p.data?.title as string) ||
                            'Untitled Page'}{' '}
                          (
                          {p.slug
                            ? p.slug.startsWith('/')
                              ? p.slug
                              : `/${p.slug}`
                            : '/'}
                          )
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={!selectedPageId && pages.length === 0}
                onClick={() => {
                  if (selectedPageId) {
                    onClose();
                    onSelectPageForm(selectedPageId);
                  }
                }}
                className={`${CMS_THEME_CLASSES.buttons.secondary} disabled:opacity-40`}
              >
                <span>Open Page Form</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
