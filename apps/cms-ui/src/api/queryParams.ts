export interface TableQueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
}

export function buildQueryString(options: TableQueryParams): string {
  const params = new URLSearchParams();
  if (options.page && options.page > 1) {
    params.append('page', String(options.page));
  }
  if (options.pageSize) {
    params.append('pageSize', String(options.pageSize));
  }
  if (options.sort) {
    params.append('sort', options.sort);
  }
  if (options.search) {
    params.append('search', options.search);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
