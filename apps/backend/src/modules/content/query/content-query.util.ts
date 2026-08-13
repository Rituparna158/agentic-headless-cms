import { SQL, and, asc, desc, or, sql } from 'drizzle-orm';
import type { SchemaField } from '@repo/types';
import { contentEntries, entryLocalizations } from '@repo/shared-db';
import { BadRequestError } from '@repo/utils';
import { ContentQueryOptions } from '@repo/types';

const FILTER_OPERATORS = [
  '$eq',
  '$ne',
  '$lt',
  '$lte',
  '$gt',
  '$gte',
  '$in',
  '$contains',
] as const;
type FilterOperator = (typeof FILTER_OPERATORS)[number];

// Orderable data types
const ORDERABLE_DATA_TYPES = new Set(['number', 'date', 'datetime']);
// Text data types
const TEXT_DATA_TYPES = new Set(['text', 'richtext']);

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/** Base columns */
const SORTABLE_BASE_COLUMNS = {
  createdAt: contentEntries.createdAt,
  updatedAt: contentEntries.updatedAt,
  status: entryLocalizations.status,
} as const;

function findField(fields: SchemaField[], apiId: string): SchemaField {
  const field = fields.find((f) => f.apiId === apiId);
  if (!field) {
    throw new BadRequestError(`Unknown field '${apiId}' for this schema.`);
  }
  return field;
}

/** Build JSONB field expression */
function jsonFieldExpr(field: SchemaField): SQL {
  const raw = sql`(${entryLocalizations.data} ->> ${field.apiId})`;
  switch (field.dataType) {
    case 'number':
      return sql`(${raw})::numeric`;
    case 'date':
    case 'datetime':
      return sql`(${raw})::timestamptz`;
    case 'boolean':
      return sql`(${raw})::boolean`;
    default:
      return raw;
  }
}

function buildComparison(
  field: SchemaField,
  operator: FilterOperator,
  rawValue: string,
): SQL {
  if (
    (operator === '$lt' ||
      operator === '$lte' ||
      operator === '$gt' ||
      operator === '$gte') &&
    !ORDERABLE_DATA_TYPES.has(field.dataType)
  ) {
    throw new BadRequestError(
      `Operator '${operator}' is not supported for field '${field.apiId}' (dataType: ${field.dataType}).`,
    );
  }
  if (operator === '$contains' && !TEXT_DATA_TYPES.has(field.dataType)) {
    throw new BadRequestError(
      `Operator '$contains' is not supported for field '${field.apiId}' (dataType: ${field.dataType}).`,
    );
  }

  const expr = jsonFieldExpr(field);

  switch (operator) {
    case '$eq':
      return sql`${expr} = ${rawValue}`;
    case '$ne':
      return sql`${expr} != ${rawValue}`;
    case '$lt':
      return sql`${expr} < ${rawValue}`;
    case '$lte':
      return sql`${expr} <= ${rawValue}`;
    case '$gt':
      return sql`${expr} > ${rawValue}`;
    case '$gte':
      return sql`${expr} >= ${rawValue}`;
    case '$contains':
      return sql`${expr} ILIKE ${'%' + rawValue.replace(/[%_]/g, '\\$&') + '%'}`;
    case '$in': {
      const values = rawValue
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length === 0) {
        throw new BadRequestError(
          `Operator '$in' for field '${field.apiId}' requires at least one value.`,
        );
      }
      const comparisons = values.map((v) => sql`${expr} = ${v}`);
      return or(...comparisons)!;
    }
  }
}

/** Parse filters */
function parseFilters(
  filters: unknown,
  fields: SchemaField[],
): SQL | undefined {
  if (!filters || typeof filters !== 'object') return undefined;

  const clauses: SQL[] = [];
  for (const [apiId, opsRaw] of Object.entries(
    filters as Record<string, unknown>,
  )) {
    if (!opsRaw || typeof opsRaw !== 'object') {
      throw new BadRequestError(
        `Filter for '${apiId}' must specify an operator, e.g. filters[${apiId}][$eq]=value.`,
      );
    }
    const field = findField(fields, apiId);

    for (const [op, value] of Object.entries(
      opsRaw as Record<string, unknown>,
    )) {
      if (!FILTER_OPERATORS.includes(op as FilterOperator)) {
        throw new BadRequestError(
          `Unsupported filter operator '${op}'. Supported: ${FILTER_OPERATORS.join(', ')}.`,
        );
      }
      if (typeof value !== 'string') {
        throw new BadRequestError(
          `Filter value for '${apiId}${op}' must be a string.`,
        );
      }
      clauses.push(buildComparison(field, op as FilterOperator, value));
    }
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

/** Parse sort options */
function parseSort(
  sortParam: unknown,
  fields: SchemaField[],
  search?: string,
): SQL[] {
  if (!sortParam) {
    if (search) {
      return [
        desc(
          sql`ts_rank(jsonb_to_tsvector('english', ${entryLocalizations.data}, '["string"]'), plainto_tsquery('english', ${search}))`,
        ),
      ];
    }
    return [];
  }

  let raw: string;
  if (Array.isArray(sortParam)) {
    raw = sortParam.join(',');
  } else if (typeof sortParam === 'string') {
    raw = sortParam;
  } else {
    throw new BadRequestError("'sort' must be a string.");
  }

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [apiId, directionRaw] = entry.split(':');
      const direction = (directionRaw ?? 'asc').toLowerCase();
      if (direction !== 'asc' && direction !== 'desc') {
        throw new BadRequestError(
          `Invalid sort direction '${directionRaw}' for '${apiId}'. Use 'asc' or 'desc'.`,
        );
      }

      const baseColumn =
        apiId && apiId in SORTABLE_BASE_COLUMNS
          ? SORTABLE_BASE_COLUMNS[apiId as keyof typeof SORTABLE_BASE_COLUMNS]
          : undefined;
      const expr = baseColumn ?? jsonFieldExpr(findField(fields, apiId!));

      return direction === 'desc' ? desc(expr) : asc(expr);
    });
}

function parsePagination(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
} {
  const page = parsePositiveInt(query.page, 1, 'page');
  const pageSize = Math.min(
    parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'),
    MAX_PAGE_SIZE,
  );

  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

function parsePositiveInt(
  value: unknown,
  fallback: number,
  paramName: string,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestError(`'${paramName}' must be a positive integer.`);
  }
  return parsed;
}

export function parseContentQuery(
  query: Record<string, unknown>,
  fields: SchemaField[],
): ContentQueryOptions {
  const search = typeof query.search === 'string' ? query.search : undefined;

  let where = parseFilters(query.filters, fields);
  if (search) {
    const searchSql = sql`jsonb_to_tsvector('english', ${entryLocalizations.data}, '["string"]') @@ plainto_tsquery('english', ${search})`;
    where = where ? and(where, searchSql) : searchSql;
  }

  const orderBy = parseSort(query.sort, fields, search);
  const { page, pageSize, limit, offset } = parsePagination(query);

  return { where, orderBy, limit, offset, search, page, pageSize };
}
