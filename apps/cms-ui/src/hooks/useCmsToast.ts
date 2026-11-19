import { useToast } from '@repo/shared-ui';
import type { CmsToastType, CmsToastInput } from './types/toast.types';

export type { CmsToastType, CmsToastInput };

/**
 * Thin wrapper over the shared-ui toast that offers the
 * `show({ title, message, type })` shape used across CMS pages.
 * The shared toast has no title field, so the title is prefixed to the message.
 */
export const useCmsToast = () => {
  const toast = useToast();

  const show = ({ title, message, type = 'info' }: CmsToastInput) => {
    const text = title ? `${title} — ${message}` : message;
    toast[type](text);
  };

  return { ...toast, show };
};
