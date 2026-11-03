import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useUploadMedia } from '../hooks/useMediaQueries';
import type { MediaUploadZoneProps, QueuedFile } from '../types/media.types';
import { formatBytes } from '../utils/media.util';
import { useToast } from '@repo/shared-ui';

export const MediaUploadZone: React.FC<MediaUploadZoneProps> = ({
  currentFolderId,
  folders,
  onUploadComplete,
  className = '',
}) => {
  const toast = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMedia();

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: QueuedFile[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: f,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
      status: 'pending',
      progress: 0,
      altText: '',
      folderId: currentFolderId === 'root' ? undefined : currentFolderId,
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemoveQueued = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleUploadAll = async () => {
    const pendingItems = queue.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) return;

    for (const item of pendingItems) {
      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)),
      );

      try {
        const asset = await uploadMutation.mutateAsync({
          file: item.file,
          options: {
            altText: item.altText.trim() || undefined,
            folderId: item.folderId,
            onProgress: (percent) => {
              setQueue((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, progress: percent } : i,
                ),
              );
            },
          },
        });

        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'success', progress: 100 } : i,
          ),
        );

        toast.success(`Uploaded ${item.file.name}`);
        if (onUploadComplete) onUploadComplete(asset);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: errorMsg } : i,
          ),
        );
        toast.error(`Failed to upload ${item.file.name}`);
      }
    }
  };

  const pendingCount = queue.filter((i) => i.status === 'pending').length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-primary/10 scale-[0.99]'
            : 'border-border hover:border-primary/50 bg-card/60 hover:bg-muted/40 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary shadow-sm">
          <UploadCloud className="size-6 stroke-[1.75]" />
        </div>

        <p className="text-sm font-semibold text-foreground mb-1">
          Click to upload or drag & drop visual assets
        </p>
        <p className="text-xs text-muted-foreground">
          SVG, PNG, JPG, WEBP, GIF, or Video up to 10MB
        </p>
      </div>

      {/* Queue List */}
      {queue.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">
              Upload Queue ({queue.length} files)
            </span>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={uploadMutation.isPending}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UploadCloud className="size-4" />
                )}
                Upload All Pending ({pendingCount})
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border"
              >
                {/* Thumbnail Preview */}
                <div className="size-10 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <File className="size-5 text-muted-foreground" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {item.file.name}
                    </p>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>

                  {/* Folder selector & Alt text input */}
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mt-1">
                      <select
                        value={item.folderId || ''}
                        onChange={(e) => {
                          const val = e.target.value || undefined;
                          setQueue((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...i, folderId: val } : i,
                            ),
                          );
                        }}
                        className="px-2 py-1 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Root / Uncategorized</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Alt text / description..."
                        value={item.altText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQueue((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...i, altText: val } : i,
                            ),
                          );
                        }}
                        className="flex-1 px-2.5 py-1 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  {/* Progress Bar */}
                  {item.status === 'uploading' && (
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-150"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {item.status === 'error' && (
                    <p className="text-[11px] text-destructive mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="size-3" />
                      {item.error || 'Upload error'}
                    </p>
                  )}
                </div>

                {/* Status Indicator / Actions */}
                <div className="shrink-0">
                  {item.status === 'uploading' && (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle className="size-4 text-emerald-500" />
                  )}
                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQueued(item.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Remove from queue"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
