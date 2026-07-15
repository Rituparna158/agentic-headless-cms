import type { StoragePort } from '../storage/storage.port.js';
import { LocalAdapter } from '../storage/adapters/local.adapter.js';
import { S3Adapter } from '../storage/adapters/s3.adapter.js';
import { env } from './env.js';

let adapterInstance: StoragePort | null = null;

export function getStorageAdapter(): StoragePort {
  if (adapterInstance) {
    return adapterInstance;
  }

  if (env.STORAGE_ADAPTER === 'local') {
    adapterInstance = new LocalAdapter({
      uploadDir: env.STORAGE_LOCAL_UPLOAD_DIR,
      publicUrlBase: env.STORAGE_LOCAL_BASE_URL,
    });
    return adapterInstance;
  }

  if (env.STORAGE_ADAPTER === 's3') {
    // env.ts's superRefine already guarantees these are set when
    // STORAGE_ADAPTER === 's3' — non-null assertions here are asserting
    // that invariant, not bypassing validation.
    adapterInstance = new S3Adapter({
      bucket: env.STORAGE_S3_BUCKET!,
      region: env.STORAGE_S3_REGION!,
      accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
      endpoint: env.STORAGE_S3_ENDPOINT,
      forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
      publicUrlBase: env.STORAGE_S3_PUBLIC_URL_BASE,
    });
    return adapterInstance;
  }

  throw new Error(
    `Unsupported STORAGE_ADAPTER: ${env.STORAGE_ADAPTER as string}`,
  );
}

export function resetStorageAdapterForTest(): void {
  adapterInstance = null;
}
