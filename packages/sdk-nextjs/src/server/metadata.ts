/** generateMetadataFromEntry — builds a Next.js Metadata object from a CMS entry. */
import type { ContentEntryRecord, SchemaRecord } from '@repo/types';
import type { CmsMetadata } from '../types.js';
import {
  extractMetaFields,
  type ExtractMetaFieldsOptions,
} from '../utils/metadata.js';
import { getContentEntry } from './content.js';
import { getMediaAsset } from './media.js';
import { getSchema } from './schemas.js';

export type { CmsMetadata, ExtractMetaFieldsOptions };

/** Options for `generateMetadataFromEntry`. */
export interface GenerateMetadataOptions extends ExtractMetaFieldsOptions {
  /** Locale code passed to `getContentEntry`. */
  locale?: string;
  /** Set `true` when Draft Mode is active to generate metadata from draft content. */
  draft?: boolean;
  /** Pre-fetched content entry to avoid a duplicate network request. */
  entry?: ContentEntryRecord;
  /** Pre-fetched schema definition to avoid a duplicate network request. */
  schema?: SchemaRecord;
}

/** Generates a Next.js-compatible Metadata object from a CMS content entry. */
export async function generateMetadataFromEntry(
  schemaSlug: string,
  entryId: string,
  options?: GenerateMetadataOptions,
): Promise<CmsMetadata> {
  const [entry, schema] = await Promise.all([
    options?.entry ??
      getContentEntry(schemaSlug, entryId, {
        locale: options?.locale,
        draft: options?.draft,
      }),
    options?.schema ?? getSchema(schemaSlug),
  ]);

  const {
    title,
    description,
    imageUrl: extractedUrl,
    mediaId,
  } = extractMetaFields(entry, schema, {
    titleField: options?.titleField,
    descriptionField: options?.descriptionField,
    imageField: options?.imageField,
  });

  let imageUrl = extractedUrl;
  if (!imageUrl && mediaId) {
    try {
      const asset = await getMediaAsset(mediaId);
      imageUrl = asset.url ?? null;
    } catch {
      imageUrl = null;
    }
  }

  const apiBaseUrl = (process.env['CMS_API_URL'] ?? '')
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '');

  return {
    title: title || null,
    description: description || null,
    openGraph: {
      title: title || null,
      description: description || null,
      ...(imageUrl
        ? {
            images: [
              {
                url: /^https?:\/\//i.test(imageUrl)
                  ? imageUrl
                  : `${apiBaseUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`,
              },
            ],
          }
        : {}),
    },
  };
}
