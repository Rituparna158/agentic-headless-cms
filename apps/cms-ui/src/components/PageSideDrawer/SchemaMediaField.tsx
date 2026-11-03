import React, { useState, useEffect, useRef } from 'react';
import {
  ImageIcon,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Maximize2,
  Eye,
  UploadCloud,
  FileImage,
  Loader2,
} from 'lucide-react';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import { SchemaMediaFieldProps } from '@/types/pageSchemaMedia.types';

export const SchemaMediaField: React.FC<SchemaMediaFieldProps> = ({
  value,
  fieldApiId: _fieldApiId,
  fieldDisplayName = 'Media Asset',
  onChange,
  onOpenMediaPicker,
}) => {
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [isCopied, setIsCopied] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [directInputUrl, setDirectInputUrl] = useState('');
  const [showDirectInput, setShowDirectInput] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const fullUrl = value ? getMediaFileUrl(value) : '';

  useEffect(() => {
    setImageError(false);
    setNaturalSize(null);
    if (value) {
      setIsImageLoading(true);
      // Preload image to extract intrinsic resolution
      const img = new Image();
      img.src = getMediaFileUrl(value);
      img.onload = () => {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setIsImageLoading(false);
      };
      img.onerror = () => {
        setImageError(true);
        setIsImageLoading(false);
      };
    }
  }, [value]);

  const handleCopyUrl = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getAspectRatioLabel = (w: number, h: number) => {
    if (!w || !h) return '';
    const ratio = w / h;
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9 Landscape';
    if (Math.abs(ratio - 21 / 9) < 0.1) return '21:9 Ultrawide';
    if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3 Standard';
    if (Math.abs(ratio - 1) < 0.05) return '1:1 Square';
    if (ratio > 1.2) return `${ratio.toFixed(2)}:1 Wide`;
    if (ratio < 0.8) return `${(1 / ratio).toFixed(2)}:1 Tall`;
    return `${w}×${h}`;
  };

  return (
    <div className="space-y-2.5">
      {value && !imageError ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 shadow-lg space-y-3">
          {/* Main Visual Image Card - Spacious, Manageable Height (260px–320px) */}
          <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 group flex items-center justify-center">
            {/* Dark background pattern for transparent PNGs or contain mode */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #71717a 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            />

            {isImageLoading && (
              <div className="absolute inset-0 z-15 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs">
                <Loader2 className="size-6 text-indigo-400 animate-spin" />
              </div>
            )}

            <img
              ref={imgRef}
              src={fullUrl}
              alt={fieldDisplayName}
              className={`w-full h-full transition-all duration-300 relative z-10 ${
                fitMode === 'cover' ? 'object-cover' : 'object-contain'
              }`}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
                setIsImageLoading(false);
              }}
              onError={() => {
                setImageError(true);
                setIsImageLoading(false);
              }}
            />

            {/* Top Left: Live Resolution & Aspect Ratio Badge */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 flex-wrap">
              {naturalSize && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md border border-zinc-700/60 text-zinc-200 text-[11px] font-mono shadow-md">
                  <Maximize2 className="size-3 text-indigo-400" />
                  <span className="font-semibold">
                    {naturalSize.width} × {naturalSize.height} px
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">
                    {getAspectRatioLabel(naturalSize.width, naturalSize.height)}
                  </span>
                </div>
              )}
              {naturalSize && naturalSize.width >= 1200 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  HD
                </span>
              )}
            </div>

            {/* Top Right: Fit Mode Toggle (Cover vs Contain) & External View */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setFitMode((prev) => (prev === 'cover' ? 'contain' : 'cover'))
                }
                className="px-2.5 py-1 rounded-lg bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-700/60 text-zinc-300 hover:text-white text-[11px] font-medium backdrop-blur-md transition-colors shadow-md flex items-center gap-1 cursor-pointer"
                title={
                  fitMode === 'cover'
                    ? 'Switch to Contain (View Entire Uncropped Image)'
                    : 'Switch to Cover (Fill Frame)'
                }
              >
                <Eye className="size-3 text-indigo-400" />
                <span>{fitMode === 'cover' ? 'Cover' : 'Fit Entire'}</span>
              </button>

              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-700/60 text-zinc-300 hover:text-white backdrop-blur-md transition-colors shadow-md cursor-pointer"
                title="Open original image in new tab"
              >
                <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Hover Floating Actions Overlay */}
            <div className="absolute inset-0 z-20 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 backdrop-blur-xs">
              <button
                type="button"
                onClick={onOpenMediaPicker}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <ImageIcon className="size-3.5" />
                Change Asset
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                title="Copy asset URL"
              >
                {isCopied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                title="Remove image from field"
              >
                <Trash2 className="size-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Bottom Info Bar: Clean File Path & Quick Action Buttons */}
          <div className="flex items-center justify-between gap-3 px-1 text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileImage className="size-3.5 text-zinc-500 shrink-0" />
              <span
                className="truncate font-mono text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors select-all"
                title={value}
              >
                {value}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="text-[11px] font-medium text-zinc-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <Check className="size-3 text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <span className="text-zinc-700">•</span>

              <button
                type="button"
                onClick={onOpenMediaPicker}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Replace
              </button>

              <span className="text-zinc-700">•</span>

              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Image Upload Dropzone */
        <div className="rounded-2xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/60 hover:bg-zinc-900/40 transition-all p-6 text-center space-y-3 group">
          <div className="size-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <ImageIcon className="size-6" />
          </div>

          <div className="space-y-1">
            <h5 className="text-xs font-bold text-zinc-200">
              Select or Upload {fieldDisplayName}
            </h5>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Choose from your centralized visual media library or enter a
              custom web URL.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onOpenMediaPicker}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <UploadCloud className="size-3.5" />
              <span>Choose from Media Library</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDirectInput(!showDirectInput)}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              {showDirectInput ? 'Hide URL Input' : 'Paste Direct URL'}
            </button>
          </div>

          {/* Collapsible Direct URL Input */}
          {showDirectInput && (
            <div className="pt-2 max-w-md mx-auto flex items-center gap-2">
              <input
                type="text"
                value={directInputUrl}
                onChange={(e) => setDirectInputUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (directInputUrl.trim()) {
                    onChange(directInputUrl.trim());
                    setDirectInputUrl('');
                  }
                }}
                disabled={!directInputUrl.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
