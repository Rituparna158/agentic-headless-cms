import {
  MediaModule,
  type HttpTransport,
  type UploadMediaOptions,
} from '@mindfiredigital/sdk-core';
import type { MediaAsset } from '@repo/types';
import { readFileSync } from 'fs';
import { basename, extname } from 'path';

const MIME_TYPES_BY_EXT: Record<string, string> = {
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.csv': 'text/csv',
  '.gif': 'image/gif',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.m4a': 'audio/mp4',
  '.md': 'text/markdown',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.txt': 'text/plain',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
};

function inferMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES_BY_EXT[ext] || 'application/octet-stream';
}

export class NodeMediaModule extends MediaModule {
  constructor(transport: HttpTransport) {
    super(transport);
  }

  /**
   * Uploads a file from the local file system.
   * Node.js specific extension to the MediaModule.
   */
  public async uploadFromPath(
    filePath: string,
    options?: UploadMediaOptions,
  ): Promise<MediaAsset> {
    const buffer = readFileSync(filePath);
    const mimeType = options?.mimeType || inferMimeType(filePath);
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    const file = new File([blob], basename(filePath), { type: mimeType });
    return this.upload(file, options);
  }
}
