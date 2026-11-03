import { describe, it, expect } from 'vitest';
import {
  isYouTube,
  getYouTubeEmbedUrl,
} from '@/features/collections/utils/video-embed.util';

describe('video-embed.util', () => {
  it('correctly detects YouTube URLs', () => {
    expect(isYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isYouTube('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(isYouTube('https://vimeo.com/12345678')).toBe(false);
  });

  it('converts standard youtube watch url to embed url', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(getYouTubeEmbedUrl(url)).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('converts youtu.be short url to embed url', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    expect(getYouTubeEmbedUrl(url)).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('returns original url if already an embed url', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    expect(getYouTubeEmbedUrl(url)).toBe(url);
  });

  it('handles invalid urls gracefully without throwing', () => {
    expect(getYouTubeEmbedUrl('not-a-valid-url')).toBe('not-a-valid-url');
  });
});
