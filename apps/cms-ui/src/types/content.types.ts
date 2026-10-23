export type DynamicFieldDataType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'media'
  | 'select'
  | 'color'
  | 'rating'
  | 'code'
  | 'json'
  | 'relation'
  | 'url'
  | 'email'
  | 'enum';

export interface DynamicFieldDefinition {
  displayName: string;
  apiId: string;
  dataType: DynamicFieldDataType;
  isRequired?: boolean;
  isUnique?: boolean;
  isLocalized?: boolean;
  isRepeatable?: boolean;
  sortOrder?: number;
  options?: Array<{ label: string; value: string }>;
  relationSchemaId?: string;
  validation?: Record<string, unknown> | null;
  config?: Record<string, unknown> | null;
}

export interface PageCustomSchema {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: DynamicFieldDefinition[];
  values: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageEntryData {
  title?: string;
  slug?: string;
  _schemas?: PageCustomSchema[];
  [key: string]: unknown;
}

export interface PageEntry {
  id: string;
  schemaId?: string;
  slug?: string;
  title?: string;
  locale?: string;
  status?: 'draft' | 'published' | 'archived' | string;
  version?: number;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  scheduledStatus?: string | null;
  data?: PageEntryData;
  publishedData?: unknown;
  updatedBy?: string | null;
  collaborators?: string | null;
  createdAt?: string;
  updatedAt?: string;
  schema?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SchemaMetadata {
  is_public?: boolean;
  parent_schema_id?: string;
  parent_schema_slug?: string;
  parent_schema_name?: string;
  forked_at?: string;
  fork_count?: number;
  [key: string]: unknown;
}

export interface SchemaLineage {
  isForked: boolean;
  forkedFrom?: {
    schemaId: string;
    schemaSlug: string;
    schemaName: string;
    forkedAt: string;
  };
  forkCount: number;
}

export interface ContentCollectionMeta {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: 'collection' | 'single_type' | 'component';
  status?: string;
  entryCount: number;
  linkedPagesCount: number;
  fields: DynamicFieldDefinition[];
  metadata?: SchemaMetadata;
  isPublic?: boolean;
  lineage?: SchemaLineage;
  sourceAppId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicContentEntry {
  id: string;
  collectionSlug: string;
  schemaId?: string;
  locale?: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface CrossSiteSharedTemplate {
  id: string;
  sourceSiteName: string;
  sourceSiteUrl: string;
  schema: ContentCollectionMeta;
  sampleEntryCount: number;
  isVerified: boolean;
  tags: string[];
}
