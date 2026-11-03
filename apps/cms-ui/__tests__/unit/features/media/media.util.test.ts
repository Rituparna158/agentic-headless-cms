import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDate,
  getFileExtension,
  getMimeCategory,
  getMediaFileUrl,
} from '../../../../src/features/media/utils/media.util';

describe('media.util', () => {
  describe('formatBytes', () => {
    it('formats bytes properly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('formatDate', () => {
    it('formats ISO dates without error', () => {
      const formatted = formatDate('2026-10-22T08:00:00Z');
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('getFileExtension', () => {
    it('extracts uppercase file extension', () => {
      expect(getFileExtension('photo.png')).toBe('PNG');
      expect(getFileExtension('document.PDF')).toBe('PDF');
      expect(getFileExtension('archive.tar.gz')).toBe('GZ');
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('getMimeCategory', () => {
    it('classifies MIME types accurately', () => {
      expect(getMimeCategory('image/png')).toBe('image');
      expect(getMimeCategory('image/webp')).toBe('image');
      expect(getMimeCategory('video/mp4')).toBe('video');
      expect(getMimeCategory('audio/mpeg')).toBe('audio');
      expect(getMimeCategory('application/pdf')).toBe('document');
      expect(getMimeCategory('application/octet-stream')).toBe('other');
    });
  });

  describe('getMediaFileUrl', () => {
    it('handles absolute URLs', () => {
      const url = 'https://images.unsplash.com/photo-123';
      expect(getMediaFileUrl(url)).toBe(url);
    });

    it('handles relative storage keys and paths', () => {
      const key = 'image-123.png';
      const resolved = getMediaFileUrl(key);
      expect(resolved).toContain('/api/v1/media/file/image-123.png');
    });
  });
});
