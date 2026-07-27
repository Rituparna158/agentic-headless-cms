import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { LocalAdapter } from '../../../../src/storage/adapters/local.adapter.js';
import {
  StorageNotFoundError,
  StorageWriteError,
} from '../../../../src/storage/errors.js';

describe('LocalAdapter', () => {
  let tmpDir: string;
  let adapter: LocalAdapter;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'local-adapter-test-'));
    adapter = new LocalAdapter({
      uploadDir: tmpDir,
      publicUrlBase: '/media/file',
    });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('throws InvalidStorageConfigError for an empty uploadDir', () => {
    expect(
      () => new LocalAdapter({ uploadDir: '', publicUrlBase: '/x' }),
    ).toThrow(/STORAGE_LOCAL_UPLOAD_DIR/);
  });

  it('throws InvalidStorageConfigError for an empty publicUrlBase', () => {
    expect(
      () => new LocalAdapter({ uploadDir: tmpDir, publicUrlBase: '' }),
    ).toThrow(/STORAGE_LOCAL_BASE_URL/);
  });

  it('writes a file and returns its public URL', async () => {
    const result = await adapter.write(
      'abc.png',
      Buffer.from('hello'),
      'image/png',
    );

    expect(result).toEqual({ url: '/media/file/abc.png', key: 'abc.png' });
  });

  it('round-trips write -> read', async () => {
    await adapter.write(
      'roundtrip.txt',
      Buffer.from('roundtrip content'),
      'text/plain',
    );

    const read = await adapter.read('roundtrip.txt');
    expect(read.toString()).toBe('roundtrip content');
  });

  it('throws StorageNotFoundError when reading a missing key', async () => {
    await expect(adapter.read('does-not-exist.txt')).rejects.toThrow(
      StorageNotFoundError,
    );
  });

  it('throws StorageNotFoundError when deleting a missing key', async () => {
    await expect(adapter.delete('does-not-exist.txt')).rejects.toThrow(
      StorageNotFoundError,
    );
  });

  it('deletes a written file', async () => {
    await adapter.write('to-delete.txt', Buffer.from('bye'), 'text/plain');
    await adapter.delete('to-delete.txt');

    await expect(adapter.read('to-delete.txt')).rejects.toThrow(
      StorageNotFoundError,
    );
  });

  it('rejects a key that attempts to escape the upload directory', async () => {
    await expect(
      adapter.write('../../etc/passwd', Buffer.from('x'), 'text/plain'),
    ).rejects.toThrow(StorageWriteError);
  });

  it('reports providerName as "local"', () => {
    expect(adapter.providerName).toBe('local');
  });
});
