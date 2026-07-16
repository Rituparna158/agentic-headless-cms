'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud } from 'lucide-react';

import { uploadMedia } from '@/lib/api/media';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function MediaUploadDropzone() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadMedia(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setError(null);

      if (rejections.length > 0) {
        setError('Some files were rejected.');
      }

      // Uploaded sequentially rather than in parallel — the backend has no
      // bulk-upload endpoint, and firing every file's request at once would
      // make partial-failure handling and per-file error reporting much
      // harder for no real benefit at typical drag-and-drop batch sizes.
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
    <div className="grid gap-2">
      <div
        {...getRootProps()}
        className={cn(
          'border-input flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center text-sm transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'text-muted-foreground',
        )}
      >
        <input {...getInputProps()} aria-label="Upload files" />
        <UploadCloud className="size-6" />
        {isDragActive ? (
          <p>Drop files to upload…</p>
        ) : (
          <p>Drag and drop files here, or click to select files</p>
        )}
      </div>

      {uploadMutation.isPending ? (
        <p className="text-muted-foreground text-sm">Uploading…</p>
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
