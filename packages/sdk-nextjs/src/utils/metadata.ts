import type { ContentEntryRecord, SchemaRecord } from '@repo/types';
import { toPlainText } from './text.js';

/** Optional field overrides when deriving page metadata from a CMS entry. */
export interface ExtractMetaFieldsOptions {
  /** Explicit schema field `apiId` to use for the page title instead of positional lookup. */
  titleField?: string;
  /** Explicit schema field `apiId` to use for the description instead of positional lookup. */
  descriptionField?: string;
  /** Explicit schema field `apiId` to use for the OpenGraph image instead of positional lookup. */
  imageField?: string;
}

/** Extracts title, description, and image URL or unresolved media asset ID from a content entry. */
export function extractMetaFields(
  entry: ContentEntryRecord,
  schema: SchemaRecord,
  options?: ExtractMetaFieldsOptions,
): {
  title: string;
  description: string;
  imageUrl: string | null;
  mediaId: string | null;
} {
  const fields = schema.definition.fields;

  const titleApiId =
    options?.titleField ??
    fields.find((f) => f.dataType === 'text' || f.dataType === 'richtext')
      ?.apiId;
  const title = titleApiId ? toPlainText(entry.data[titleApiId]) : entry.id;

  const descApiId =
    options?.descriptionField ??
    fields.find(
      (f) =>
        (f.dataType === 'text' || f.dataType === 'richtext') &&
        f.apiId !== titleApiId,
    )?.apiId;
  const description = descApiId ? toPlainText(entry.data[descApiId]) : '';

  const mediaApiId =
    options?.imageField ?? fields.find((f) => f.dataType === 'media')?.apiId;
  const rawMedia = mediaApiId ? entry.data[mediaApiId] : null;
  const mediaCandidate = Array.isArray(rawMedia) ? rawMedia[0] : rawMedia;

  let imageUrl: string | null = null;
  let mediaId: string | null = null;

  if (
    mediaCandidate &&
    typeof mediaCandidate === 'object' &&
    'url' in mediaCandidate
  ) {
    const candidateUrl = (mediaCandidate as { url?: unknown }).url;
    imageUrl =
      typeof candidateUrl === 'string' && candidateUrl ? candidateUrl : null;
  } else if (typeof mediaCandidate === 'string' && mediaCandidate.trim()) {
    const trimmed = mediaCandidate.trim();
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
      imageUrl = trimmed;
    } else {
      mediaId = trimmed;
    }
  }

  return { title, description, imageUrl, mediaId };
}
