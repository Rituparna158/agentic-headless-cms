/** generateMetadataFromEntry — builds a Next.js Metadata object from a CMS entry. */
import type { ContentEntryRecord, SchemaRecord } from '@repo/types';
import type { CmsMetadata } from '../types.js';
import { extractMetaFields } from '../utils/metadata.js';
import { getContentEntry } from './content.js';
import { getSchema } from './schemas.js';

export type { CmsMetadata };

/** Generates a Next.js-compatible Metadata object from a CMS content entry. */
export async function generateMetadataFromEntry(
  schemaSlug: string,
  entryId: string,
  options?: {
    locale?: string;
    entry?: ContentEntryRecord;
    schema?: SchemaRecord;
  },
): Promise<CmsMetadata> {
  const [entry, schema] = await Promise.all([
    options?.entry ??
      getContentEntry(schemaSlug, entryId, { locale: options?.locale }),
    options?.schema ?? getSchema(schemaSlug),
  ]);

  const { title, description, imageUrl } = extractMetaFields(entry, schema);
  const apiBaseUrl = process.env['CMS_API_URL'] ?? '';

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
                url: imageUrl.startsWith('http')
                  ? imageUrl
                  : `${apiBaseUrl}${imageUrl}`,
              },
            ],
          }
        : {}),
    },
  };
}
