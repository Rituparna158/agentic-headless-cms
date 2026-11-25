import { marked } from 'marked';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import type { Rec, ValueKind, Resolved } from './types';
import { FIELD_ALIASES } from './constants';

export { FIELD_ALIASES };
export type { ValueKind, Resolved };

const aliasGroupOf = (key: string): string[] | null => {
  for (const group of Object.values(FIELD_ALIASES)) {
    if (group.includes(key)) return group;
  }
  return null;
};

export const kindOf = (key: string): ValueKind => {
  if (FIELD_ALIASES.content!.includes(key)) return 'html';
  if (FIELD_ALIASES.image!.includes(key)) return 'image';
  return 'text';
};

export const isEmptyValue = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

export const getPath = (obj: unknown, path: string): unknown => {
  let current: unknown = obj;
  for (const part of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Rec)[part];
  }
  return current;
};

/**
 * Finds a value for `key`, looking only at the given records, in order
 * (usually: the current post, then the current page). Never looks at other
 * entries, so one page can never show another page's data.
 */
export const lookup = (scopes: Rec[], key: string): unknown => {
  const group = aliasGroupOf(key);
  for (const scope of scopes) {
    const direct = getPath(scope, key);
    if (!isEmptyValue(direct)) return direct;
    if (group) {
      for (const alias of group) {
        const v = getPath(scope, alias);
        if (!isEmptyValue(v)) return v;
      }
    }
  }
  return undefined;
};

const formatDate = (raw: unknown): string => {
  if (typeof raw !== 'string' && typeof raw !== 'number') return String(raw);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** Turns a raw stored value into something displayable for the given key. */
export const resolveValue = (key: string, raw: unknown): Resolved => {
  const kind = kindOf(key);

  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Rec;
    if (kind === 'image') {
      const imgCandidate =
        obj.url || obj.path || obj.src || obj.file || obj.href;
      if (typeof imgCandidate === 'string' && imgCandidate) {
        return { kind: 'image', value: getMediaFileUrl(imgCandidate) };
      }
    }
    if (typeof obj.html === 'string') return { kind: 'html', value: obj.html };
    if (typeof obj.markdown === 'string') {
      return { kind: 'html', value: marked.parse(obj.markdown) as string };
    }
    return { kind: 'text', value: JSON.stringify(raw) };
  }

  if (Array.isArray(raw)) return { kind: 'text', value: raw.join(', ') };

  if (kind === 'image') {
    const str = String(raw).trim();
    return { kind, value: str ? getMediaFileUrl(str) : '' };
  }
  if (kind === 'html') return { kind, value: String(raw) };

  const text = String(raw);
  if (
    FIELD_ALIASES.date!.includes(key) ||
    /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(text)
  ) {
    return { kind: 'text', value: formatDate(raw) };
  }
  return { kind: 'text', value: text };
};
