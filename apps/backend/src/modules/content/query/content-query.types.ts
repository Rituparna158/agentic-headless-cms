export const FILTER_OPERATORS = [
  '$eq',
  '$ne',
  '$lt',
  '$lte',
  '$gt',
  '$gte',
  '$in',
  '$contains',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];
