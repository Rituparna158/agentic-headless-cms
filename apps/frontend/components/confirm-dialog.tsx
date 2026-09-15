'use client';

import { Modal } from '@repo/shared-ui';

import type { ConfirmDialogProps } from '@/types/component.types';

/**
 * Generic yes/no confirmation modal — not tied to any one action. Callers
 * own the `open` state (typically the id of the thing pending confirmation)
 * and pass `onConfirm` for what actually happens when the user confirms.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      showFooter={true}
      confirmText={confirmLabel}
      cancelText={cancelLabel}
      onConfirm={onConfirm}
      onCancel={() => onOpenChange(false)}
      colorScheme={destructive ? 'destructive' : 'primary'}
      colorOverrides={{
        confirmButton: destructive
          ? 'bg-destructive text-white hover:bg-destructive/90 shadow-destructive/25'
          : 'bg-primary text-white hover:bg-primary/90 shadow-primary/25',
      }}
    >
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </Modal>
  );
}
