import React from 'react';
import { X, Eye, Palette, CheckCircle2, Clock } from 'lucide-react';
import type { PageMetaDrawerHeaderProps } from './drawer.types';

export const PageMetaDrawerHeader: React.FC<PageMetaDrawerHeaderProps> = ({
  collectionName,
  cleanSlug,
  pageTitle,
  isPublished,
  onOpenPreview,
  onOpenCanvas,
  onClose,
}) => {
  return (
    <div className="px-6 py-3.5 border-b border-zinc-800/80 bg-[#121215] flex items-center justify-between gap-4 shrink-0">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
          <span className="font-semibold text-zinc-300">{collectionName}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-indigo-400 font-mono text-[11px]">
            /{cleanSlug}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-zinc-100 tracking-tight">
            {pageTitle || 'Untitled Page'}
          </h2>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
              isPublished
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
            }`}
          >
            {isPublished ? (
              <CheckCircle2 className="size-2.5" />
            ) : (
              <Clock className="size-2.5" />
            )}
            <span>{isPublished ? 'Live' : 'Draft'}</span>
          </span>
        </div>
      </div>

      {/* Quick Actions & Close */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          title="Open Live Preview"
        >
          <Eye className="size-3.5 text-sky-400" />
          <span>Preview</span>
        </button>

        <button
          type="button"
          onClick={onOpenCanvas}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          title="Open Canvas Editor"
        >
          <Palette className="size-3.5 text-indigo-400" />
          <span>Canvas Editor</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors ml-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-600"
          title="Close Drawer"
          aria-label="Close page drawer"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};
