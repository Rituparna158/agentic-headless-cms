import React, { useState } from 'react';
import { getOptimizedImageUrl, getResponsiveSrcSet } from '@/utils/imageUrl';

import type { OptimizedImageProps } from './types';

export type { OptimizedImageProps };

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  format = 'webp',
  fit = 'cover',
  priority = false,
  responsiveWidths = [320, 640, 960, 1200],
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fallbackSrc,
  className = '',
  style,
  onLoad,
  onError,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const targetWidth = typeof width === 'number' ? width : undefined;
  const targetHeight = typeof height === 'number' ? height : undefined;

  const optimizedSrc = getOptimizedImageUrl(src, {
    width: targetWidth,
    height: targetHeight,
    quality,
    format,
    fit,
  });

  const srcSet = getResponsiveSrcSet(src, responsiveWidths, {
    quality,
    format,
    fit,
  });

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : optimizedSrc;

  return (
    <img
      src={displaySrc}
      srcSet={!hasError && srcSet ? srcSet : undefined}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={(e) => {
        setIsLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        ...style,
      }}
      {...rest}
    />
  );
};
