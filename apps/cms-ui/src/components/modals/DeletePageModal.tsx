import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

import type { PageToDeleteItem, DeletePageModalProps } from './types';

export type { PageToDeleteItem, DeletePageModalProps };

export function DeletePageModal({
  page,
  onClose,
  onConfirm,
  isPending,
  isError,
}: DeletePageModalProps) {
  const [typedTitle, setTypedTitle] = useState('');

  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: Boolean(page),
    onEscape: onClose,
    restoreFocus: true,
  });

  // Reset input whenever the target page changes
  useEffect(() => {
    setTypedTitle('');
  }, [page]);

  if (!page) return null;

  const targetTitle = (page.title || '').trim();
  const isMatch = typedTitle.trim() === targetTitle;

  const handleClose = () => {
    setTypedTitle('');
    onClose();
  };

  const handleConfirm = () => {
    if (isMatch) {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-page-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-card rounded-2xl shadow-2xl border border-destructive/30 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 outline-none"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3 text-destructive">
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2
                id="delete-page-title"
                className="text-lg font-bold text-foreground"
              >
                Delete Page Permanently
              </h2>
              <span className="text-[10px] text-destructive font-semibold uppercase tracking-wider">
                Destructive Action
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            This action cannot be undone. All layout blocks, custom schemas, and
            revisions associated with{' '}
            <span className="font-semibold text-foreground">
              &quot;{page.title}&quot;
            </span>{' '}
            will be permanently purged.
          </p>

          <div className="mb-5 rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-2">
            <label
              htmlFor="confirm-page-title-input"
              className="block text-xs font-medium text-foreground"
            >
              To verify deletion, type{' '}
              <span className="font-mono font-bold text-destructive bg-background px-1.5 py-0.5 rounded border border-destructive/30 select-all">
                {page.title}
              </span>{' '}
              below:
            </label>
            <div className="relative">
              <input
                id="confirm-page-title-input"
                type="text"
                value={typedTitle}
                onChange={(e) => setTypedTitle(e.target.value)}
                placeholder="Type page title here..."
                autoFocus
                className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all font-medium"
              />
              {isMatch && (
                <CheckCircle2 className="size-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2 animate-in zoom-in-50" />
              )}
            </div>
          </div>

          {isError && (
            <p
              className="text-sm font-medium text-destructive mb-4"
              role="alert"
            >
              Failed to delete page. Please try again.
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || !isMatch}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-destructive"
            >
              <Trash2 className="size-4" />
              {isPending ? 'Deleting...' : 'Delete Page'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
