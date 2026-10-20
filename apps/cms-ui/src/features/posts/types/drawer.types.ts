import type { Dispatch, SetStateAction, FormEvent } from 'react';
import type {
  DynamicFieldDataType,
  DynamicFieldDefinition,
  PageCustomSchema,
  EditingFieldFormData,
} from './posts.types';

export interface PageMetaDrawerHeaderProps {
  collectionName: string;
  collectionSlug: string;
  cleanSlug: string;
  pageId: string;
  pageTitle: string;
  onPageTitleChange: (title: string) => void;
  isPublished: boolean;
  onOpenPreview: () => void;
  onOpenCanvas: () => void;
  onClose: () => void;
}

export interface PageSchemaListProps {
  pageSchemas: PageCustomSchema[];
  onStartCreateSchema: () => void;
  onStartEditSchema: (schema: PageCustomSchema) => void;
  onSelectFillContent: (schemaId: string) => void;
  onDeleteSchema: (schemaId: string, schemaName: string) => void;
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
  isSaving: boolean;
  onBackToOverview: () => void;
  onStartEditField: (field: DynamicFieldDefinition) => void;
  onRemoveField: (apiId: string) => void;
  onSaveEditedField: (e?: FormEvent) => void;
  onAddField: (e: FormEvent) => void;
  onSaveSchema: () => void;
}

export interface PageSchemaFormProps {
  schema: PageCustomSchema;
  copiedToken: string | null;
  isSaving: boolean;
  onCopyToken: (slot: string) => void;
  onFieldValueChange: (fieldApiId: string, value: unknown) => void;
  onBackToSchemas: () => void;
  onSaveForm: () => void;
}

export interface PageDrawerFooterProps {
  isPublished: boolean;
  isSaving: boolean;
  onSaveDraft: () => void;
  onPublishLive: () => void;
}
