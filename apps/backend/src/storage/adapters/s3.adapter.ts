import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { StoragePort, StorageWriteResult } from '../storage.port.js';
import {
  InvalidStorageConfigError,
  StorageDeleteError,
  StorageNotFoundError,
  StorageReadError,
  StorageWriteError,
} from '../errors.js';

export interface S3AdapterOptions {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** For S3-compatible providers (MinIO, R2, localstack) — omit for real AWS S3. */
  endpoint?: string;
  /** Required by most S3-compatible providers; real AWS S3 uses virtual-hosted-style by default. */
  forcePathStyle?: boolean;
  /** Overrides the derived bucket URL — set this when serving through a CDN/custom domain. */
  publicUrlBase?: string;
}

export class S3Adapter implements StoragePort {
  readonly providerName = 's3';
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(options: S3AdapterOptions) {
    if (!options.bucket || options.bucket.trim().length === 0) {
      throw new InvalidStorageConfigError(
        'STORAGE_S3_BUCKET is empty or not set.',
      );
    }
    if (!options.region || options.region.trim().length === 0) {
      throw new InvalidStorageConfigError(
        'STORAGE_S3_REGION is empty or not set.',
      );
    }

    this.bucket = options.bucket;
    this.publicUrlBase = (
      options.publicUrlBase ??
      (options.endpoint
        ? `${options.endpoint.replace(/\/+$/, '')}/${options.bucket}`
        : `https://${options.bucket}.s3.${options.region}.amazonaws.com`)
    ).replace(/\/+$/, '');

    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      // Omitting credentials entirely (rather than passing undefined values)
      // lets the SDK fall through to its default provider chain (env vars,
      // shared config file, instance/task role) — the standard, more
      // secure path for anything running inside AWS.
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            }
          : undefined,
    });
  }

  async write(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<StorageWriteResult> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
    } catch (error) {
      throw new StorageWriteError(
        `Failed to write "${key}" to S3 bucket "${this.bucket}".`,
        {
          cause: error,
        },
      );
    }

    return { url: `${this.publicUrlBase}/${key}`, key };
  }

  async read(key: string): Promise<Buffer> {
    let response;
    try {
      response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      if (isNoSuchKeyError(error)) {
        throw new StorageNotFoundError(
          `"${key}" was not found in bucket "${this.bucket}".`,
          {
            cause: error,
          },
        );
      }
      throw new StorageReadError(
        `Failed to read "${key}" from S3 bucket "${this.bucket}".`,
        {
          cause: error,
        },
      );
    }

    if (!response.Body) {
      throw new StorageReadError(`S3 returned an empty body for "${key}".`);
    }

    // AWS SDK v3's Body is a web/Node-stream mix depending on runtime;
    // transformToByteArray() is the SDK's own helper for consuming it fully
    // regardless of which underlying stream type Node handed back.
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    // Unlike LocalAdapter's unlink(), S3's DeleteObject is idempotent and
    // does not error on a missing key — there's no StorageNotFoundError
    // case to surface here; callers shouldn't rely on delete() to confirm
    // prior existence.
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      throw new StorageDeleteError(
        `Failed to delete "${key}" from S3 bucket "${this.bucket}".`,
        {
          cause: error,
        },
      );
    }
  }
}

function isNoSuchKeyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'NoSuchKey' || error.name === 'NotFound')
  );
}
