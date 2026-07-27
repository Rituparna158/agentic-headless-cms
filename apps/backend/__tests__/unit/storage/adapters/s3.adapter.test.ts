import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Adapter } from '../../../../src/storage/adapters/s3.adapter.js';
import {
  InvalidStorageConfigError,
  StorageDeleteError,
  StorageNotFoundError,
  StorageReadError,
  StorageWriteError,
} from '../../../../src/storage/errors.js';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(function () {
      return { send: mockSend };
    }),
  };
});

describe('S3Adapter', () => {
  let adapter: S3Adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new S3Adapter({ bucket: 'my-bucket', region: 'us-east-1' });
  });

  it('throws InvalidStorageConfigError for an empty bucket', () => {
    expect(() => new S3Adapter({ bucket: '', region: 'us-east-1' })).toThrow(
      InvalidStorageConfigError,
    );
  });

  it('throws InvalidStorageConfigError for an empty region', () => {
    expect(() => new S3Adapter({ bucket: 'b', region: '' })).toThrow(
      InvalidStorageConfigError,
    );
  });

  it('derives the standard AWS bucket URL when no publicUrlBase/endpoint is given', async () => {
    mockSend.mockResolvedValue({});
    const result = await adapter.write(
      'key.png',
      Buffer.from('x'),
      'image/png',
    );

    expect(result).toEqual({
      url: 'https://my-bucket.s3.us-east-1.amazonaws.com/key.png',
      key: 'key.png',
    });
  });

  it('uses endpoint-based URL for S3-compatible providers', async () => {
    const compat = new S3Adapter({
      bucket: 'my-bucket',
      region: 'us-east-1',
      endpoint: 'http://localhost:9000',
    });
    mockSend.mockResolvedValue({});

    const result = await compat.write('key.png', Buffer.from('x'), 'image/png');
    expect(result.url).toBe('http://localhost:9000/my-bucket/key.png');
  });

  it('prefers an explicit publicUrlBase override', async () => {
    const withCdn = new S3Adapter({
      bucket: 'my-bucket',
      region: 'us-east-1',
      publicUrlBase: 'https://cdn.example.com',
    });
    mockSend.mockResolvedValue({});

    const result = await withCdn.write(
      'key.png',
      Buffer.from('x'),
      'image/png',
    );
    expect(result.url).toBe('https://cdn.example.com/key.png');
  });

  it('wraps a write failure in StorageWriteError', async () => {
    mockSend.mockRejectedValue(new Error('network down'));
    await expect(
      adapter.write('key.png', Buffer.from('x'), 'image/png'),
    ).rejects.toThrow(StorageWriteError);
  });

  it('reads and reassembles the object body into a Buffer', async () => {
    mockSend.mockResolvedValue({
      Body: {
        transformToByteArray: vi
          .fn()
          .mockResolvedValue(new Uint8Array([1, 2, 3])),
      },
    });

    const buffer = await adapter.read('key.png');
    expect(buffer).toEqual(Buffer.from([1, 2, 3]));
  });

  it('maps a NoSuchKey error to StorageNotFoundError', async () => {
    const notFound = new Error('not found');
    notFound.name = 'NoSuchKey';
    mockSend.mockRejectedValue(notFound);

    await expect(adapter.read('missing.png')).rejects.toThrow(
      StorageNotFoundError,
    );
  });

  it('wraps other read failures in StorageReadError', async () => {
    mockSend.mockRejectedValue(new Error('access denied'));
    await expect(adapter.read('key.png')).rejects.toThrow(StorageReadError);
  });

  it('deletes without error on success', async () => {
    mockSend.mockResolvedValue({});
    await expect(adapter.delete('key.png')).resolves.toBeUndefined();
  });

  it('wraps a delete failure in StorageDeleteError', async () => {
    mockSend.mockRejectedValue(new Error('access denied'));
    await expect(adapter.delete('key.png')).rejects.toThrow(StorageDeleteError);
  });

  it('reports providerName as "s3"', () => {
    expect(adapter.providerName).toBe('s3');
  });
});
