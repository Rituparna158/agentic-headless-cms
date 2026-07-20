import type { SchemaDefinition } from './schema-definition.js';

// General

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

// Access Module

export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionRecord[];
}

export interface PermissionRecord {
  id: string;
  roleId: string;
  schemaId: string | null;
  action: 'read' | 'create' | 'update' | 'delete' | 'publish' | '*';
  effect: 'allow' | 'deny';
  fields: string[] | null;
  condition: Record<string, unknown> | null;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: string;
  createdAt: string;
}

export interface TokenRecord {
  id: string;
  name: string;
  type: string;
  scopes: string[];
  roleId?: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  rawToken?: string; // only present on creation
}

// Content Module

export interface ContentEntryRecord {
  id: string;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
  publishedData: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentVersionRecord {
  id: string;
  entryId: string;
  locale: string;
  versionNo: number;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
  actorType: 'user' | 'agent' | 'system';
  createdByUserId?: string | null;
  createdByAgentId?: string | null;
  comment?: string | null;
  createdAt: string;
}

export interface ListContentEntriesOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  locale?: string;
  filters?: Record<string, Record<string, string>>;
}

export interface ListContentEntriesResult {
  data: ContentEntryRecord[];
  meta: { pagination: PaginationMeta };
}

// Media Module

export interface MediaAsset {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
  altText: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListMediaOptions {
  page?: number;
  pageSize?: number;
  folderId?: string;
}

export interface ListMediaResult {
  data: MediaAsset[];
  meta: { pagination: PaginationMeta };
}

// Schemas Module

export interface SchemaRecord {
  id: string;
  name: string;
  slug: string;
  type: 'collection' | 'single_type' | 'component';
  definition: SchemaDefinition;
  status: 'draft' | 'published';
  version: number;
  createdAt: string;
  updatedAt: string;
}
