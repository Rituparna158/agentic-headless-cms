import type { ContentEntryRecord, SchemaRecord } from '@repo/types';
import { toPlainText } from './text.js';

/** Extracts title, description, and imageUrl from a content entry using schema field definitions. */
export function extractMetaFields(
  entry: ContentEntryRecord,
  schema: SchemaRecord,
): { title: string; description: string; imageUrl: string | null } {
  const fields = schema.definition.fields;

  const titleField = fields.find(
    (f) => f.dataType === 'text' || f.dataType === 'richtext',
  );
  const title = titleField
    ? toPlainText(entry.data[titleField.apiId])
    : entry.id;

  const descField = fields.find(
    (f) =>
      (f.dataType === 'text' || f.dataType === 'richtext') &&
      f.apiId !== titleField?.apiId,
  );
  const description = descField ? toPlainText(entry.data[descField.apiId]) : '';

  const mediaField = fields.find((f) => f.dataType === 'media');
  const mediaValue = mediaField
    ? (entry.data[mediaField.apiId] as { url?: string } | null)
    : null;

  return { title, description, imageUrl: mediaValue?.url ?? null };
}
