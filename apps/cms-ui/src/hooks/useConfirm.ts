import { useCallback, useContext } from 'react';
import { DialogContext } from '@repo/shared-ui';
import type { ConfirmOptions } from './types/confirm.types';

export type { ConfirmOptions };

/**
 * Promise-based replacement for window.confirm() that uses the shared
 * DialogProvider so confirmations match the rest of the CMS UI.
 */
export const useConfirm = () => {
  const dialog = useContext(DialogContext);

  return useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        if (!dialog) {
          resolve(false);
          return;
        }
        dialog.openDialog({
          dialogType: 'confirm',
          title: options.title,
          content: options.message,
          confirmButtonText: options.confirmText ?? 'Confirm',
          cancelButtonText: options.cancelText ?? 'Cancel',
          confirmationCallBack: (confirmed) => resolve(confirmed),
        });
      }),
    [dialog],
  );
};
