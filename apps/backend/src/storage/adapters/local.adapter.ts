import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StoragePort, StorageWriteResult } from '../storage.port.js';
import {
  InvalidStorageConfigError,
  StorageDeleteError,
  StorageNotFoundError,
  StorageReadError,
  StorageWriteError,
} from '../errors.js';

export interface LocalAdapterOptions {
  /** Directory files are written to — created on first write if it doesn't exist. */
  uploadDir: string;
  /** URL prefix media URLs are built from, e.g. '/media/file' -> '/media/file/<key>'. */
  publicUrlBase: string;
}

/**
 * Resolves `key` against `uploadDir` and rejects anything that would escape
 * it — `key` ultimately comes from a generated filename (safe by
 * construction) but is also the input to read()/delete(), which a caller
 * could in principle pass an attacker-controlled value to, so this is
 * checked defensively rather than trusted.
 */
function resolveSafePath(uploadDir: string, key: string): string {
  const resolved = path.resolve(uploadDir, key);
  const normalizedDir = path.resolve(uploadDir) + path.sep;
  if (!resolved.startsWith(normalizedDir)) {
    throw new StorageWriteError(
      `Invalid storage key: "${key}" escapes the upload directory.`,
    );
  }
  return resolved;
}

export class LocalAdapter implements StoragePort {
  readonly providerName = 'local';
  private readonly uploadDir: string;
  private readonly publicUrlBase: string;
  private dirEnsured = false;

  constructor(options: LocalAdapterOptions) {
    if (!options.uploadDir || options.uploadDir.trim().length === 0) {
      throw new InvalidStorageConfigError(
        'STORAGE_LOCAL_UPLOAD_DIR is empty or not set.',
      );
    }
    if (!options.publicUrlBase || options.publicUrlBase.trim().length === 0) {
      throw new InvalidStorageConfigError(
        'STORAGE_LOCAL_BASE_URL is empty or not set.',
      );
    }

    this.uploadDir = path.resolve(options.uploadDir);
    this.publicUrlBase = options.publicUrlBase.replace(/\/+$/, '');
  }

  private async ensureDir(): Promise<void> {
    if (this.dirEnsured) return;
    await mkdir(this.uploadDir, { recursive: true });
    this.dirEnsured = true;
  }

  // contentType is unused here — local storage doesn't need it for the
  // filesystem write; the serving route (media.controller.ts) sets
  // Content-Type from the DB row's mimeType, not from disk. Kept as a
  // parameter to satisfy StoragePort's shared signature with S3Adapter,
  // which does need it for the PutObject call.
  async write(
    key: string,
    buffer: Buffer,
    _contentType: string,
  ): Promise<StorageWriteResult> {
    await this.ensureDir();
    const filePath = resolveSafePath(this.uploadDir, key);

    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      throw new StorageWriteError(
        `Failed to write "${key}" to local storage.`,
        { cause: error },
      );
    }

    return { url: `${this.publicUrlBase}/${key}`, key };
  }

  async read(key: string): Promise<Buffer> {
    const filePath = resolveSafePath(this.uploadDir, key);

    try {
      return await readFile(filePath);
    } catch (error) {
      if (isNodeErrnoException(error) && error.code === 'ENOENT') {
        throw new StorageNotFoundError(
          `"${key}" was not found in local storage.`,
          { cause: error },
        );
      }
      throw new StorageReadError(
        `Failed to read "${key}" from local storage.`,
        { cause: error },
      );
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = resolveSafePath(this.uploadDir, key);

    try {
      await unlink(filePath);
    } catch (error) {
      if (isNodeErrnoException(error) && error.code === 'ENOENT') {
        throw new StorageNotFoundError(
          `"${key}" was not found in local storage.`,
          { cause: error },
        );
      }
      throw new StorageDeleteError(
        `Failed to delete "${key}" from local storage.`,
        { cause: error },
      );
    }
  }
}

function isNodeErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
