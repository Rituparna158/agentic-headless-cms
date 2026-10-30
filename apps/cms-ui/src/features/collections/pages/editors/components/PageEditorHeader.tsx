import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  History,
  Boxes,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import type { PageEditorHeaderProps } from '@/features/collections/types/page-builder.types';

export type { PageEditorHeaderProps };

export function PageEditorHeader({
  schemaSlug,
  slug,
  title,
  onTitleChange,
  onSlugChange,
  activeBuilder,
  availableSchemasCount,
  onOpenSchemaDrawer,
  onOpenImportModal,
  onOpenHistoryDrawer,
  lastAutoSavedAt,
  isSaving,
  isDirty,
  onSave,
  onNavigateBack,
}: PageEditorHeaderProps) {
  const handlePreview = () => {
    window.open(
      `/collections/${schemaSlug}/preview${slug.startsWith('/') ? '' : '/'}${slug}`,
      '_blank',
    );
  };

  const statusText = isSaving
    ? 'Saving changes to cloud...'
    : isDirty
      ? 'Unsaved changes on canvas'
      : 'All changes saved to cloud';

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onNavigateBack}
          className="p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
          title="Back to Pages"
          aria-label="Back to Pages"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={title}
            onChange={onTitleChange}
            placeholder="Page Title"
            aria-label="Page Title"
            className="text-lg font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-zinc-600 rounded px-1"
          />
          <input
            type="text"
            value={slug}
            onChange={onSlugChange}
            placeholder="/page-slug"
            aria-label="Page URL slug"
            className="text-sm font-mono bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-zinc-600 rounded px-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSchemaDrawer}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-medium hover:bg-indigo-500/20 transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          title="Manage custom schemas and content fields for this page"
          aria-label="Manage custom schemas"
        >
          <Boxes className="h-3.5 w-3.5 text-indigo-400" />
          <span>Schemas</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-[10px] font-mono">
            {availableSchemasCount}
          </span>
        </button>

        {activeBuilder === 'grapesjs' && (
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-zinc-600"
            title="Import dynamic JSON template"
            aria-label="Import JSON template"
          >
            <Upload className="h-3.5 w-3.5 text-indigo-400" />
            Template
          </button>
        )}

        <button
          type="button"
          onClick={onOpenHistoryDrawer}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer"
          title="View version snapshots and rollback"
          aria-label="View version history"
        >
          <History className="h-3.5 w-3.5 text-amber-400" />
          History
        </button>

        <button
          type="button"
          onClick={handlePreview}
          disabled={!slug}
          aria-label="Preview page in new tab"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>

        {/* Persistent Save Status Badge with aria-live="polite" */}
        <div
          data-testid="save-status-badge"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
            isSaving
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
              : isDirty
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          }`}
          title={
            isSaving
              ? 'Saving changes to cloud...'
              : isDirty
                ? 'Unsaved changes on canvas'
                : lastAutoSavedAt
                  ? `Saved to cloud (Draft auto-saved locally at ${new Date(lastAutoSavedAt).toLocaleTimeString()})`
                  : 'All changes saved to cloud'
          }
        >
          <span className="sr-only">{statusText}</span>
          {isSaving ? (
            <>
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-blue-400"
                aria-hidden="true"
              />
              <span>Saving...</span>
            </>
          ) : isDirty ? (
            <>
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Unsaved edits</span>
            </>
          ) : (
            <>
              <CheckCircle2
                className="h-3.5 w-3.5 text-emerald-400"
                aria-hidden="true"
              />
              <span>Saved to cloud</span>
            </>
          )}

          {lastAutoSavedAt && !isSaving && (
            <span className="text-[10px] opacity-60 hidden md:inline pl-1 border-l border-current/20">
              {new Date(lastAutoSavedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={!title.trim() || isSaving}
          aria-label={isSaving ? 'Saving changes to cloud' : 'Save changes'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 relative shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
