import sharp from 'sharp';
import { InvalidResizeError } from './errors.js';
import { ERROR_MESSAGES } from '@repo/constants';

const RESIZE_FIT_VALUES = [
  'cover',
  'contain',
  'fill',
  'inside',
  'outside',
] as const;
export type ResizeFit = (typeof RESIZE_FIT_VALUES)[number];

export const IMAGE_FORMATS = ['webp', 'jpeg', 'jpg', 'png', 'avif'] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit: ResizeFit;
  format?: ImageFormat;
  quality?: number;
}

/**
 * Parses `?w=&h=&fit=&format=&quality=` into validated resize options, or `undefined` if
 * neither `w`, `h`, `format`, nor `quality` was supplied (the common "just give me the original"
 * case, which callers should treat as "skip resizing").
 */
export function parseResizeQuery(
  query: Record<string, unknown>,
): ResizeOptions | undefined {
  const width = parsePositiveIntParam(query.w, 'w');
  const height = parsePositiveIntParam(query.h, 'h');
  const quality = parsePositiveIntParam(query.q ?? query.quality, 'q');

  const formatRaw = query.format ?? query.fm;
  let format: ImageFormat | undefined;
  if (formatRaw !== undefined) {
    if (
      typeof formatRaw !== 'string' ||
      !IMAGE_FORMATS.includes(formatRaw as ImageFormat)
    ) {
      throw new InvalidResizeError(
        `${ERROR_MESSAGES.MEDIA.INVALID_RESIZE_PARAMS}: 'format' must be one of ${IMAGE_FORMATS.join(', ')}.`,
      );
    }
    format = formatRaw as ImageFormat;
  }

  if (
    width === undefined &&
    height === undefined &&
    format === undefined &&
    quality === undefined
  ) {
    return undefined;
  }

  const fitRaw = query.fit;
  if (fitRaw !== undefined && typeof fitRaw !== 'string') {
    throw new InvalidResizeError(
      `${ERROR_MESSAGES.MEDIA.INVALID_RESIZE_PARAMS}: 'fit' must be a string.`,
    );
  }
  const fit = (fitRaw ?? 'cover') as ResizeFit;
  if (!RESIZE_FIT_VALUES.includes(fit)) {
    throw new InvalidResizeError(
      `${ERROR_MESSAGES.MEDIA.INVALID_RESIZE_PARAMS}: 'fit' must be one of ${RESIZE_FIT_VALUES.join(', ')}.`,
    );
  }

  return { width, height, fit, format, quality };
}

function parsePositiveIntParam(
  value: unknown,
  paramName: string,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidResizeError(
      `${ERROR_MESSAGES.MEDIA.INVALID_RESIZE_PARAMS}: '${paramName}' must be a positive integer.`,
    );
  }
  return parsed;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/** Returns null for non-image buffers — sharp throws on unrecognized formats, which isn't an error case here, just "not an image". */
export async function readImageDimensions(
  buffer: Buffer,
): Promise<ImageDimensions | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return null;
    return { width: metadata.width, height: metadata.height };
  } catch {
    return null;
  }
}

/** Resizes and optimizes `buffer` per `options`, supporting webp/avif format conversion. */
export async function resizeImage(
  buffer: Buffer,
  options: ResizeOptions,
): Promise<Buffer> {
  let pipeline = sharp(buffer);

  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.fit,
    });
  }

  if (options.format) {
    const targetFormat = options.format === 'jpg' ? 'jpeg' : options.format;
    pipeline = pipeline.toFormat(targetFormat, {
      quality: options.quality ?? 80,
    });
  } else if (options.quality) {
    pipeline = pipeline.toFormat('webp', {
      quality: options.quality,
    });
  }

  return pipeline.toBuffer();
}
