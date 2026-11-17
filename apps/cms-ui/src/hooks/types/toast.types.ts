export type CmsToastType = 'success' | 'error' | 'warning' | 'info';

export interface CmsToastInput {
  title?: string;
  message: string;
  type?: CmsToastType;
}
