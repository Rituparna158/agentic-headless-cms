export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Returns an optimized image URL with proper dimension, format, and compression parameters.
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  options: ImageOptimizationOptions = {},
): string {
  if (!src) return '';

  // Data URLs, SVGs, or blob URLs are left intact
  if (
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.endsWith('.svg') ||
    src.includes('.svg?')
  ) {
    return src;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover',
  } = options;

  try {
    // 1. Backend CMS media endpoint: /api/v1/media/file/:key
    if (src.includes('/media/file/')) {
      const url = new URL(
        src,
        typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost',
      );
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      if (fit) url.searchParams.set('fit', fit);
      if (format) url.searchParams.set('format', format);
      if (quality) url.searchParams.set('q', quality.toString());

      return src.startsWith('http')
        ? url.toString()
        : `${url.pathname}${url.search}`;
    }

    // 2. Unsplash demo/placeholder images
    if (src.includes('images.unsplash.com')) {
      const url = new URL(src);
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', quality.toString());
      return url.toString();
    }
  } catch {
    // Fall back to original src if URL parsing fails
    return src;
  }

  return src;
}

/**
 * Generates a responsive srcset string for specified widths.
 */
export function getResponsiveSrcSet(
  src: string | undefined | null,
  widths: number[] = [320, 640, 960, 1200],
  options: Omit<ImageOptimizationOptions, 'width'> = {},
): string {
  if (
    !src ||
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.endsWith('.svg')
  ) {
    return '';
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(src, { ...options, width: w })} ${w}w`)
    .join(', ');
}
