'use client';

import { useState } from 'react';
import { Modal } from '@repo/shared-ui';
import type { WorkflowTransition, WorkflowStage } from '@repo/types';

interface WorkflowTransitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transition: WorkflowTransition | null;
  currentStage: WorkflowStage | null;
  targetStageName?: string;
  onConfirm: (comment?: string) => Promise<void> | void;
  isPending: boolean;
}

function formatStageName(slug?: string): string {
  if (!slug) return '';
  return slug
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function WorkflowTransitionModal({
  open,
  onOpenChange,
  transition,
  currentStage,
  targetStageName,
  onConfirm,
  isPending,
}: WorkflowTransitionModalProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!transition) return null;

  const isRejectionOrChangeRequest =
    transition.name.toLowerCase().includes('change') ||
    transition.name.toLowerCase().includes('reject') ||
    (currentStage &&
      !currentStage.isInitial &&
      (transition.toStage === 'draft' ||
        transition.toStage.toLowerCase().includes('draft') ||
        transition.toStage.toLowerCase().includes('change')));

  const handleConfirm = async () => {
    if (isRejectionOrChangeRequest && !comment.trim()) {
      setError('Please provide feedback explaining the requested changes.');
      return;
    }
    setError(null);
    await onConfirm(comment.trim() || undefined);
    setComment('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setComment('');
    setError(null);
    onOpenChange(false);
  };

  const fromName = currentStage?.name || formatStageName(transition.fromStage);
  const toName = formatStageName(targetStageName || transition.toStage);

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={transition.name || 'Move to Next Stage'}
      showFooter={false}
      colorScheme="primary"
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Action summary text */}
        <p className="text-xs text-muted-foreground">
          Moving entry from{' '}
          <span className="font-semibold text-foreground">{fromName}</span> to{' '}
          <span className="font-semibold text-foreground">{toName}</span>.
        </p>

        {/* Review Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1">
            Review Note{' '}
            {isRejectionOrChangeRequest ? (
              <span className="text-destructive font-semibold">(Required)</span>
            ) : (
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            )}
          </label>
          <textarea
            placeholder={
              isRejectionOrChangeRequest
                ? 'Please explain the changes needed or reason for rejection...'
                : 'Add an optional note for the review history...'
            }
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError(null);
            }}
            rows={3}
            className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs resize-none"
          />
          {error && (
            <p className="text-[11px] text-destructive font-medium">{error}</p>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
          >
            {isPending ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
