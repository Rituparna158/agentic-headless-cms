import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStorageAdapter,
  resetStorageAdapterForTest,
} from '../../src/config/storage.js';
import { LocalAdapter } from '../../src/storage/adapters/local.adapter.js';
import { S3Adapter } from '../../src/storage/adapters/s3.adapter.js';
import { env } from '../../src/config/env.js';

vi.mock('../../src/storage/adapters/local.adapter.js', () => ({
  LocalAdapter: vi.fn(),
}));
vi.mock('../../src/storage/adapters/s3.adapter.js', () => ({
  S3Adapter: vi.fn(),
}));

vi.mock('../../src/config/env.js', () => ({
  env: {
    STORAGE_ADAPTER: 'local',
    STORAGE_LOCAL_UPLOAD_DIR: './uploads',
    STORAGE_LOCAL_BASE_URL: '/media/file',
    STORAGE_S3_BUCKET: undefined,
    STORAGE_S3_REGION: undefined,
    STORAGE_S3_ACCESS_KEY_ID: undefined,
    STORAGE_S3_SECRET_ACCESS_KEY: undefined,
    STORAGE_S3_ENDPOINT: undefined,
    STORAGE_S3_FORCE_PATH_STYLE: false,
    STORAGE_S3_PUBLIC_URL_BASE: undefined,
  },
}));

describe('Storage Configuration DI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStorageAdapterForTest();
    env.STORAGE_ADAPTER = 'local';
  });

  it('returns a LocalAdapter when STORAGE_ADAPTER is local', () => {
    const adapter = getStorageAdapter();

    expect(adapter).toBeDefined();
    expect(LocalAdapter).toHaveBeenCalledWith({
      uploadDir: './uploads',
      publicUrlBase: '/media/file',
    });
  });

  it('returns an S3Adapter when STORAGE_ADAPTER is s3', () => {
    env.STORAGE_ADAPTER = 's3';
    env.STORAGE_S3_BUCKET = 'my-bucket';
    env.STORAGE_S3_REGION = 'us-east-1';

    const adapter = getStorageAdapter();

    expect(adapter).toBeDefined();
    expect(S3Adapter).toHaveBeenCalledWith({
      bucket: 'my-bucket',
      region: 'us-east-1',
      accessKeyId: undefined,
      secretAccessKey: undefined,
      endpoint: undefined,
      forcePathStyle: false,
      publicUrlBase: undefined,
    });
  });

  it('caches the adapter instance across calls', () => {
    const first = getStorageAdapter();
    const second = getStorageAdapter();

    expect(first).toBe(second);
    expect(LocalAdapter).toHaveBeenCalledTimes(1);
  });

  it('throws for an unsupported STORAGE_ADAPTER value', () => {
    // @ts-expect-error — deliberately invalid to exercise the fallback branch
    env.STORAGE_ADAPTER = 'ftp';
    expect(() => getStorageAdapter()).toThrow(/Unsupported STORAGE_ADAPTER/);
  });
});
