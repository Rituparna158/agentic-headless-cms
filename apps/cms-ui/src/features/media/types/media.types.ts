import type {
  MediaAsset,
  ListMediaResult,
  MediaFolder,
  CreateMediaFolderInput,
  ListMediaOptions,
} from '@repo/types';

export type {
  MediaAsset,
  ListMediaResult,
  MediaFolder,
  CreateMediaFolderInput,
  ListMediaOptions,
};

export type MediaViewMode = 'grid' | 'list';

export interface MediaFilterOptions {
  folderId?: string; // undefined = all, 'root' = uncategorized, or folderId
  search?: string;
  mimeTypeGroup?: 'all' | 'image' | 'video' | 'document';
}

export interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  altText?: string;
  targetFolderId?: string;
  error?: string;
  asset?: MediaAsset;
}

export interface MediaAssetCardProps {
  asset: MediaAsset;
  isSelected?: boolean;
  onToggleSelect?: (asset: MediaAsset) => void;
  onViewDetails?: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
  onSelect?: (asset: MediaAsset) => void;
  isPickerMode?: boolean;
}

export interface MediaAssetDetailModalProps {
  asset: MediaAsset | null;
  folders: MediaFolder[];
  onClose: () => void;
  onDelete?: (asset: MediaAsset) => void;
}

export interface MediaAssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  title?: string;
  allowedTypes?: string[]; // e.g. ['image/*']
}

export interface MediaFoldersSidebarProps {
  folders: MediaFolder[];
  isLoading?: boolean;
  selectedFolderId?: string; // undefined = all, 'root' = uncategorized, or uuid
  onSelectFolder: (folderId: string | undefined) => void;
  className?: string;
}

export interface MediaGridProps {
  assets: MediaAsset[];
  totalCount: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => void;
  viewMode?: MediaViewMode;
  selectedAssetIds: Set<string>;
  onToggleSelect: (asset: MediaAsset) => void;
  onViewDetails: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
  onSelect?: (asset: MediaAsset) => void;
  onOpenUpload?: () => void;
  isPickerMode?: boolean;
  className?: string;
}

export interface MediaUploadZoneProps {
  currentFolderId?: string;
  folders: MediaFolder[];
  onUploadComplete?: (asset: MediaAsset) => void;
  className?: string;
}

export interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  altText: string;
  folderId?: string;
}
