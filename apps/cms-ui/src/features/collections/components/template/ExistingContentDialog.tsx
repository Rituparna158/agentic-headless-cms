import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Replace,
  PlusCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ExistingContentDialogProps } from '../../types/template.types';

export const ExistingContentDialog: React.FC<ExistingContentDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setShowReplaceConfirm(false);
      setConfirmKeyword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOverwriteMatch = confirmKeyword.trim().toUpperCase() === 'OVERWRITE';

  const handleClose = () => {
    setShowReplaceConfirm(false);
    setConfirmKeyword('');
    onClose();
  };

  const handleReplaceConfirmed = () => {
    if (isOverwriteMatch) {
      onConfirm('replace');
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-[#141417] text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">
                Existing Content Detected
              </h3>
              <p className="text-xs text-zinc-400">
                {showReplaceConfirm
                  ? 'Confirm canvas overwrite'
                  : 'How would you like to apply the template?'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        {!showReplaceConfirm ? (
          <div className="p-6 space-y-3">
            <button
              type="button"
              onClick={() => setShowReplaceConfirm(true)}
              className="w-full flex items-start gap-3.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-amber-500/40 text-left transition-all group"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <Replace className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  Replace Current Canvas
                  <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Destructive
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Clears current elements and loads the template. Requires
                  explicit confirmation.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm('append');
                handleClose();
              }}
              className="w-full flex items-start gap-3.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-indigo-500/50 text-left transition-all group"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <PlusCircle className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  Append Below Existing Content
                  <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Safe
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Retains all existing components on your page and appends the
                  new template blocks underneath.
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 leading-relaxed">
              <strong>Warning:</strong> Overwriting will replace all components
              on your active canvas.
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-200">
                To confirm overwrite, please type{' '}
                <span className="font-mono font-bold text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded select-all">
                  OVERWRITE
                </span>{' '}
                below:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={confirmKeyword}
                  onChange={(e) => setConfirmKeyword(e.target.value)}
                  placeholder="Type OVERWRITE..."
                  autoFocus
                  className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-mono"
                />
                {isOverwriteMatch && (
                  <CheckCircle2 className="size-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReplaceConfirm(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleReplaceConfirmed}
                disabled={!isOverwriteMatch}
                className="rounded-xl px-4 py-2 text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Confirm & Overwrite
              </button>
            </div>
          </div>
        )}

        {/* Footer (only in main option view) */}
        {!showReplaceConfirm && (
          <div className="flex items-center justify-end border-t border-zinc-800/80 bg-zinc-900/40 px-6 py-3.5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
