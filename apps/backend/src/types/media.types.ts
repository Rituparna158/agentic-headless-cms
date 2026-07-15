export interface CreateMediaAssetInput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  url: string;
  altText?: string | null;
  metadata?: Record<string, unknown> | null;
  storageProvider: string;
  folderId?: string | null;
  actorType: 'user' | 'agent' | 'system';
  uploadedByUserId?: string | null;
  uploadedByAgentId?: string | null;
}

export interface ListMediaOptions {
  page: number;
  pageSize: number;
  folderId?: string;
}

export interface UploadMediaInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  altText?: string;
  folderId?: string;
  actorUserId: string;
}

export interface ServedFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}
