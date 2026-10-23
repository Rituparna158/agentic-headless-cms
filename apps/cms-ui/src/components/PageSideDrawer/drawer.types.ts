import type { Dispatch, SetStateAction, FormEvent } from 'react';
import type {
  DynamicFieldDataType,
  DynamicFieldDefinition,
  PageCustomSchema,
  ContentCollectionMeta,
  PageEntry,
} from '@/types/content.types';

export interface EditingFieldFormData {
  originalApiId: string;
  displayName: string;
  apiId: string;
  dataType: DynamicFieldDataType;
  isRequired: boolean;
  initialValue: string;
}

export type PageSideDrawerView = 'table' | 'builder' | 'form';

export interface PageSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ContentCollectionMeta | null | undefined;
  page: PageEntry | null | undefined;
  collectionPages?: PageEntry[];
  onSavePage: (
    pageId: string,
    data: Record<string, unknown>,
    publishImmediately: boolean,
  ) => Promise<void>;
  isSaving?: boolean;
}

export interface PageMetaDrawerHeaderProps {
  collectionName: string;
  collectionSlug: string;
  cleanSlug: string;
  pageId: string;
  pageTitle: string;
  onPageTitleChange?: (title: string) => void;
  isPublished: boolean;
  onOpenPreview: () => void;
  onOpenCanvas: () => void;
  onClose: () => void;
}

export interface PageSchemaListProps {
  pageSchemas: PageCustomSchema[];
  collectionSchemas?: Array<{
    pageId: string;
    pageTitle: string;
    schema: PageCustomSchema;
  }>;
  onStartCreateSchema: () => void;
  onStartEditSchema: (schema: PageCustomSchema) => void;
  onSelectFillContent: (schemaId: string) => void;
  onDeleteSchema: (schemaId: string, schemaName: string) => void;
  onUseCollectionSchema?: (
    sourceSchema: PageCustomSchema,
    sourcePageTitle: string,
  ) => void;
}

export interface FieldEditorModalProps {
  editingFieldData: EditingFieldFormData;
  setEditingFieldData: Dispatch<SetStateAction<EditingFieldFormData | null>>;
  onApplyChanges: () => void;
  onCancel: () => void;
}

export interface PageSchemaBuilderProps {
  editingSchemaId: string | null;
  builderName: string;
  setBuilderName: (name: string) => void;
  builderSlug: string;
  setBuilderSlug: (slug: string) => void;
  builderDesc: string;
  setBuilderDesc: (desc: string) => void;
  builderEntryType: 'single' | 'multi';
  setBuilderEntryType: (type: 'single' | 'multi') => void;
  builderFields: DynamicFieldDefinition[];
  builderInitialValues: Record<string, unknown>;
  editingFieldData: EditingFieldFormData | null;
  setEditingFieldData: Dispatch<SetStateAction<EditingFieldFormData | null>>;
  newFieldName: string;
  setNewFieldName: (val: string) => void;
  newFieldApiId: string;
  setNewFieldApiId: (val: string) => void;
  newFieldType: DynamicFieldDataType;
  setNewFieldType: (val: DynamicFieldDataType) => void;
  newFieldRequired: boolean;
  setNewFieldRequired: (val: boolean) => void;
  newFieldInitialValue: string;
  setNewFieldInitialValue: (val: string) => void;
  isSaving?: boolean;
  onBackToOverview: () => void;
  onStartEditField: (field: DynamicFieldDefinition) => void;
  onRemoveField: (apiId: string) => void;
  onSaveEditedField: (e?: FormEvent) => void;
  onAddField: (e: FormEvent) => void;
  onSaveSchema: () => Promise<void>;
}

export interface PageSchemaFormProps {
  schema: PageCustomSchema;
  copiedToken: string | null;
  activeItemIndex?: number;
  isSaving?: boolean;
  onCopyToken: (slot: string) => void;
  onFieldValueChange: (fieldApiId: string, value: unknown) => void;
  onSelectActiveItem?: (index: number) => void;
  onAddItem?: () => void;
  onDeleteItem?: (index: number) => void;
  onBackToSchemas: () => void;
  onSaveForm: () => Promise<void>;
}

export interface PageDrawerFooterProps {
  isPublished: boolean;
  isSaving?: boolean;
  onSaveDraft: () => Promise<void>;
  onPublishLive: () => Promise<void>;
}
