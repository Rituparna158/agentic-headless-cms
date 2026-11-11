'use client';

import { useState } from 'react';
import { MediaUploadDropzone } from './media-upload-dropzone';
import { MediaGrid } from './media-grid';
import { MediaFolderTree } from './media-folder-tree';
import { Button } from '@repo/shared-ui';
import { UploadCloud, ChevronDown, ChevronUp, Folder } from 'lucide-react';

export function MediaLibraryView() {
  const [activeFolderId, setActiveFolderId] = useState<string>('root');
  const [showUpload, setShowUpload] = useState<boolean>(true);
  const [showFolderSidebar, setShowFolderSidebar] = useState<boolean>(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Folder Directory Sidebar (Collapsible on mobile/tablet, persistent on desktop) */}
      <div className="lg:col-span-1 space-y-2">
        <div className="flex items-center justify-between lg:hidden pb-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-9 text-xs font-medium"
            onClick={() => setShowFolderSidebar((prev) => !prev)}
          >
            <span className="flex items-center gap-1.5">
              <Folder className="size-3.5 text-primary" />
              <span>Folder:</span>
              <strong className="text-foreground">
                {activeFolderId === 'root' ? 'Root Library' : 'Subfolder'}
              </strong>
            </span>
            {showFolderSidebar ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>

        <div
          className={`${
            showFolderSidebar ? 'block' : 'hidden'
          } lg:block rounded-xl border border-border/70 p-3.5 bg-card text-card-foreground shadow-xs`}
        >
          <MediaFolderTree
            activeFolderId={activeFolderId}
            onSelectFolder={(id) => {
              setActiveFolderId(id);
              setShowFolderSidebar(false);
            }}
          />
        </div>
      </div>

      {/* Main Asset Canvas */}
      <div className="lg:col-span-3 space-y-4 min-w-0">
        {/* Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Directory:
            </span>
            <span className="text-xs font-semibold text-foreground px-2 py-0.5 rounded-md bg-muted/60 border border-border/60">
              {activeFolderId === 'root' ? 'Root Library' : 'Subfolder'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium border-border/80"
            onClick={() => setShowUpload((prev) => !prev)}
          >
            <UploadCloud className="size-3.5 text-primary" />
            <span>{showUpload ? 'Hide Upload Zone' : 'Upload Assets'}</span>
            {showUpload ? (
              <ChevronUp className="size-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Collapsible Drag-and-Drop Area */}
        {showUpload && <MediaUploadDropzone folderId={activeFolderId} />}

        {/* Assets Grid & Inspection */}
        <MediaGrid folderId={activeFolderId} />
      </div>
    </div>
  );
}
