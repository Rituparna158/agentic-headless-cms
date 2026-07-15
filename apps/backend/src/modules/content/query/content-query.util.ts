import { SQL, and, asc, desc, or, sql } from 'drizzle-orm';
import type { SchemaField } from '@repo/shared-types';
import { contentEntries, entryLocalizations } from '@repo/shared-db';
import { BadRequestError } from '../../../common/errors/http-error.js';
import { ContentQueryOptions } from '../../../types/content.types.js';

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

// Comparison operators only make sense against types with a real ordering —
// applying $lt/$gt to, say, a UUID relation field would silently do a
// lexicographic string compare, which looks plausible but is meaningless.
const ORDERABLE_DATA_TYPES = new Set(['number', 'date', 'datetime']);
// $contains is a substring match — only sensible against free text.
const TEXT_DATA_TYPES = new Set(['text', 'richtext']);

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/** Sortable columns that live on `content_entries` directly, not in JSONB `data`. */
const SORTABLE_BASE_COLUMNS = {
  createdAt: contentEntries.createdAt,
  updatedAt: contentEntries.updatedAt,
} as const;

function findField(fields: SchemaField[], apiId: string): SchemaField {
  const field = fields.find((f) => f.apiId === apiId);
  if (!field) {
    throw new BadRequestError(`Unknown field '${apiId}' for this schema.`);
  }
  return field;
}

/**
 * Builds the SQL expression that reads a JSONB field out of
 * entry_localizations.data, cast to the type appropriate for comparison.
 * `->>'key'` always yields text; casting is what lets `$gt`/`$lt` compare
 * numbers and dates numerically/chronologically instead of lexicographically.
 */
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

/**
 * `req.query.filters` (with the 'extended' query parser) is a nested object
 * like `{ title: { $eq: 'Hello' }, views: { $gte: '10' } }`. Values arrive
 * as strings regardless of the field's real type — casting happens in SQL
 * (see jsonFieldExpr), not here.
 */
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

/**
 * `?sort=title:asc,createdAt:desc` — comma-separated `field:direction` pairs.
 * Direction defaults to `asc` when omitted. `createdAt`/`updatedAt` sort on
 * the real column; anything else is assumed to be a schema field and sorts
 * on the cast JSONB expression (so numeric/date fields sort correctly, not
 * lexicographically).
 */
function parseSort(sortParam: unknown, fields: SchemaField[]): SQL[] {
  if (!sortParam) return [];

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
  const where = parseFilters(query.filters, fields);
  const orderBy = parseSort(query.sort, fields);
  const { page, pageSize, limit, offset } = parsePagination(query);

  return { where, orderBy, limit, offset, page, pageSize };
}
