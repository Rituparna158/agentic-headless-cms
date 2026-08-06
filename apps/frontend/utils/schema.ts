import type { SchemaDefinition } from '@repo/types';

/**
 * If the schema has no text field, fall back to the first media field
 */
export function pickTitleField(definition: SchemaDefinition) {
  return (
    definition.fields.find(
      (f) => f.dataType === 'text' || f.dataType === 'richtext',
    ) ?? definition.fields.find((f) => f.dataType === 'media')
  );
}
