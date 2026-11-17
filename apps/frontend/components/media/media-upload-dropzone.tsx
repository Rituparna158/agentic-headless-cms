'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

import { uploadMedia } from '@/lib/api/media';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function MediaUploadDropzone({ folderId }: { folderId?: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      uploadMedia(file, {
        folderId: folderId === 'root' ? undefined : folderId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setError(null);

      if (rejections.length > 0) {
        setError('Some files were rejected.');
      }

      for (const file of acceptedFiles) {
        uploadMutation.mutate(file, {
          onError: (uploadError) => {
            setError(
              uploadError instanceof ApiError
                ? uploadError.message
                : `Failed to upload "${file.name}".`,
            );
          },
        });
      }
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [], 'application/pdf': [] },
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-all cursor-pointer select-none',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-muted/10',
        )}
      >
        <input {...getInputProps()} aria-label="Upload files" />
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
          <UploadCloud className="size-5" />
        </div>

        <div className="space-y-0.5">
          {isDragActive ? (
            <p className="font-medium text-primary text-xs">
              Drop files to upload…
            </p>
          ) : (
            <p className="font-medium text-foreground text-xs">
              Drag and drop files here, or click to select files
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Supports JPG, PNG, WebP, SVG, PDF, MP4 up to 50MB
          </p>
        </div>
      </div>

      {uploadMutation.isPending && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
          <span>Uploading…</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
