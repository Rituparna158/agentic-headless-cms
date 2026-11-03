import { AlertCircle } from 'lucide-react';
import type { DraftRecoveryBannerProps } from '@/features/collections/types/page-builder.types';

export type { DraftRecoveryBannerProps };

export function DraftRecoveryBanner({
  draft,
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) {
  if (!draft) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          <strong>Unsaved local draft detected</strong> (auto-saved{' '}
          {new Date(draft.updatedAt).toLocaleTimeString()}). Would you like to
          restore your uncommitted changes?
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="px-2.5 py-1 rounded bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
        >
          Restore Draft
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="px-2.5 py-1 rounded border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
