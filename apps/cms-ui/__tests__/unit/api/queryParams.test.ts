import { describe, it, expect } from 'vitest';
import { buildQueryString } from '@/api/queryParams';

describe('buildQueryString', () => {
  it('returns empty string when no options provided', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('omits page if page is 1', () => {
    expect(buildQueryString({ page: 1 })).toBe('');
  });

  it('appends page when page > 1', () => {
    expect(buildQueryString({ page: 3 })).toBe('?page=3');
  });

  it('appends pageSize, sort, and search query parameters', () => {
    const qs = buildQueryString({
      page: 2,
      pageSize: 25,
      sort: 'createdAt:desc',
      search: 'react tutorials',
    });
    expect(qs).toContain('page=2');
    expect(qs).toContain('pageSize=25');
    expect(qs).toContain('sort=createdAt%3Adesc');
    expect(qs).toContain('search=react+tutorials');
  });
});
