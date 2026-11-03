import React from 'react';
import { Send } from 'lucide-react';
import type { PageDrawerFooterProps } from './drawer.types';

export const PageDrawerFooter: React.FC<PageDrawerFooterProps> = ({
  isPublished,
  isSaving,
  onSaveDraft,
  onPublishLive,
}) => {
  return (
    <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-[#121215] flex items-center justify-between shrink-0">
      <span className="text-xs text-zinc-400">
        Publication Status:{' '}
        <strong className={isPublished ? 'text-emerald-400' : 'text-zinc-300'}>
          {isPublished ? 'Published Live' : 'Draft Mode'}
        </strong>
      </span>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={onPublishLive}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send className="size-3.5" />
          <span>{isSaving ? 'Publishing...' : 'Publish Live'}</span>
        </button>
      </div>
    </div>
  );
};
