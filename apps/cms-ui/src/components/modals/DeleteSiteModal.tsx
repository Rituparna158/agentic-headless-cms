import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { SiteToDeleteItem, DeleteSiteModalProps } from './types';

export type { SiteToDeleteItem, DeleteSiteModalProps };

export function DeleteSiteModal({
  site,
  onClose,
  onConfirm,
  isPending,
  isError,
  errorMessage,
}: DeleteSiteModalProps) {
  const [typedSlug, setTypedSlug] = useState('');
  const [forceDelete, setForceDelete] = useState(false);

  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: Boolean(site),
    onEscape: onClose,
    restoreFocus: true,
  });

  // Reset internal state when the target website changes
  useEffect(() => {
    setTypedSlug('');
    setForceDelete(false);
  }, [site]);

  // If a conflict error occurred, auto-reveal the force delete option
  const hasConflict =
    isError &&
    (errorMessage?.toLowerCase().includes('active') ||
      errorMessage?.toLowerCase().includes('entry') ||
      errorMessage?.toLowerCase().includes('constraint') ||
      errorMessage?.toLowerCase().includes('conflict'));

  if (!site) return null;

  const targetSlug = (site.slug || '').trim();
  const targetName = (site.name || '').trim();
  const isMatch =
    typedSlug.trim().toLowerCase() === targetSlug.toLowerCase() ||
    typedSlug.trim().toLowerCase() === targetName.toLowerCase();

  const entryCount = site.entryCount ?? 0;
  const hasExistingContent = entryCount > 0 || hasConflict;

  // If the site has content, forceful confirmation is required
  const canConfirm =
    isMatch && (!hasExistingContent || forceDelete) && !isPending;

  const handleClose = () => {
    setTypedSlug('');
    setForceDelete(false);
    onClose();
  };

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(hasExistingContent ? true : forceDelete);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-site-title"
      aria-describedby="delete-site-desc"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-card rounded-2xl shadow-2xl border border-destructive/30 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 outline-none"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3 text-destructive">
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2
                id="delete-site-title"
                className="text-lg font-bold text-foreground"
              >
                Delete Website Property
              </h2>
              <span className="text-[10px] text-destructive font-semibold uppercase tracking-wider">
                Destructive & Irreversible Action
              </span>
            </div>
          </div>

          <p
            id="delete-site-desc"
            className="text-sm text-muted-foreground mb-4 leading-relaxed"
          >
            This action cannot be undone. This will permanently delete the
            website property{' '}
            <span className="font-semibold text-foreground">
              &quot;{site.name}&quot;
            </span>{' '}
            (
            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
              {site.slug}
            </code>
            ) and purge all linked configurations.
          </p>

          {/* Warning banner when site has active content */}
          {hasExistingContent && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  Website Contains Active Content
                </p>
                <p className="text-muted-foreground leading-normal">
                  This website currently contains{' '}
                  <strong className="text-foreground">
                    {entryCount > 0 ? `${entryCount} items` : 'active content'}
                  </strong>{' '}
                  (pages, blog posts, shared sections, or submissions). To
                  prevent accidental loss, standard deletion is blocked.
                </p>
                <div className="pt-2">
                  <label className="flex items-start gap-2 cursor-pointer font-medium text-foreground select-none">
                    <input
                      type="checkbox"
                      checked={forceDelete}
                      onChange={(e) => setForceDelete(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-destructive focus:ring-destructive cursor-pointer"
                    />
                    <span>
                      Force delete this website and permanently destroy all
                      nested pages, posts, and data.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Error alert if previous attempt failed */}
          {isError && errorMessage && !hasConflict && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Vercel-style typed confirmation box */}
          <div className="mb-5 rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-2">
            <label
              htmlFor="confirm-site-slug-input"
              className="block text-xs font-medium text-foreground"
            >
              To confirm deletion, type{' '}
              <span className="font-mono font-bold text-destructive bg-background px-1.5 py-0.5 rounded border border-destructive/30 select-all">
                {site.slug}
              </span>{' '}
              below:
            </label>
            <div className="relative">
              <input
                id="confirm-site-slug-input"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={typedSlug}
                onChange={(e) => setTypedSlug(e.target.value)}
                placeholder={site.slug}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive pr-8"
              />
              {isMatch && (
                <CheckCircle2
                  className="absolute right-2.5 top-2.5 size-4 text-emerald-500"
                  aria-label="Matched"
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Deleting Website...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Permanently Delete Website</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
