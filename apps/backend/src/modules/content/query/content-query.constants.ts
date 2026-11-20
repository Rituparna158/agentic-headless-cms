import { contentEntries, entryLocalizations } from '@repo/shared-db';
import {
  FILTER_OPERATORS,
  type FilterOperator,
} from './content-query.types.js';

export { FILTER_OPERATORS };

// Orderable data types
export const ORDERABLE_DATA_TYPES = new Set(['number', 'date', 'datetime']);
// Text data types
export const TEXT_DATA_TYPES = new Set(['text', 'richtext']);

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/** Base columns */
export const SORTABLE_BASE_COLUMNS = {
  createdAt: contentEntries.createdAt,
  updatedAt: contentEntries.updatedAt,
  status: entryLocalizations.status,
} as const;

export const FILTERABLE_BASE_COLUMNS = {
  status: {
    column: entryLocalizations.status,
    allowedOps: new Set<FilterOperator>(['$eq', '$ne', '$in']),
  },
  createdAt: {
    column: contentEntries.createdAt,
    allowedOps: new Set<FilterOperator>([
      '$eq',
      '$ne',
      '$lt',
      '$lte',
      '$gt',
      '$gte',
    ]),
  },
  updatedAt: {
    column: contentEntries.updatedAt,
    allowedOps: new Set<FilterOperator>([
      '$eq',
      '$ne',
      '$lt',
      '$lte',
      '$gt',
      '$gte',
    ]),
  },
} as const;
