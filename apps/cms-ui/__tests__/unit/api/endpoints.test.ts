import { describe, it, expect } from 'vitest';
import { ENDPOINTS } from '@/api/endpoints';

describe('ENDPOINTS', () => {
  it('defines static auth endpoints', () => {
    expect(ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    expect(ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
    expect(ENDPOINTS.AUTH.ME).toBe('/auth/me');
  });

  it('generates dynamic schema endpoints', () => {
    expect(ENDPOINTS.SCHEMAS.BASE).toBe('/schemas');
    expect(ENDPOINTS.SCHEMAS.BY_SLUG('blog-posts')).toBe(
      '/schemas/slug/blog-posts',
    );
  });

  it('generates dynamic content endpoints', () => {
    expect(ENDPOINTS.CONTENT.BASE).toBe('/content');
    expect(ENDPOINTS.CONTENT.BY_SCHEMA('articles')).toBe('/content/articles');
    expect(ENDPOINTS.CONTENT.ENTRY('articles', 'art-123')).toBe(
      '/content/articles/art-123',
    );
    expect(ENDPOINTS.CONTENT.VERSIONS('articles', 'art-123')).toBe(
      '/content/articles/art-123/versions',
    );
    expect(ENDPOINTS.CONTENT.REVERT('articles', 'art-123')).toBe(
      '/content/articles/art-123/revert',
    );
  });

  it('generates audit log endpoints', () => {
    expect(ENDPOINTS.AUDIT_LOGS.BASE).toBe('/audit-logs');
    expect(ENDPOINTS.AUDIT_LOGS.BY_ID('log-456')).toBe('/audit-logs/log-456');
  });

  it('generates media endpoints', () => {
    expect(ENDPOINTS.MEDIA.BASE).toBe('/media');
    expect(ENDPOINTS.MEDIA.BY_ID('asset-123')).toBe('/media/asset-123');
    expect(ENDPOINTS.MEDIA.FILE('banner.png')).toBe('/media/file/banner.png');
    expect(ENDPOINTS.MEDIA.BULK_DELETE).toBe('/media/bulk-delete');
  });

  it('generates media folder endpoints', () => {
    expect(ENDPOINTS.MEDIA_FOLDERS.BASE).toBe('/media-folders');
    expect(ENDPOINTS.MEDIA_FOLDERS.BY_ID('folder-1')).toBe(
      '/media-folders/folder-1',
    );
  });
});
