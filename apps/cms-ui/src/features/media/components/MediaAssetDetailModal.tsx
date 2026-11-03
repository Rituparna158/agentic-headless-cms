import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  Maximize2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import type { MediaAssetDetailModalProps } from '../types/media.types';
import {
  formatBytes,
  formatDate,
  getMediaFileUrl,
  getMimeCategory,
} from '../utils/media.util';
import { useToast } from '@repo/shared-ui';

export const MediaAssetDetailModal: React.FC<MediaAssetDetailModalProps> = ({
  asset,
  folders,
  onClose,
  onDelete,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!asset) return null;

  const fullUrl = getMediaFileUrl(asset.url);
  const category = getMimeCategory(asset.mimeType);
  const folder = folders.find((f) => f.id === asset.folderId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Asset URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-card-foreground">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 truncate">
            <h3 className="text-base font-bold text-foreground truncate">
              {asset.filename}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left Preview */}
          <div className="flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-border p-4 min-h-[300px]">
            {category === 'image' ? (
              <img
                src={fullUrl}
                alt={asset.altText || asset.filename}
                className="max-h-[360px] w-auto max-w-full object-contain rounded-xl shadow-md"
              />
            ) : category === 'video' ? (
              <video
                src={fullUrl}
                controls
                className="max-h-[360px] w-full rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
                <FileText className="size-16" />
                <span className="text-xs uppercase font-mono tracking-wider">
                  {asset.mimeType}
                </span>
              </div>
            )}
          </div>

          {/* Right Metadata */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  File Details
                </span>
                <div className="mt-2 space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <HardDrive className="size-3.5" /> File Size
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatBytes(asset.sizeBytes)}
                    </span>
                  </div>

                  {asset.width && asset.height && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Maximize2 className="size-3.5" /> Dimensions
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {asset.width} × {asset.height} px
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <FileText className="size-3.5" /> MIME Type
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {asset.mimeType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                    <span className="text-muted-foreground">Folder</span>
                    <span className="font-semibold text-foreground">
                      {folder ? folder.name : 'Root / Uncategorized'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="size-3.5" /> Uploaded
                    </span>
                    <span className="text-foreground">
                      {formatDate(asset.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Public URL Box */}
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Public Resource Link
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="flex-1 px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground font-mono truncate focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-primary-foreground" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Open in new tab"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <a
                href={fullUrl}
                download={asset.filename}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="size-3.5" />
                Download
              </a>

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(asset);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  Delete Asset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
