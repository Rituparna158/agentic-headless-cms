'use client';

import { MediaUploadDropzone } from './media-upload-dropzone';
import { MediaGrid } from './media-grid';

export function MediaLibraryView() {
  return (
    <div className="grid gap-6">
      <MediaUploadDropzone />
      <MediaGrid />
    </div>
  );
}
