import { describe, it, expect } from 'vitest';
import {
  getOptimizedImageUrl,
  getResponsiveSrcSet,
} from '../../../src/utils/imageUrl';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '../../../src/components/ui/OptimizedImage/OptimizedImage';

describe('imageUrl utility', () => {
  it('returns empty string for null or empty input', () => {
    expect(getOptimizedImageUrl('')).toBe('');
    expect(getOptimizedImageUrl(undefined)).toBe('');
  });

  it('preserves data: and svg URLs without alteration', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
    expect(getOptimizedImageUrl(dataUrl, { width: 400 })).toBe(dataUrl);

    const svgUrl = '/assets/icons/logo.svg';
    expect(getOptimizedImageUrl(svgUrl, { width: 400 })).toBe(svgUrl);
  });

  it('optimizes CMS media URLs with width, format and quality params', () => {
    const mediaUrl = '/api/v1/media/file/banner-123.png';
    const optimized = getOptimizedImageUrl(mediaUrl, {
      width: 800,
      height: 400,
      format: 'webp',
      quality: 85,
    });

    expect(optimized).toContain('/api/v1/media/file/banner-123.png');
    expect(optimized).toContain('w=800');
    expect(optimized).toContain('h=400');
    expect(optimized).toContain('format=webp');
    expect(optimized).toContain('q=85');
  });

  it('optimizes Unsplash image URLs with auto=format and dimensions', () => {
    const unsplashUrl =
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
    const optimized = getOptimizedImageUrl(unsplashUrl, {
      width: 1200,
      quality: 80,
    });

    expect(optimized).toContain('images.unsplash.com');
    expect(optimized).toContain('w=1200');
    expect(optimized).toContain('auto=format');
    expect(optimized).toContain('fit=crop');
  });

  it('generates responsive srcSet entries correctly', () => {
    const mediaUrl = '/api/v1/media/file/cover.jpg';
    const srcSet = getResponsiveSrcSet(mediaUrl, [320, 640]);
    expect(srcSet).toContain('w=320');
    expect(srcSet).toContain(' 320w');
    expect(srcSet).toContain('w=640');
    expect(srcSet).toContain(' 640w');
  });

  it('returns empty string from getResponsiveSrcSet for data:, blob:, or .svg URLs', () => {
    expect(getResponsiveSrcSet('')).toBe('');
    expect(getResponsiveSrcSet('data:image/png;base64,...')).toBe('');
    expect(getResponsiveSrcSet('blob:http://localhost/123')).toBe('');
    expect(getResponsiveSrcSet('/icon.svg')).toBe('');
  });

  it('falls back to original src when URL is malformed or unhandled external domain', () => {
    expect(
      getOptimizedImageUrl('https://external-unknown-site.org/photo.png'),
    ).toBe('https://external-unknown-site.org/photo.png');
  });
});

describe('OptimizedImage Component', () => {
  it('renders an img element with lazy loading and decoding async by default', () => {
    render(
      <OptimizedImage
        src="/api/v1/media/file/sample.png"
        alt="Sample alt text"
        width={400}
        height={300}
      />,
    );

    const img = screen.getByAltText('Sample alt text') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('src')).toContain('w=400');
    expect(img.getAttribute('src')).toContain('format=webp');
  });

  it('respects priority prop to set eager loading', () => {
    render(
      <OptimizedImage
        src="/api/v1/media/file/hero.png"
        alt="Hero image"
        priority={true}
      />,
    );

    const img = screen.getByAltText('Hero image') as HTMLImageElement;
    expect(img.getAttribute('loading')).toBe('eager');
  });
});
