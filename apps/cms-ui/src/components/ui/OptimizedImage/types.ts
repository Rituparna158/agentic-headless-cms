import type React from 'react';

export interface OptimizedImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'width' | 'height'
> {
  width?: number | string;
  height?: number | string;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  src: string;
  alt: string;
  priority?: boolean;
  responsiveWidths?: number[];
  sizes?: string;
  fallbackSrc?: string;
}
