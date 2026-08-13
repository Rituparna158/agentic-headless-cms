import {
  MediaModule,
  type HttpTransport,
  type UploadMediaOptions,
} from '@repo/sdk-core';
import type { MediaAsset } from '@repo/types';
import { readFileSync } from 'fs';
import { basename } from 'path';

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
    const blob = new Blob([buffer]);
    const file = new File([blob], basename(filePath));
    return this.upload(file, options);
  }
}
