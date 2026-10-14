import React from 'react';
import { AlertTriangle, Replace, PlusCircle, X } from 'lucide-react';
import { ExistingContentDialogProps } from '../../types/template.types';

export const ExistingContentDialog: React.FC<ExistingContentDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-[#141417] text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">
                Existing Content Detected
              </h3>
              <p className="text-xs text-zinc-400">
                How would you like to apply the template?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          <button
            type="button"
            onClick={() => {
              onConfirm('replace');
              onClose();
            }}
            className="w-full flex items-start gap-3.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-indigo-500/50 text-left transition-all group"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
              <Replace className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Replace Current Canvas
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Clears current elements and loads the template. You can press
                <span className="font-mono text-zinc-200 mx-1">Ctrl+Z</span>
                to undo at any time.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm('append');
              onClose();
            }}
            className="w-full flex items-start gap-3.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-700 text-left transition-all group"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700 transition-colors">
              <PlusCircle className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">
                Append Below Existing Content
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Retains all existing components on your page and appends the new
                template blocks underneath.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-800/80 bg-zinc-900/40 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
