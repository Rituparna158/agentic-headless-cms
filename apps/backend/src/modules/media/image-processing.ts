import sharp from 'sharp';
import { BadRequestError } from '../../common/errors/http-error.js';
import { ERROR_MESSAGES } from '@repo/shared-types';

const RESIZE_FIT_VALUES = [
  'cover',
  'contain',
  'fill',
  'inside',
  'outside',
] as const;
export type ResizeFit = (typeof RESIZE_FIT_VALUES)[number];

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit: ResizeFit;
}

/**
 * Parses `?w=&h=&fit=` into validated resize options, or `undefined` if
 * neither `w` nor `h` was supplied (the common "just give me the original"
 * case, which callers should treat as "skip resizing").
 */
export function parseResizeQuery(
  query: Record<string, unknown>,
): ResizeOptions | undefined {
  const width = parsePositiveIntParam(query.w, 'w');
  const height = parsePositiveIntParam(query.h, 'h');

  if (width === undefined && height === undefined) {
    return undefined;
  }

  const fitRaw = query.fit;
  if (fitRaw !== undefined && typeof fitRaw !== 'string') {
    throw new BadRequestError(
      `${ERROR_MESSAGES.MEDIA.INVALID_RESIZE_PARAMS}: 'fit' must be a string.`,
    );
  }
  const fit = fitRaw ?? 'cover';
  if (!RESIZE_FIT_VALUES.includes(fit as ResizeFit)) {
    throw new BadRequestError(
      `${ERROR_MESSAGES.MEDIA.INVALID_RESIZE_PARAMS}: 'fit' must be one of ${RESIZE_FIT_VALUES.join(', ')}.`,
    );
  }

  return { width, height, fit: fit as ResizeFit };
}

function parsePositiveIntParam(
  value: unknown,
  paramName: string,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(
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

/** Resizes `buffer` per `options`, preserving the source format. */
export async function resizeImage(
  buffer: Buffer,
  options: ResizeOptions,
): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: options.width, height: options.height, fit: options.fit })
    .toBuffer();
}
