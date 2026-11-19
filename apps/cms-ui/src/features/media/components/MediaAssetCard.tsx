import { activateOnKey } from '@/utils/a11y.util';
import React, { useState } from 'react';
import { Copy, Check, Eye, Trash2, FileText, Film, Tag } from 'lucide-react';
import type { MediaAssetCardProps } from '../types/media.types';
import {
  formatBytes,
  getFileExtension,
  getMediaFileUrl,
  getMimeCategory,
} from '../utils/media.util';
import { useToast } from '@repo/shared-ui';

export const MediaAssetCard: React.FC<MediaAssetCardProps> = ({
  asset,
  isSelected = false,
  onToggleSelect,
  onViewDetails,
  onDelete,
  onSelect,
  isPickerMode = false,
  usedInSites = [],
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fullUrl = getMediaFileUrl(asset.url);
  const ext = getFileExtension(asset.filename) || 'FILE';
  const category = getMimeCategory(asset.mimeType);

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Asset URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(asset);
    } else if (onToggleSelect) {
      onToggleSelect(asset);
    } else if (onViewDetails) {
      onViewDetails(asset);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- card holds its own controls, so it cannot be role=button
    <div
      role="group"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above
      tabIndex={0}
      aria-label={asset.filename}
      onClick={handleCardClick}
      onKeyDown={activateOnKey(handleCardClick)}
      className={`group relative flex flex-col bg-card text-card-foreground rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
          : 'border-border hover:border-primary/40'
      }`}
    >
      {/* Top Preview Container */}
      <div className="relative aspect-video w-full bg-muted/60 flex items-center justify-center overflow-hidden">
        {category === 'image' && !imageError ? (
          <img
            src={fullUrl}
            alt={asset.altText || asset.filename}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : category === 'video' ? (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Film className="w-8 h-8 text-primary" />
            <span className="text-[10px] font-mono uppercase">Video</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <FileText className="w-8 h-8 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase">Document</span>
          </div>
        )}

        {/* Format Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider rounded-md bg-background/90 text-foreground border border-border uppercase backdrop-blur-sm shadow-xs">
            {ext}
          </span>
        </div>

        {/* Selection Checkbox */}
        {onToggleSelect && (
          <div
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`Select ${asset.filename}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleSelect(asset);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(asset);
            }}
            className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background/90 border-border text-transparent hover:border-primary opacity-0 group-hover:opacity-100 shadow-xs'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
          <div className="flex items-center gap-1.5">
            {onViewDetails && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(asset);
                }}
                className="p-1.5 rounded-lg bg-background/90 text-foreground hover:bg-muted border border-border shadow-xs transition-colors"
                title="View Details"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg bg-background/90 text-foreground hover:bg-muted border border-border shadow-xs transition-colors"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {onDelete && !isPickerMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset);
              }}
              className="p-1.5 rounded-lg bg-background/90 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border shadow-xs transition-colors"
              title="Delete Asset"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isPickerMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(asset);
              }}
              className="px-3 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Asset Info */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-1">
        <p
          className="text-xs font-semibold text-foreground truncate"
          title={asset.filename}
        >
          {asset.filename}
        </p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>{formatBytes(asset.sizeBytes)}</span>
          {asset.width && asset.height ? (
            <span>
              {asset.width} × {asset.height}
            </span>
          ) : (
            <span className="capitalize">{category}</span>
          )}
        </div>

        {/* Screen 9: Multi-Site Usage Badge */}
        <div className="pt-1 mt-0.5 border-t border-border/40 flex items-center justify-between">
          {usedInSites && usedInSites.length > 0 ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate max-w-full"
              title={`Used on: ${usedInSites.join(', ')}`}
            >
              <Tag className="size-2.5 shrink-0" />
              <span className="truncate">{usedInSites.join(', ')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/60">
              <Tag className="size-2.5 shrink-0" />
              <span>Unused</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
