'use client';

import { useState } from 'react';
import { MediaUploadDropzone } from './media-upload-dropzone';
import { MediaGrid } from './media-grid';
import { MediaFolderTree } from './media-folder-tree';

export function MediaLibraryView() {
  const [activeFolderId, setActiveFolderId] = useState<string>('root');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1 border rounded-lg p-4 bg-card text-card-foreground shadow-sm">
        <MediaFolderTree
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
        />
      </div>
      <div className="md:col-span-3 grid gap-6">
        <MediaUploadDropzone folderId={activeFolderId} />
        <MediaGrid folderId={activeFolderId} />
      </div>
    </div>
  );
}
