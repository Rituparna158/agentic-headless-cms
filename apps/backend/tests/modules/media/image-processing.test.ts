import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  parseResizeQuery,
  readImageDimensions,
  resizeImage,
} from '../../../src/modules/media/image-processing.js';

async function makeTestPng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
}

describe('parseResizeQuery', () => {
  it('returns undefined when neither w nor h is provided', () => {
    expect(parseResizeQuery({})).toBeUndefined();
  });

  it('parses w/h with the default fit', () => {
    expect(parseResizeQuery({ w: '100', h: '200' })).toEqual({
      width: 100,
      height: 200,
      fit: 'cover',
    });
  });

  it('accepts a valid explicit fit', () => {
    expect(parseResizeQuery({ w: '100', fit: 'contain' })).toEqual({
      width: 100,
      height: undefined,
      fit: 'contain',
    });
  });

  it('rejects a non-integer w', () => {
    expect(() => parseResizeQuery({ w: 'abc' })).toThrow(/positive integer/);
  });

  it('rejects a zero or negative w', () => {
    expect(() => parseResizeQuery({ w: '0' })).toThrow(/positive integer/);
  });

  it('rejects an invalid fit value', () => {
    expect(() => parseResizeQuery({ w: '100', fit: 'squeeze' })).toThrow(
      /must be one of/,
    );
  });
});

describe('readImageDimensions', () => {
  it('reads width/height from a real image buffer', async () => {
    const buffer = await makeTestPng(64, 32);
    const dimensions = await readImageDimensions(buffer);
    expect(dimensions).toEqual({ width: 64, height: 32 });
  });

  it('returns null for a non-image buffer', async () => {
    const dimensions = await readImageDimensions(Buffer.from('not an image'));
    expect(dimensions).toBeNull();
  });
});

describe('resizeImage', () => {
  it('resizes a buffer to the requested dimensions', async () => {
    const original = await makeTestPng(200, 100);
    const resized = await resizeImage(original, {
      width: 50,
      height: 50,
      fit: 'fill',
    });

    const dimensions = await readImageDimensions(resized);
    expect(dimensions).toEqual({ width: 50, height: 50 });
  });
});
