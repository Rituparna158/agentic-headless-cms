import type { PageEntry } from '@/types/content.types';

export const getSubmissionTimestamp = (e: PageEntry): string =>
  String(e.data?.receivedAt ?? e.createdAt ?? '');

export const formatSubmissionDate = (iso: string): string => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleString() : '';
};
