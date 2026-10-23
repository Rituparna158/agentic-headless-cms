import type { PageEntry } from '@/types/content.types';

export type DynamicFieldDataType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'media'
  | 'color'
  | 'url'
  | 'email'
  | 'select'
  | 'rating'
  | 'code'
  | 'json'
  | 'relation'
  | 'enum';

export interface DynamicFieldConfig {
  options?: string[];
  placeholder?: string;
  default?: unknown;
  unit?: string;
  [key: string]: unknown;
}

export interface FieldTypeCategoryOption {
  type: DynamicFieldDataType;
  label: string;
}

export interface FieldTypeCategoryGroup {
  groupLabel: string;
  options: FieldTypeCategoryOption[];
}

export interface DynamicFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  requiredMessage?: string;
  [key: string]: unknown;
}

export interface DynamicFieldDefinition {
  apiId: string;
  displayName: string;
  dataType: DynamicFieldDataType;
  isRequired: boolean;
  isUnique?: boolean;
  isLocalized?: boolean;
  isRepeatable?: boolean;
  validation?: DynamicFieldValidation | null;
  config?: DynamicFieldConfig | null;
  sortOrder: number;
}

export interface SchemaForkInfo {
  schemaId: string;
  schemaSlug: string;
  schemaName: string;
  forkedAt: string;
  forkedBy?: string;
  sourceAppId?: string;
}

export interface SchemaLineage {
  isForked: boolean;
  forkedFrom?: SchemaForkInfo;
  forkCount: number;
  forkedSlugs?: string[];
}

export interface SchemaMetadata {
  is_public?: boolean;
  parent_schema_id?: string;
  parent_schema_name?: string;
  parent_schema_slug?: string;
  fork_count?: number;
  category?: 'ecommerce' | 'blog' | 'real-estate' | 'course' | 'custom';
  tags?: string[];
  version?: string;
  [key: string]: unknown;
}

export interface DynamicSchemaDefinition {
  name: string;
  slug: string;
  description?: string | null;
  type: 'collection' | 'single_type' | 'component';
  fields: DynamicFieldDefinition[];
  metadata?: SchemaMetadata;
  isPublic?: boolean;
  lineage?: SchemaLineage;
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

export type PostBlockType =
  | 'heading'
  | 'button'
  | 'html_embed'
  | 'text'
  | 'image';

export interface PostBodyBlock {
  id: string;
  type: PostBlockType;
  headingLevel?: 1 | 2 | 3;
  text?: string;
  buttonUrl?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  htmlContent?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface PostCrossSiteLink {
  siteId: string;
  collectionSlug: string;
  entryIds: string[];
}

export interface PostBodyData {
  format: 'html' | 'markdown' | 'composed';
  html?: string;
  markdown?: string;
  blocks?: PostBodyBlock[];
  targetApplication?: string;
  targetPageSlug?: string;
  crossSiteLinks?: PostCrossSiteLink[];
  [key: string]: unknown;
}

export interface DynamicContentEntry {
  id: string;
  schemaId: string;
  schemaSlug: string;
  locale: string;
  status: 'draft' | 'published';
  title: string;
  slug?: string;
  data: {
    title: string;
    slug?: string;
    body?: PostBodyData | string | unknown;
    body_html?: string;
    body_md?: string;
    [key: string]: unknown;
  };
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageLayoutSlot {
  slotId: string;
  label: string;
  fieldApiId: string;
  fieldType: DynamicFieldDataType;
}

export interface PageLayoutTemplate {
  id: string;
  title: string;
  slug: string;
  schemaSlug: string;
  description?: string;
  slots: PageLayoutSlot[];
  layoutData?: unknown;
  isPublic: boolean;
  sourceAppId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrossSiteSharedTemplate {
  id: string;
  title: string;
  category: 'ecommerce' | 'blog' | 'real-estate' | 'course' | 'custom';
  description: string;
  schema: DynamicSchemaDefinition;
  layoutHtml?: string;
  layoutCss?: string;
  slots: PageLayoutSlot[];
  isPublic: boolean;
  forkCount: number;
  authorSite: string;
  previewImageUrl?: string;
}

export interface ImportValidationIssue {
  entryIndex?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  totalParsed: number;
  validEntries: Array<Record<string, unknown>>;
  issues: ImportValidationIssue[];
  successCount: number;
  failedCount: number;
}

export interface PageCustomSchema {
  id: string;
  name: string;
  slug: string;
  description?: string;
  entryType?: 'single' | 'multi';
  fields: DynamicFieldDefinition[];
  values?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;
}

export type PageSideDrawerView = 'table' | 'builder' | 'form';

export interface EditingFieldFormData {
  originalApiId: string;
  displayName: string;
  apiId: string;
  dataType: DynamicFieldDataType;
  isRequired: boolean;
  initialValue: string;
}

export interface PageSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ContentCollectionMeta | null | undefined;
  page: PageEntry | null | undefined;
  onSavePage: (
    pageId: string,
    data: Record<string, unknown>,
    publishImmediately: boolean,
  ) => Promise<void>;
  isSaving: boolean;
}

export type {
  PageMetaDrawerHeaderProps,
  PageSchemaListProps,
  FieldEditorModalProps,
  PageSchemaBuilderProps,
  PageSchemaFormProps,
  PageDrawerFooterProps,
} from './drawer.types';
