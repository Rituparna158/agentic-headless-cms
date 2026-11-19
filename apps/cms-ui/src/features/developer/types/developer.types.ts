import type { DynamicFieldDefinition } from '@/types/content.types';

export interface SchemaModelData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  entryType: 'single' | 'multi';
  fields: DynamicFieldDefinition[];
  metadata?: Record<string, unknown>;
}

export interface SchemaModelBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schema: SchemaModelData | null;
  onSave: (data: SchemaModelData) => Promise<void>;
  isSaving: boolean;
}

export interface DeveloperTemplateItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  boundSchema: string;
  pageId: string;
}

export interface SchemaToDeleteItem {
  id: string;
  name: string;
  assignedCount: number;
}

export interface AggregatedSchema {
  id: string;
  name: string;
  slug: string;
  entryType: 'single' | 'multi';
  fieldsCount: number;
  assignedPagesCount: number;
  fields: DynamicFieldDefinition[];
}
