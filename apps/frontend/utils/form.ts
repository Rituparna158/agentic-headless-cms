import type { SchemaDefinition } from '@repo/shared-types';

export function buildDefaultValues(
  definition: SchemaDefinition,
  existingData?: Record<string, unknown>,
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const field of definition.fields) {
    const existing = existingData?.[field.apiId];
    if (existing !== undefined) {
      defaults[field.apiId] = existing;
    } else if (field.isRepeatable) {
      defaults[field.apiId] = [];
    } else if (field.dataType === 'boolean') {
      defaults[field.apiId] = false;
    } else if (field.dataType === 'number') {
      // '' is not a valid empty value for z.number().optional() — it must
      // be undefined, not a string, or an untouched optional number field
      // fails validation before the user has typed anything.
      defaults[field.apiId] = undefined;
    } else {
      defaults[field.apiId] = '';
    }
  }

  return defaults;
}
