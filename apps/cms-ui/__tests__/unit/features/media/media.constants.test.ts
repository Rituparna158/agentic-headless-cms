import { describe, it, expect } from 'vitest';
import { MEDIA_QUERY_KEYS } from '@/features/media/constants/media.constants';

describe('MEDIA_QUERY_KEYS', () => {
  it('generates query keys properly', () => {
    expect(MEDIA_QUERY_KEYS.all).toEqual(['media']);
    expect(
      MEDIA_QUERY_KEYS.infinite({ folderId: 'f-1', search: 'hero' }),
    ).toEqual(['media', 'infinite', { folderId: 'f-1', search: 'hero' }]);
    expect(MEDIA_QUERY_KEYS.folders('f-root')).toEqual([
      'media-folders',
      { parentFolderId: 'f-root' },
    ]);
  });
});
