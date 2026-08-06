export type SchemaFieldDataType =
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json'
  | 'media'
  | 'relation'
  | 'email'
  | 'url'
  | 'enum';

export interface SchemaField {
  apiId: string;
  displayName: string;
  dataType: SchemaFieldDataType;
  isRequired: boolean;
  isUnique: boolean;
  isLocalized: boolean;
  isRepeatable: boolean;
  validation?: Record<string, unknown> | null;
  config?: Record<string, unknown> | null;
  sortOrder: number;
}

export interface SchemaDefinition {
  fields: SchemaField[];
}

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

export interface CreateSchemaInput {
  name: string;
  slug: string;
  type: 'collection' | 'single_type' | 'component';
  fields: SchemaField[];
}

export interface UpdateSchemaInput {
  name?: string;
  fields?: SchemaField[];
  migrationNotes?: string;
}
