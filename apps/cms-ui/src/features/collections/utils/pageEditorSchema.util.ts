import type {
  CanvasAvailableSchema,
  ExtractedCustomSchema,
  CanvasSchemaField,
} from '../types/collections.types';

export function extractPageCustomSchemas(
  pageData: Record<string, unknown> | undefined,
): ExtractedCustomSchema[] {
  const raw = pageData?._schemas;
  if (!Array.isArray(raw)) return [];

  return (raw as Array<Record<string, unknown>>)
    .filter((s) => s && typeof s === 'object' && (s.slug || s.name || s.id))
    .map((s) => ({
      id: String(s.id || s.slug || 'schema'),
      name: String(s.name || s.slug || 'Custom Schema'),
      slug: String(s.slug || s.id || 'schema'),
      fields: Array.isArray(s.fields)
        ? (s.fields as Array<Record<string, unknown>>)
            .filter((f) => f && typeof f === 'object' && f.apiId)
            .map((f) => ({
              apiId: String(f.apiId),
              displayName:
                typeof f.displayName === 'string' ? f.displayName : undefined,
              name: typeof f.name === 'string' ? f.name : undefined,
              dataType: typeof f.dataType === 'string' ? f.dataType : undefined,
            }))
        : [],
    }));
}

export function buildSchemaFields(
  pageCustomSchemas: ExtractedCustomSchema[],
): CanvasSchemaField[] {
  const seen = new Set<string>();
  const fieldsList: CanvasSchemaField[] = [];

  for (const schema of pageCustomSchemas) {
    for (const f of schema.fields || []) {
      if (f?.apiId && !seen.has(f.apiId)) {
        seen.add(f.apiId);
        fieldsList.push({
          id: f.apiId,
          name: `${schema.name}: ${f.displayName || f.name || f.apiId}`,
          apiId: f.apiId,
          dataType: f.dataType,
        });
      }
    }
  }

  return fieldsList;
}

export function buildAvailableSchemas(
  pageCustomSchemas: ExtractedCustomSchema[],
): CanvasAvailableSchema[] {
  return pageCustomSchemas.map((s) => ({
    id: s.id || s.slug,
    name: s.name,
    slug: s.slug,
    fields: (s.fields || []).map((f) => ({
      id: f.apiId,
      name: f.displayName || f.apiId,
      apiId: f.apiId,
      dataType: f.dataType,
    })),
  }));
}

export function extractSchemaValues(
  pageData: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const raw = pageData?._schemas;
  if (Array.isArray(raw)) {
    for (const s of raw as Array<{ values?: Record<string, unknown> }>) {
      if (s && s.values && typeof s.values === 'object') {
        Object.assign(values, s.values);
      }
    }
  }
  return values;
}
