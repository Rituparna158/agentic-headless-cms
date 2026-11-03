import type {
  CanvasAvailableSchema,
  ExtractedCustomSchema,
  CanvasSchemaField,
} from '../types/collections.types';

export function extractPageCustomSchemas(
  pageData: Record<string, unknown> | undefined,
): ExtractedCustomSchema[] {
  const raw =
    pageData?._schemas ||
    (typeof pageData?.data === 'object' && pageData?.data !== null
      ? (pageData.data as Record<string, unknown>)._schemas
      : undefined);
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
  const raw =
    pageData?._schemas ||
    (typeof pageData?.data === 'object' && pageData?.data !== null
      ? (pageData.data as Record<string, unknown>)._schemas
      : undefined);
  if (Array.isArray(raw)) {
    for (const s of raw as Array<{ values?: Record<string, unknown> }>) {
      if (s && s.values && typeof s.values === 'object') {
        Object.assign(values, s.values);
      }
    }
  }
  return values;
}

export interface PageWithSchemasLike {
  id?: string;
  title?: string;
  data?:
    | {
        title?: string;
        slug?: string;
        _schemas?: unknown[];
        [key: string]: unknown;
      }
    | Record<string, unknown>
    | unknown;
}

export function buildCollectionAvailableSchemas(
  currentPageData: Record<string, unknown> | undefined,
  collectionPages: PageWithSchemasLike[] | undefined,
  currentPageId?: string,
): CanvasAvailableSchema[] {
  const result: CanvasAvailableSchema[] = [];

  // 1. Current page schemas (marked as isCurrentPage: true)
  const currentSchemas = extractPageCustomSchemas(currentPageData);
  const currentTitle = (currentPageData?.title as string) || 'Current Page';

  for (const s of currentSchemas) {
    const schemaId = s.id || s.slug;
    result.push({
      id: schemaId,
      name: s.name,
      slug: s.slug,
      pageId: currentPageId,
      pageTitle: currentTitle,
      isCurrentPage: true,
      fields: (s.fields || []).map((f) => ({
        id: f.apiId,
        name: f.displayName || f.name || f.apiId,
        apiId: f.apiId,
        dataType: f.dataType,
      })),
    });
  }

  // 2. Schemas from other pages in the same collection
  if (Array.isArray(collectionPages)) {
    for (const page of collectionPages) {
      if (!page || (currentPageId && page.id === currentPageId)) continue;

      const pData = (page.data as Record<string, unknown>) || page;
      const otherTitle =
        (pData?.title as string) || (page.title as string) || 'Other Page';
      const otherSchemas = extractPageCustomSchemas(pData);

      for (const s of otherSchemas) {
        // Unique ID per page to avoid ID collisions in dropdowns
        const uniqueId = page.id
          ? `${page.id}_${s.id || s.slug}`
          : s.id || s.slug;
        result.push({
          id: uniqueId,
          name: s.name,
          slug: s.slug,
          pageId: page.id,
          pageTitle: otherTitle,
          isCurrentPage: false,
          fields: (s.fields || []).map((f) => ({
            id: f.apiId,
            name: f.displayName || f.name || f.apiId,
            apiId: f.apiId,
            dataType: f.dataType,
          })),
        });
      }
    }
  }

  return result;
}

export function buildCollectionSchemaFields(
  availableSchemas: CanvasAvailableSchema[],
): CanvasSchemaField[] {
  const seen = new Set<string>();
  const fieldsList: CanvasSchemaField[] = [];

  for (const schema of availableSchemas) {
    for (const f of schema.fields || []) {
      if (f?.apiId && !seen.has(f.apiId)) {
        seen.add(f.apiId);
        const originPrefix = schema.isCurrentPage
          ? ''
          : `[${schema.pageTitle || 'Other Page'}] `;
        fieldsList.push({
          id: f.apiId,
          name: `${originPrefix}${schema.name}: ${f.name || f.apiId}`,
          apiId: f.apiId,
          dataType: f.dataType,
        });
      }
    }
  }

  return fieldsList;
}

export function extractCollectionSchemaValues(
  currentPageData: Record<string, unknown> | undefined,
  collectionPages: PageWithSchemasLike[] | undefined,
  currentPageId?: string,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  // 1. Gather sample/fallback values from other pages in the collection first
  if (Array.isArray(collectionPages)) {
    for (const page of collectionPages) {
      if (!page || (currentPageId && page.id === currentPageId)) continue;
      const pData = (page.data as Record<string, unknown>) || page;
      const raw = pData?._schemas;
      if (Array.isArray(raw)) {
        for (const s of raw as Array<{
          slug?: string;
          values?: Record<string, unknown>;
        }>) {
          if (s && s.values && typeof s.values === 'object') {
            const prefix = s.slug ? `${s.slug}.` : '';
            for (const [k, v] of Object.entries(s.values)) {
              if (v !== undefined && v !== null) {
                if (values[k] === undefined) values[k] = v;
                if (prefix && values[`${prefix}${k}`] === undefined) {
                  values[`${prefix}${k}`] = v;
                }
              }
            }
          }
        }
      }
    }
  }

  // 2. Overlay current page's own schema values (current page takes highest priority)
  const currentValues = extractSchemaValues(currentPageData);
  Object.assign(values, currentValues);

  // Also index current page values with slug prefix
  const rawCurrent = currentPageData?._schemas;
  if (Array.isArray(rawCurrent)) {
    for (const s of rawCurrent as Array<{
      slug?: string;
      values?: Record<string, unknown>;
    }>) {
      if (s && s.values && typeof s.values === 'object' && s.slug) {
        for (const [k, v] of Object.entries(s.values)) {
          if (v !== undefined && v !== null) {
            values[`${s.slug}.${k}`] = v;
          }
        }
      }
    }
  }

  return values;
}
