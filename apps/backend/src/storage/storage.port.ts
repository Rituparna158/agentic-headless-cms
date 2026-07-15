export interface StorageWriteResult {
  /** Public-facing URL clients use to fetch the object (local: served via GET /media/file/:key; S3: bucket URL or CDN front). */
  url: string;
  /** Adapter-internal identifier used for subsequent read()/delete() calls — not necessarily derivable from `url` alone (e.g. a CDN-fronted URL hides the S3 key). */
  key: string;
}

/**
 * Unified storage interface — mirrors `@repo/shared-db`'s `DatabasePort`
 * pattern (issue #13) so callers depend on this abstraction, never on
 * `LocalAdapter`/`S3Adapter` directly, per FR-MD-3 (no code ties business
 * logic to a single cloud provider).
 */
export interface StoragePort {
  write(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<StorageWriteResult>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** Discriminator persisted on `media_assets.storage_provider` — lets a row record which adapter wrote it, independent of which adapter is currently active. */
  readonly providerName: string;
}
